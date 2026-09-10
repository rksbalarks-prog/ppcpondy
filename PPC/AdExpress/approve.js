// The last two steps of the run: follow-up, then bill.
//
// Billing is what actually moves a property from PreApproved to Approved — the
// bulk-bill route sets `status: 'active'`, which is what both the Approved page
// and the public feed select on. Until this existed an admin had to open
// PreApproved, press Bulk Followup, then Bulk Bill, by hand, every time.
//
// Both steps go through the app's OWN endpoints, the same two the admin screen
// posts to:
//   POST /PPC/followup-bulk-create   one follow-up per property, skips existing
//   POST /PPC/create-bill-bulk       one bill per property, skips already billed
//
// So the result is indistinguishable from a person having clicked the buttons,
// including the sequential bill numbers and the skip rules.

const config = require('./config');

const endpoint = (path) => `${config.apiBase}${path}`;

/** Today in the server's local date, which is what the bill-date rule checks. */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function post(path, body) {
  const res = await fetch(endpoint(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `${path} failed (HTTP ${res.status})`);
  }
  return json;
}

/**
 * Raise a follow-up against every freshly imported property.
 *
 * A scraped lead is exactly the "Data Followup / Not Decided" case staff use
 * for a number nobody has rung yet, which is why those are the defaults.
 */
async function bulkFollowUp(items, by) {
  if (!items.length) return { createdCount: 0, skippedCount: 0 };
  return post('/followup-bulk-create', {
    items,
    followupStatus: config.autoApprove.followupStatus,
    followupType: config.autoApprove.followupType,
    followupDate: today(),
    remarks: config.autoApprove.remarks,
    adminName: by || 'Adexpress cron',
  });
}

/**
 * Bill every freshly imported property, which activates it.
 *
 * The defaults mirror what this office already does for this kind of listing —
 * a Free plan on a Free payment type at AUROBINDO, which is what 233 of its 296
 * existing bills record. See config.autoApprove for the full tally.
 *
 * Worth knowing before changing them: /create-bill-bulk accepts ANY non-empty
 * planName / paymentType / adminOffice — it checks presence and nothing more.
 * The plan and payment-type lists in this app are DB rows served by /fetch, not
 * a fixed enum, so a value invented here would be written onto real bills that
 * reconcile against nothing. Take replacements from those lists.
 */
async function bulkBill(items, by) {
  if (!items.length) return { createdCount: 0, skippedCount: 0 };
  const a = config.autoApprove;
  return post('/create-bill-bulk', {
    items,
    billData: {
      adminOffice: a.billOffice,
      adminName: by || 'Adexpress cron',
      billDate: today(),
      paymentType: a.billPaymentType,
      planName: a.billPlan,
      billAmount: a.billAmount,
      validity: a.billValidity,
      noOfAds: a.billNoOfAds,
      featuredAmount: 0,
      featuredValidity: 0,
      featuredMaxAds: 0,
      discount: 0,
      netAmount: a.billAmount,
      billCreatedBy: by || 'Adexpress cron',
    },
  });
}

/**
 * Follow up on and bill a batch of just-imported properties, taking them all
 * the way to Approved.
 *
 * @param {Array<{ppcId:number, phoneNumber:string}>} items
 * @param {string} by  name recorded against the follow-up and the bill
 * @returns {Promise<object>} counts, and any step that failed
 */
async function followUpAndBill(items, by) {
  const clean = (items || [])
    .filter((i) => i && i.ppcId)
    .map((i) => ({ ppcId: i.ppcId, phoneNumber: String(i.phoneNumber || '') }));

  const out = {
    attempted: clean.length,
    followUpsCreated: 0,
    billsCreated: 0,
    errors: [],
  };
  if (!clean.length || !config.autoApprove.enabled) return out;

  // A follow-up failing must not stop the billing — billing is what makes the
  // listing visible, and the follow-up is a record-keeping nicety beside it.
  try {
    const f = await bulkFollowUp(clean, by);
    out.followUpsCreated = f.createdCount || 0;
  } catch (err) {
    out.errors.push(`follow-up: ${err.message}`);
  }

  try {
    const b = await bulkBill(clean, by);
    out.billsCreated = b.createdCount || 0;
  } catch (err) {
    out.errors.push(`bill: ${err.message}`);
  }

  return out;
}

module.exports = { followUpAndBill, bulkFollowUp, bulkBill };
