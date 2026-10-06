// Pondy Properties-specific half: what counts as a live record, which dates
// restart its clock, what paid cover protects it, and how to expire it.
//
// Reads go through the raw driver (Model.collection) so the city-scope plugin
// never narrows them and legacy documents never fail hydration. Writes are
// guarded by the status the record had when it was read, so a record an admin
// changed mid-run is left alone. updateOne skips AddModel's save hooks, the
// same way /create-bill-bulk and /update-expired-property-status write.

const AddModel = require('../AddModel');
const BuyerAssistance = require('../BuyerAssistance/BuyerAssistanceModel');
const Bill = require('../CreateBill/BillModel');
const BuyerBill = require('../CreateBuyerBill/BuyerBillModel');
const PaymentPayU = require('../PayU/PayUModel');
const PaymentPayUBuyer = require('../PayuBuyer/PayuBuyerModel');
const PricingPlans = require('../plans/PricingPlanModel');
const BuyerPlan = require('../BuyerPlan/BuyerModel');
const { AdExpressAd } = require('../AdExpress/AdExpressModel');
const { DAY, toMs } = require('./engine');

const phoneKey = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const lower = (v) => String(v || '').trim().toLowerCase();

// AddModel.previousStatus is an enum; only write values it accepts, or the
// next property.save() on that document would fail validation.
const PREVIOUS_STATUS_OK = new Set(['incomplete', 'complete', 'delete', 'active', 'contact', 'contact send']);

// PayuDirect writes plain customer payments into paymentpayubuyers with
// ba_id = Date.now(). They are not Buyer Assistance plans.
const DIRECT_PAYMENT = 'Pondy Properties Payment';

const push = (map, key, value) => {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
};

// ── shared bill / payment readers (property and buyer bills share a shape) ──

const billDay = (b) => {
  const d = toMs(b.billDate);
  return Number.isFinite(d) ? d : toMs(b.createdAt);
};

// BillRouter calls a bill free when planName or paymentType is "free". Any
// money at all still counts as paid — the cautious reading.
const FREE = /^\s*free\s*$/i;
const isPaidBill = (b) =>
  Number(b.netAmount) > 0 ||
  (!FREE.test(String(b.paymentType || '')) && !FREE.test(String(b.planName || '')) && Number(b.billAmount) > 0);

const billCoverDays = (b) =>
  Math.max(Number(b.validity) || 0, Number(b.featuredAmount) > 0 ? Number(b.featuredValidity) || 0 : 0);

// The moment a PayU payment counts from. payUdate is stored in several shapes
// here; an unreadable one falls back to the row's own createdAt.
const paidAt = (p) => Math.max(...[toMs(p.payUdate), toMs(p.createdAt)].filter(Number.isFinite));

/** Turn bills + payments into clock / protect entries for one record. */
function signalsFor({ key, phone, billsByKey, paidBillsByPhone, paysByKey, paysByPhone, durationOf }) {
  const clock = [];
  const protect = [];

  for (const b of billsByKey.get(key) || []) {
    const day = billDay(b);
    clock.push({ at: day, why: 'bill' });
    if (isPaidBill(b)) protect.push({ until: day + billCoverDays(b) * DAY, why: 'paid-bill' });
  }
  for (const b of paidBillsByPhone.get(phone) || []) {
    if (String(b.key) === key) continue;
    protect.push({ until: billDay(b) + billCoverDays(b) * DAY, why: 'owner-paid-bill' });
  }
  for (const p of paysByKey.get(key) || []) {
    const at = paidAt(p);
    clock.push({ at, why: 'payment' });
    protect.push({ until: at + durationOf(p) * DAY, why: 'paid-online' });
  }
  for (const p of paysByPhone.get(phone) || []) {
    if (String(p.key) === key) continue;
    protect.push({ until: paidAt(p) + durationOf(p) * DAY, why: 'owner-paid-online' });
  }
  return { clock, protect };
}

/** Plan length in days for a payment: the plan its record is enrolled in, else the plan it names. */
function planLookup(plans, nameField, enrolKey, daysOf, fallback) {
  const byName = new Map();
  const byKey = new Map();
  for (const plan of plans) {
    const days = daysOf(plan);
    byName.set(lower(plan[nameField]), days);
    for (const entry of plan.phoneNumbers || []) {
      const k = String(entry && entry[enrolKey] != null ? entry[enrolKey] : '');
      if (k && (byKey.get(k) || 0) < days) byKey.set(k, days);
    }
  }
  return { durationOf: (p) => byKey.get(String(p.key)) || byName.get(lower(p.planName)) || fallback };
}

function indexBillsAndPays(bills, pays, billKey, payKey) {
  const billsByKey = new Map();
  const paidBillsByPhone = new Map();
  for (const b of bills) {
    b.key = String(b[billKey] ?? '');
    push(billsByKey, b.key, b);
    if (isPaidBill(b)) push(paidBillsByPhone, phoneKey(b.ownerPhone), b);
  }
  const paysByKey = new Map();
  const paysByPhone = new Map();
  for (const p of pays) {
    p.key = String(p[payKey] ?? '');
    push(paysByKey, p.key, p);
    push(paysByPhone, phoneKey(p.phone), p);
  }
  return { billsByKey, paidBillsByPhone, paysByKey, paysByPhone };
}

const billProjection = {
  ownerPhone: 1, billDate: 1, createdAt: 1, paymentType: 1, planName: 1,
  netAmount: 1, billAmount: 1, validity: 1, featuredAmount: 1, featuredValidity: 1,
};

// ── Properties ───────────────────────────────────────────────────────────────

async function loadProperties(cfg, restoredAt) {
  const [props, adexBatches, adexListingIds, bills, pays, plans] = await Promise.all([
    AddModel.collection
      .find(
        { status: { $in: cfg.propertyStatuses }, isDeleted: { $ne: true } },
        { projection: { ppcId: 1, phoneNumber: 1, status: 1, createdAt: 1, bulkUploadId: 1, featureStatus: 1 } }
      )
      .toArray(),
    AdExpressAd.collection.distinct('bulkUploadId', { status: 'imported' }),
    AdExpressAd.collection.distinct('importedListingId'),
    Bill.collection.find({}, { projection: { ppId: 1, ...billProjection } }).toArray(),
    PaymentPayU.collection
      .find(
        { payustatususer: 'paid', removed: { $ne: true } },
        { projection: { ppcId: 1, phone: 1, planName: 1, payUdate: 1, createdAt: 1 } }
      )
      .toArray(),
    PricingPlans.collection.find({}, { projection: { name: 1, durationDays: 1, 'phoneNumbers.ppcId': 1 } }).toArray(),
  ]);

  const adexBatchSet = new Set(adexBatches.filter(Boolean).map(String));
  const adexIdSet = new Set(adexListingIds.filter((v) => v != null).map(String));
  const { durationOf } = planLookup(plans, 'name', 'ppcId', (p) => Number(p.durationDays) || 0, 0);
  const idx = indexBillsAndPays(bills, pays, 'ppId', 'ppcId');

  return props.map((p) => {
    const key = String(p.ppcId ?? '');
    const isAdex = adexIdSet.has(key) || (p.bulkUploadId && adexBatchSet.has(String(p.bulkUploadId)));
    const rule = isAdex ? 'adex' : 'general';
    const { clock, protect } = signalsFor({ key, phone: phoneKey(p.phoneNumber), durationOf, ...idx });

    // Restored from the Expired page: /update-expired-property-status leaves no
    // marker here (it skips previousStatus), so restores come from our own log.
    if (restoredAt.has(key)) clock.push({ at: restoredAt.get(key), why: 'restored' });
    if (cfg.protectFeatured && p.featureStatus === 'yes') protect.push({ until: Infinity, why: 'featured' });

    return {
      kind: 'property',
      key,
      recordId: p._id,
      status: p.status,
      rule,
      days: cfg.days[rule],
      createdAt: p.createdAt || (p._id && p._id.getTimestamp && p._id.getTimestamp()),
      clock,
      protect,
    };
  });
}

async function expireProperty(rec, d, cfg, now) {
  const day = now.toISOString().slice(0, 10);
  const set = {
    status: 'expired',
    reason: `${cfg.actor} ${day}: no renewal for ${rec.days} days (${rec.rule === 'adex' ? 'Adexpress' : 'general'} rule)`,
    updatedAt: now,
  };
  if (PREVIOUS_STATUS_OK.has(rec.status)) set.previousStatus = rec.status;
  const res = await AddModel.collection.updateOne(
    { _id: rec.recordId, status: rec.status, isDeleted: { $ne: true } },
    { $set: set }
  );
  return res.modifiedCount === 1;
}

// ── Buyer Assistance ─────────────────────────────────────────────────────────

async function loadAssistance(cfg, restoredAt) {
  const [records, bills, pays, plans] = await Promise.all([
    BuyerAssistance.collection
      .find(
        { ba_status: { $in: cfg.assistanceStatuses }, isDeleted: { $ne: true } },
        { projection: { ba_id: 1, phoneNumber: 1, ba_status: 1, createdAt: 1 } }
      )
      .toArray(),
    BuyerBill.collection.find({}, { projection: { ba_id: 1, ...billProjection } }).toArray(),
    PaymentPayUBuyer.collection
      .find(
        { payustatususer: 'paid', removed: { $ne: true }, productinfo: { $ne: DIRECT_PAYMENT } },
        { projection: { ba_id: 1, phone: 1, planName: 1, payUdate: 1, createdAt: 1 } }
      )
      .toArray(),
    BuyerPlan.collection.find({}, { projection: { planName: 1, planValidity: 1, 'phoneNumbers.ba_id': 1 } }).toArray(),
  ]);

  // planValidity is text such as "30 days". Unmatched plans fall back to 90
  // days, the figure BuyerPlan/BuyerRouter.js hard-codes for its expiry view.
  const { durationOf } = planLookup(plans, 'planName', 'ba_id', (p) => parseInt(p.planValidity, 10) || 90, 90);
  const idx = indexBillsAndPays(bills, pays, 'ba_id', 'ba_id');

  return records.map((r) => {
    const key = String(r.ba_id ?? '');
    const { clock, protect } = signalsFor({ key, phone: phoneKey(r.phoneNumber), durationOf, ...idx });
    if (restoredAt.has(key)) clock.push({ at: restoredAt.get(key), why: 'restored' });
    return {
      kind: 'assistance',
      key,
      recordId: r._id,
      status: r.ba_status,
      rule: 'assistance',
      days: cfg.days.assistance,
      createdAt: r.createdAt || (r._id && r._id.getTimestamp && r._id.getTimestamp()),
      clock,
      protect,
    };
  });
}

// Same writes as the admin's "Mark as Expired" (PUT /mark-buyerAssistance-expired),
// so the record lands in the Expired Assistant screen's "Manually Expired" list
// where its Undo button already works.
async function expireAssistance(rec, d, cfg, now) {
  const res = await BuyerAssistance.collection.updateOne(
    { _id: rec.recordId, ba_status: rec.status, isDeleted: { $ne: true } },
    { $set: { ba_status: 'baExpired', baExpiredAt: now, baExpiredBy: cfg.actor, updatedAt: now } }
  );
  if (res.modifiedCount !== 1) return false;
  const ba_id = Number(rec.key);
  if (Number.isFinite(ba_id)) {
    await PaymentPayUBuyer.collection.updateMany(
      { ba_id, payustatususer: 'paid' },
      { $set: { payustatususer: 'expiredPlan', updatedAt: now } }
    );
  }
  return true;
}

// What "back to live" means for each kind, for restore detection.
const KINDS = [
  { kind: 'property', label: 'Properties', load: loadProperties, expire: expireProperty, liveStatuses: (cfg) => cfg.propertyStatuses,
    currentStatus: async (ids) => AddModel.collection.find({ _id: { $in: ids } }, { projection: { status: 1, isDeleted: 1 } }).toArray(),
    statusOf: (doc) => (doc.isDeleted ? 'deleted' : doc.status) },
  { kind: 'assistance', label: 'Buyer Assistance', load: loadAssistance, expire: expireAssistance, liveStatuses: (cfg) => cfg.assistanceStatuses,
    currentStatus: async (ids) => BuyerAssistance.collection.find({ _id: { $in: ids } }, { projection: { ba_status: 1, isDeleted: 1 } }).toArray(),
    statusOf: (doc) => (doc.isDeleted ? 'deleted' : doc.ba_status) },
];

module.exports = { KINDS, isPaidBill, billCoverDays, phoneKey };
