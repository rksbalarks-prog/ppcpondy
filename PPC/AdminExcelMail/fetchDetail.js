// Row-level data behind the Admin Detail (Excel) report.
//
// Where AdminReportMail sends COUNTS as a PDF, this sends the underlying ROWS
// as a spreadsheet — every phone number, date and amount behind those numbers.
//
// It calls the same endpoints as the admin screen, over 127.0.0.1, and applies
// the SAME filters as AdminReport.jsx so the row counts here reconcile with the
// figures there. Where the two must agree, the comment says so.
//
// Follow-ups and Bills are MONTH-ONLY by request — no all-time totals.
//
// The two divergences documented in ../AdminReportMail/fetchReport.js apply
// here as well: VIEWED PROPERTY comes off the nested viewers[] entries and
// CALLED LIST off contactedAt, because those are the fields the endpoints
// actually return.

const axios = require('axios');
const moment = require('moment');

const API_BASE = String(
  process.env.ADMIN_EXCEL_API_BASE ||
  process.env.ADMIN_REPORT_API_BASE ||
  `http://127.0.0.1:${process.env.PORT || 5006}/PPC`
).replace(/\/+$/, '');

const TIMEOUT_MS = Number(process.env.ADMIN_EXCEL_TIMEOUT_MS) || 180000;

const makeSafeGet = (failures) => async (path) => {
  try {
    const res = await axios.get(`${API_BASE}${path}`, { timeout: TIMEOUT_MS });
    return res.data ?? {};
  } catch (error) {
    // 404 is this backend's "no rows" — informational, not an outage.
    const status = error.response?.status;
    if (status !== 404) {
      failures.push(`${path} (${status || error.code || error.message})`);
    }
    return {};
  }
};

const arr = (v) => (Array.isArray(v) ? v : []);
const pick = (...values) => { for (const v of values) if (v) return arr(v); return []; };

/** 'DD-MM-YYYY HH:mm' in IST, or '' — Excel-friendly and unambiguous. */
const stamp = (value) => (value ? moment(value).format('DD-MM-YYYY HH:mm') : '');
const dayOnly = (value) => (value ? moment(value).format('DD-MM-YYYY') : '');
const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const join = (...parts) => parts.filter(Boolean).join(' · ');

/**
 * Build every sheet of the detail workbook.
 * @returns {Promise<{date,monthLabel,failures,sheets,summary}>}
 */
async function fetchAdminDetail() {
  const failures = [];
  const safeGet = makeSafeGet(failures);

  const yStart = moment().subtract(1, 'days').startOf('day');
  const yEnd = moment().subtract(1, 'days').endOf('day');
  const isYesterday = (d) => Boolean(d) && moment(d).isBetween(yStart, yEnd, undefined, '[]');
  const isThisMonth = (d) => Boolean(d) && moment(d).isSame(moment(), 'month');

  const [
    viewedRes, offersRes, interestsRes, photoRes, addressRes, calledRes, notifRes,
    loginUsersRes,
    propPayFailedRes, propPayNowRes, propPayLaterRes,
    buyerPayFailedRes, buyerPayNowRes, buyerPayLaterRes,
    propFollowRes, buyerFollowRes, propBillsRes, buyerBillsRes,
  ] = await Promise.all([
    safeGet('/all-viewed-properties'),
    safeGet('/all-offers'),
    safeGet('/buyer-assistance-interests'),
    safeGet('/all-photo-requests'),
    safeGet('/get-address-requests-all'),
    safeGet('/get-all-contact-sent-properties'),
    safeGet('/get-all-notifications'),
    safeGet('/user/alls'),
    safeGet('/payments/pay-failed'),
    safeGet('/payments/pay-now'),
    safeGet('/payments/pay-later'),
    safeGet('/payments-with-plan/pay-failed-buyer'),
    safeGet('/payments-with-plan/pay-now-buyer'),
    safeGet('/payments-with-plan/pay-later-buyer'),
    safeGet('/followup-list'),
    safeGet('/followup-list-buyer'),
    safeGet('/bills'),
    safeGet('/buyer-bills'),
  ]);

  // ── Sheet: Yesterday Actions ────────────────────────────────────────────────
  // One row per action. The row COUNT of each action here equals the number on
  // the PDF report's "Yesterday Action" tab — same source, same filter.
  const actions = [];
  const addAction = (action, date, userPhone, ownerPhone, id, detail) =>
    actions.push([action, stamp(date), String(userPhone || ''), String(ownerPhone || ''), String(id ?? ''), detail || '']);

  // VIEWED PROPERTY counts each nested {phoneNumber, viewedAt} viewer, not the
  // parent property — the same nesting the PDF counts.
  arr(viewedRes.viewedProperties).forEach((p) => {
    arr(p.viewers)
      .filter((v) => isYesterday(v.viewedAt))
      .forEach((v) => addAction('VIEWED PROPERTY', v.viewedAt, v.phoneNumber, p.phoneNumber, p.ppcId,
        join(p.propertyType, p.area, p.city)));
  });

  arr(offersRes.offers).filter((r) => isYesterday(r.createdAt))
    .forEach((r) => addAction('OFFER RAISED', r.createdAt, r.phoneNumber, r.postedUserPhoneNumber, r.ppcId,
      `Offered ${money(r.price)} (asking ${money(r.originalPrice)}) · ${r.status || ''}`));

  // "Send Interest" on this backend is a buyer-assistance record, not a
  // property interest — keyed by ba_id, so there is no owner phone to show.
  arr(interestsRes.data).filter((r) => isYesterday(r.createdAt))
    .forEach((r) => addAction('SEND INTEREST', r.createdAt, r.phoneNumber, '', r.ba_id,
      join(r.ba_status, r.name)));

  arr(photoRes).filter((r) => isYesterday(r.createdAt))
    .forEach((r) => addAction('PHOTO REQUEST', r.createdAt, r.requesterPhoneNumber, r.postedUserPhoneNumber, r.ppcId,
      join(r.propertyType, r.area, r.status)));

  arr(addressRes.requests).filter((r) => isYesterday(r.createdAt))
    .forEach((r) => addAction('ADDRESS REQUEST', r.createdAt, r.requesterPhoneNumber, r.postedUserPhoneNumber, r.ppcId,
      join(r.city, r.area, r.status)));

  arr(calledRes.properties).filter((r) => isYesterday(r.contactedAt))
    .forEach((r) => addAction('CALLED LIST', r.contactedAt, r.userPhone, r.postedUserPhone, r.ppcId,
      join(r.property?.propertyType, r.property?.area)));

  // Only the favorite type is on the screen's action table; the other
  // notification types are listed too so the sheet explains its own totals.
  const notifications = arr(notifRes.notifications).filter((n) => isYesterday(n.createdAt));
  notifications.filter((n) => n.type === 'favorite')
    .forEach((n) => addAction('FAVORITE (NOTIFICATION)', n.createdAt, n.senderPhoneNumber, n.recipientPhoneNumber,
      n.ppcId, String(n.message || '').slice(0, 120)));

  // ── Users ───────────────────────────────────────────────────────────────────
  // No de-duplication by phone: AdminReport.jsx counts UserLogin rows as they
  // come, and these sheets must reconcile with it.
  const allUsers = arr(loginUsersRes.data);
  const isReported = (u) => u.status === 'reported';
  const roleOf = (u) => (u.remarks === 'seller' ? 'OWNER' : u.remarks === 'buyer' ? 'TENANT'
    : u.remarks === 'visitor' ? 'VISITOR' : u.remarks === 'ring' ? 'RING' : 'NOT SET');

  // ── Sheet: Yesterday Login ──────────────────────────────────────────────────
  const logins = allUsers
    .filter((u) => isYesterday(u.loginDate))
    .sort((a, b) => new Date(b.loginDate) - new Date(a.loginDate))
    .map((u) => [
      String(u.phone || ''), stamp(u.loginDate), u.loginMode || '', u.otpStatus || '',
      u.status || '', roleOf(u), isReported(u) ? 'REPORTED' : 'UNREPORTED',
      u.conversionStatus || 'pending', u.staffName || '', u.reportedBy || '',
    ]);

  // ── Sheet: Unreported & Unconverted (all-time backlog) ──────────────────────
  // One row per PHONE, not per login record: this sheet is a call list, and the
  // same person logging in ten times is still one person to chase. The summary
  // counts below are therefore distinct phones too, so they add up to the rows
  // actually in the sheet — a raw record count would overstate the workload.
  const unreported = allUsers.filter((u) => !isReported(u));
  const unconverted = allUsers.filter((u) => !u.conversionStatus || u.conversionStatus === 'pending');
  const backlogMap = new Map();
  const addBacklog = (u, tag) => {
    const key = u.phone || u._id;
    if (!backlogMap.has(key)) backlogMap.set(key, { u, tags: new Set() });
    backlogMap.get(key).tags.add(tag);
  };
  unreported.forEach((u) => addBacklog(u, 'UNREPORTED'));
  unconverted.forEach((u) => addBacklog(u, 'CONVERSION PENDING'));

  const distinctPhones = (rows) => new Set(rows.map((u) => u.phone || u._id)).size;
  const unreportedPhones = distinctPhones(unreported);
  const unconvertedPhones = distinctPhones(unconverted);

  const backlog = Array.from(backlogMap.values())
    .sort((a, b) => new Date(b.u.loginDate || 0) - new Date(a.u.loginDate || 0))
    .map(({ u, tags }) => [
      String(u.phone || ''), [...tags].join(' + '), stamp(u.loginDate),
      roleOf(u), u.conversionStatus || 'pending', u.otpStatus || '', u.loginMode || '', u.staffName || '',
    ]);

  // ── Sheet: Payments ─────────────────────────────────────────────────────────
  const payments = [];
  const addPayments = (bucket, rows, idKey) =>
    rows.forEach((p) => payments.push([
      bucket, String(p.phone || p.firstname || ''), money(p.amount), p.planName || '',
      String(p[idKey] ?? ''), p.status || '', p.payustatususer || '',
      stamp(p.payUdate || p.createdAt), p.txnid || '',
    ]));

  addPayments('PROPERTY · PAY FAILED', pick(propPayFailedRes.payments, propPayFailedRes.data), 'ppcId');
  addPayments('PROPERTY · PAY NOW', pick(propPayNowRes.payments, propPayNowRes.data), 'ppcId');
  addPayments('PROPERTY · PAY LATER', pick(propPayLaterRes.payments, propPayLaterRes.data), 'ppcId');
  addPayments('BUYER · PAY FAILED', arr(buyerPayFailedRes.data), 'ba_id');
  addPayments('BUYER · PAY NOW', arr(buyerPayNowRes.data), 'ba_id');
  addPayments('BUYER · PAY LATER', arr(buyerPayLaterRes.data), 'ba_id');

  // ── Sheet: Follow-ups (THIS MONTH ONLY) ─────────────────────────────────────
  // Month is decided by followupDate — work DUE this month.
  const followups = [
    ...arr(propFollowRes.data).filter((f) => isThisMonth(f.followupDate || f.createdAt))
      .map((f) => ['PROPERTY', String(f.phoneNumber || ''), String(f.ppcId ?? ''),
        dayOnly(f.followupDate), f.followupStatus || '', f.followupType || '',
        f.adminName || '', f.base || '', String(f.remarks || '').slice(0, 200), stamp(f.createdAt)]),
    ...arr(buyerFollowRes.data).filter((f) => isThisMonth(f.followupDate || f.createdAt))
      .map((f) => ['BUYER', String(f.phoneNumber || ''), String(f.ba_id ?? ''),
        dayOnly(f.followupDate), f.followupStatus || '', f.followupType || '',
        f.adminName || '', f.base || '', String(f.remarks || '').slice(0, 200), stamp(f.createdAt)]),
  ].sort((a, b) => moment(a[3], 'DD-MM-YYYY') - moment(b[3], 'DD-MM-YYYY'));

  // ── Sheet: Bills (THIS MONTH ONLY) ──────────────────────────────────────────
  // billDate is stored as a free-text String on both bill models, so the month
  // is decided by createdAt (a real Date) and billDate is carried through as
  // written. Using billDate to bucket would silently drop any row saved in a
  // format moment cannot parse.
  const billRow = (type, b, idKey) => [
    type, b.billNo || '', String(b.billDate || ''), dayOnly(b.createdAt), String(b.ownerPhone || ''),
    String(b[idKey] ?? ''), b.planName || '', b.paymentType || '',
    money(b.billAmount), money(b.featuredAmount), money(b.discount), money(b.netAmount),
    b.adminName || '', b.adminOffice || '',
  ];
  const billThisMonth = (b) => isThisMonth(b.createdAt);
  const propBillsMonth = arr(propBillsRes.data).filter(billThisMonth);
  const buyerBillsMonth = arr(buyerBillsRes.data).filter(billThisMonth);
  const bills = [
    ...propBillsMonth.map((b) => billRow('PROPERTY', b, 'ppId')),
    ...buyerBillsMonth.map((b) => billRow('BUYER', b, 'ba_id')),
  ].sort((a, b) => moment(a[3], 'DD-MM-YYYY') - moment(b[3], 'DD-MM-YYYY'));

  const sumNet = (rows) => rows.reduce((s, b) => s + money(b.netAmount ?? b.billAmount), 0);

  const date = moment().subtract(1, 'days').format('DD-MM-YYYY');
  const monthLabel = moment().format('MMM YYYY').toUpperCase();

  const summary = {
    actions: actions.length,
    logins: logins.length,
    backlog: backlog.length,
    unreported: unreportedPhones,
    unconverted: unconvertedPhones,
    payments: payments.length,
    followups: followups.length,
    bills: bills.length,
    billAmountMonth: sumNet(propBillsMonth) + sumNet(buyerBillsMonth),
  };

  return {
    date,
    monthLabel,
    generatedAt: new Date(),
    failures,
    summary,
    sheets: [
      {
        name: 'Yesterday Actions',
        title: `Yesterday's Actions — ${date}`,
        columns: ['ACTION', 'DATE / TIME', 'USER PHONE', 'OWNER PHONE', 'PPC / BA ID', 'DETAIL'],
        rows: actions,
      },
      {
        name: 'Yesterday Login',
        title: `Yesterday's Login — ${date}`,
        columns: ['PHONE', 'LOGIN DATE', 'LOGIN MODE', 'OTP STATUS', 'STATUS', 'REMARKS ROLE', 'REPORTED?', 'CONVERSION', 'STAFF', 'REPORTED BY'],
        rows: logins,
      },
      {
        name: 'Unreported-Unconverted',
        title: 'Unreported & Conversion-Pending users (all time)',
        columns: ['PHONE', 'CATEGORY', 'LAST LOGIN', 'REMARKS ROLE', 'CONVERSION', 'OTP STATUS', 'LOGIN MODE', 'STAFF'],
        rows: backlog,
      },
      {
        name: 'Payments',
        title: 'Payment Management (outstanding)',
        columns: ['BUCKET', 'PHONE', 'AMOUNT', 'PLAN', 'PPC / BA ID', 'STATUS', 'PAYU STATUS', 'DATE', 'TXN ID'],
        rows: payments,
      },
      {
        name: `Followups ${monthLabel}`,
        title: `Follow-ups due in ${monthLabel}`,
        columns: ['TYPE', 'PHONE', 'PPC / BA ID', 'FOLLOW-UP DATE', 'STATUS', 'FOLLOW-UP TYPE', 'ADMIN', 'BASE', 'REMARKS', 'CREATED'],
        rows: followups,
      },
      {
        name: `Bills ${monthLabel}`,
        title: `Bills raised in ${monthLabel}`,
        columns: ['TYPE', 'BILL NO', 'BILL DATE (as written)', 'CREATED', 'OWNER PHONE', 'PPC / BA ID', 'PLAN', 'PAYMENT TYPE',
          'BILL AMOUNT', 'FEATURED', 'DISCOUNT', 'NET AMOUNT', 'ADMIN', 'OFFICE'],
        rows: bills,
      },
    ],
  };
}

module.exports = { fetchAdminDetail, API_BASE };
