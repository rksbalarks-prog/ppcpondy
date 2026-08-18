// Gathers the numbers behind "Pondy Properties | Admin" — the Admin Report.
//
// This is a server-side port of
// Pondy Properties ADMIN/src/AdminReport.jsx (fetchYesterdayData).
// It calls the SAME 17 public endpoints the screen calls, over localhost,
// rather than re-querying Mongo — so the PDF cannot drift from the page just
// because somebody changed a route's filtering.
//
// No `base` query parameter is sent, which cityScopePlugin reads as "no
// restriction" — i.e. the All Cities view the screen defaults to.
//
// IMPORTANT: the tab labels, row order and derivation of every figure below
// mirror AdminReport.jsx. If that screen changes, change this too.
//
// Two figures read a field that is easy to get wrong, and the screen did get
// them wrong until 2026-08-15 (it filtered a field the endpoint never returns,
// so both rows sat at 0 forever). Screen and mail now agree; keep them that way:
//
//   VIEWED PROPERTIES  timestamps live on each nested `viewers[]` entry, NOT on
//                      the property — no property carries a top-level viewedAt.
//   CALLED LIST        the contact log's timestamp is `contactedAt`; these rows
//                      have no createdAt at all.
//
// `report.notes` still exists and is rendered under the tables — it is the
// channel for telling a reader why a figure differs from the screen, should a
// divergence ever be needed again.

const axios = require('axios');
const moment = require('moment');

const API_BASE = String(
  process.env.ADMIN_REPORT_API_BASE || `http://127.0.0.1:${process.env.PORT || 5006}/PPC`
).replace(/\/+$/, '');

const TIMEOUT_MS = Number(process.env.ADMIN_REPORT_TIMEOUT_MS) || 120000;

// Per-endpoint failures are swallowed exactly as the screen's Promise.all would
// not: several of these routes legitimately 404 when a list is empty (the PP
// handlers return 404 rather than an empty array), and one 404 must not zero
// out every other figure. Collected per call rather than in module scope so two
// overlapping runs cannot pollute each other.
const makeSafeGet = (failures) => async (path) => {
  try {
    const res = await axios.get(`${API_BASE}${path}`, { timeout: TIMEOUT_MS });
    return res.data ?? {};
  } catch (error) {
    // A 404 here means "no rows", which is a legitimate answer on this backend
    // — record it as informational rather than as an outage.
    const status = error.response?.status;
    if (status !== 404) {
      failures.push(`${path} (${status || error.code || error.message})`);
    }
    return {};
  }
};

const arr = (v) => (Array.isArray(v) ? v : []);

// Mirrors the screen's `a || b || []`: an EMPTY array is truthy, so
// `{payments: [], data: [...]}` yields [] here just as it does in the browser.
const pick = (...values) => {
  for (const v of values) if (v) return arr(v);
  return [];
};

/**
 * Build the whole report.
 * @returns {Promise<{date: string, sections: object[], failures: string[]}>}
 */
async function fetchAdminReport() {
  const failures = [];
  const notes = [];
  const safeGet = makeSafeGet(failures);

  // The screen compares `moment(x).format('YYYY-MM-DD') === yesterday`; an
  // inclusive range over the same day is the same test, without re-formatting
  // every row.
  const yesterdayStart = moment().subtract(1, 'days').startOf('day');
  const yesterdayEnd = moment().subtract(1, 'days').endOf('day');
  const isYesterday = (dateStr) =>
    Boolean(dateStr) && moment(dateStr).isBetween(yesterdayStart, yesterdayEnd, undefined, '[]');
  const isToday = (dateStr) => Boolean(dateStr) && moment(dateStr).isSame(moment(), 'day');

  const [
    viewedRes, offersRes, interestsRes, photoRes, addressRes, calledRes, notifRes,
    usersRes, propsRes, allPropsRes,
    paidRes, payFailedRes, payNowRes, payLaterRes, billsRes,
    followUpRes, followUpBuyerRes,
  ] = await Promise.all([
    safeGet('/all-viewed-properties'),
    safeGet('/all-offers'),
    safeGet('/buyer-assistance-interests'),
    safeGet('/all-photo-requests'),
    safeGet('/get-address-requests-all'),
    safeGet('/get-all-contact-sent-properties'),
    safeGet('/get-all-notifications'),
    safeGet('/user/alls'),
    safeGet('/fetch-active-users-datas-all'),
    safeGet('/fetch-alls-datas-all'),
    safeGet('/payments/paid'),
    safeGet('/payments/pay-failed'),
    safeGet('/payments/pay-now'),
    safeGet('/payments/pay-later'),
    safeGet('/bills/non-free-with-properties'),
    safeGet('/followup-list'),
    safeGet('/followup-list-buyer'),
  ]);

  // ── Tab 1: Yesterday Action ─────────────────────────────────────────────────
  // VIEWED PROPERTIES: one count per nested viewer entry, not per property.
  const viewedCount = arr(viewedRes.viewedProperties).reduce(
    (sum, p) => sum + arr(p.viewers).filter((v) => isYesterday(v.viewedAt)).length, 0);

  // CALLED LIST: the log's own timestamp is contactedAt, not createdAt.
  const calledCount = arr(calledRes.properties).filter((i) => isYesterday(i.contactedAt)).length;

  const notifications = arr(notifRes.notifications).filter((n) => isYesterday(n.createdAt));

  const actions = {
    viewedProperties: viewedCount,
    offerRaised: arr(offersRes.offers).filter((i) => isYesterday(i.createdAt)).length,
    sendInterest: arr(interestsRes.data).filter((i) => isYesterday(i.createdAt)).length,
    photoRequest: arr(photoRes).filter((i) => isYesterday(i.createdAt)).length,
    addressRequests: arr(addressRes.requests).filter((i) => isYesterday(i.createdAt)).length,
    calledList: calledCount,
    favoriteList: notifications.filter((n) => n.type === 'favorite').length,
  };

  // Kept for the subject line and for anyone reading the raw figures — the
  // screen shows only the favorite row of the three notification types.
  const notificationCounts = {
    sendInterest: notifications.filter((n) => n.type === 'send interest').length,
    viewed: notifications.filter((n) => n.type === 'viewed').length,
    favorite: actions.favoriteList,
  };

  // ── Tab 2: Yesterday's Property ─────────────────────────────────────────────
  // planName comes back as 'N/A' when no plan matched, so the screen's
  // "not free ⇒ paid" test sweeps unplanned properties into PAID. Mirrored,
  // with the N/A share broken out so the number can be read honestly.
  const yesterdayProperties = arr(propsRes.users).filter((p) => isYesterday(p.createdAt));
  const planOf = (p) => String(p.planName || '');
  const property = {
    totalCreated: yesterdayProperties.length,
    freeProperty: yesterdayProperties.filter((p) => planOf(p).toLowerCase() === 'free').length,
    paidProperty: yesterdayProperties.filter((p) => planOf(p) && planOf(p).toLowerCase() !== 'free').length,
    noPlan: yesterdayProperties.filter((p) => planOf(p).toUpperCase() === 'N/A').length,
  };

  // ── Tab 3: Yesterday Login ──────────────────────────────────────────────────
  // No de-duplication by phone: the screen counts UserLogin rows as they come.
  const yesterdayUsers = arr(usersRes.data).filter((u) => isYesterday(u.loginDate));
  const login = {
    totalLogin: yesterdayUsers.length,
    reported: yesterdayUsers.filter((u) => u.status === 'reported').length,
    unreported: yesterdayUsers.filter((u) => u.status !== 'reported').length,
    owner: yesterdayUsers.filter((u) => u.remarks === 'seller').length,
    tenant: yesterdayUsers.filter((u) => u.remarks === 'buyer').length,
    visitor: yesterdayUsers.filter((u) => u.remarks === 'visitor').length,
    paid: yesterdayUsers.filter((u) => u.conversionStatus === 'paid').length,
    free: yesterdayUsers.filter((u) => u.conversionStatus === 'free').length,
    pending: yesterdayUsers.filter((u) => !u.conversionStatus || u.conversionStatus === 'pending').length,
  };

  // ── Tab 4: Property Count ───────────────────────────────────────────────────
  const allPropsList = arr(allPropsRes.users);
  const propertyCount = {
    approved: allPropsList.filter((p) => p.status === 'active').length,
    preApproved: allPropsList.filter((p) => p.status === 'complete').length,
    deleted: allPropsList.filter((p) => p.status === 'delete').length,
    expired: allPropsList.filter((p) => p.status === 'expired').length,
    pending: allPropsList.filter((p) => p.status === 'pending').length,
  };

  // ── Tab 5: Payments ─────────────────────────────────────────────────────────
  // All-time buckets, exactly as the screen shows them — these are totals, not
  // yesterday's activity.
  const paidPayments = pick(paidRes.payments, paidRes.data);
  const paidBills = arr(billsRes.data);
  const payments = {
    paymentSuccess: paidPayments.length,
    payFailed: pick(payFailedRes.payments, payFailedRes.data).length,
    payNow: pick(payNowRes.payments, payNowRes.data).length,
    payLater: pick(payLaterRes.payments, payLaterRes.data).length,
    onlinePayment: paidPayments.length,
    // Office bills are recognised by the RP prefix the office flow stamps on
    // the transaction id.
    officeBill: paidPayments.filter((p) => String(p.txnid || '').startsWith('RP')).length,
    totalBill: paidBills.length,
  };

  // ── Tab 6: Follow Up ────────────────────────────────────────────────────────
  const propertyFollowUps = arr(followUpRes.data);
  const tenantFollowUps = arr(followUpBuyerRes.data);
  const allFollowUps = [...propertyFollowUps, ...tenantFollowUps];

  const yesterdayCreatedList = allFollowUps.filter((f) => isYesterday(f.createdAt));
  const updatedFollowUpList = allFollowUps.filter((f) => isYesterday(f.followupDate));
  // "Today" is deliberate on the screen: this row is the payment chasing the
  // team has to do on the day the mail arrives, not yesterday's.
  const paymentFollowUpList = allFollowUps.filter(
    (f) => f.followupType === 'Payment Followup' && isToday(f.followupDate));

  const followUps = {
    propertyFollowUp: propertyFollowUps.length,
    tenantFollowUp: tenantFollowUps.length,
    yesterdayCreated: yesterdayCreatedList.length,
    updatedFollowUp: updatedFollowUpList.length,
    paymentFollowUp: paymentFollowUpList.length,
  };

  const yesterday = moment().subtract(1, 'days').format('DD-MM-YYYY');
  const today = moment().format('DD-MM-YYYY');

  // Shaped exactly like the six tabs, so the PDF renderer stays dumb.
  return {
    date: yesterday,
    today,
    generatedAt: new Date(),
    failures: [...failures],
    notes,
    sections: [
      {
        title: 'Yesterday Action',
        subtitle: `Action Summary — ${yesterday}`,
        columns: ['SL NO', 'DESCRIPTION', 'COUNT'],
        rows: [
          [1, 'VIEWED PROPERTIES', actions.viewedProperties],
          [2, 'OFFER RAISED', actions.offerRaised],
          [3, 'SEND INTEREST', actions.sendInterest],
          [4, 'PHOTO REQUEST', actions.photoRequest],
          [5, 'ADDRESS REQUESTS', actions.addressRequests],
          [6, 'CALLED LIST', actions.calledList],
          [7, 'FAVORITE LIST (NOTIFICATION)', actions.favoriteList],
        ],
      },
      {
        title: "Yesterday's Property",
        subtitle: `Properties created — ${yesterday}`,
        columns: ['SL NO', 'DESCRIPTION', 'COUNT'],
        rows: [
          [1, 'NO. OF PROPERTY CREATED', property.totalCreated],
          [2, 'FREE PROPERTY', property.freeProperty],
          [3, 'PAID PROPERTY', property.paidProperty],
          [4, '   of which no plan matched (N/A)', property.noPlan],
        ],
      },
      {
        title: 'Yesterday Login',
        subtitle: `Login Summary — ${yesterday}`,
        columns: ['SL NO', 'DESCRIPTION', 'COUNT'],
        rows: [
          [1, 'TOTAL LOGIN', login.totalLogin],
          [2, 'REPORTED', login.reported],
          [3, 'UNREPORTED', login.unreported],
          { header: 'REMARKS BREAKDOWN' },
          [4, 'OWNER', login.owner],
          [5, 'TENANT', login.tenant],
          [6, 'VISITOR', login.visitor],
          { header: 'CONVERSION BREAKDOWN' },
          [7, 'PAID', login.paid],
          [8, 'FREE', login.free],
          [9, 'PENDING', login.pending],
        ],
      },
      {
        title: 'Property Count',
        subtitle: 'Property Status Summary (Total Count)',
        columns: ['SL NO', 'DESCRIPTION', 'TOTAL COUNT'],
        rows: [
          [1, 'APPROVED PROPERTY', propertyCount.approved],
          [2, 'PRE APPROVED PROPERTY', propertyCount.preApproved],
          [3, 'DELETED PROPERTY', propertyCount.deleted],
          [4, 'EXPIRED PROPERTY', propertyCount.expired],
          [5, 'PENDING PROPERTY', propertyCount.pending],
        ],
      },
      {
        title: 'Payments',
        subtitle: 'Payment Management (Total Count)',
        columns: ['SL NO', 'DESCRIPTION', 'TOTAL COUNT'],
        rows: [
          [1, 'PAYMENT SUCCESS', payments.paymentSuccess],
          [2, 'PAY FAILED', payments.payFailed],
          [3, 'PAY NOW', payments.payNow],
          [4, 'PAY LATER', payments.payLater],
          [5, 'ONLINE PAYMENT', payments.onlinePayment],
          [6, 'OFFICE BILL', payments.officeBill],
          [7, 'TOTAL BILL', payments.totalBill],
        ],
      },
      {
        title: 'Follow Up',
        subtitle: `Follow-up Data (totals, plus ${yesterday} activity)`,
        columns: ['SL NO', 'DESCRIPTION', 'COUNT'],
        rows: [
          [1, 'PROPERTY FOLLOW UP', followUps.propertyFollowUp],
          [2, 'TENANT FOLLOW UP', followUps.tenantFollowUp],
          [3, 'YESTERDAY CREATED FOLLOW UP', followUps.yesterdayCreated],
          [4, 'UPDATED FOLLOW UP', followUps.updatedFollowUp],
          [5, `TODAY PAYMENT FOLLOW UP (${today})`, followUps.paymentFollowUp],
        ],
      },
    ],
    raw: { actions, notificationCounts, property, login, propertyCount, payments, followUps },
  };
}

module.exports = { fetchAdminReport, API_BASE };
