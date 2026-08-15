// ============================================================
// PointsPricingRouter.js
//
// Admin-only endpoints for the Points Pricing module consumed
// by the admin panel (src/PointsPricing/*.jsx).
//
// Mount in server.js AFTER the base PointsRouter:
//   const PointsPricingRouter = require('./Points/PointsPricingRouter');
//   app.use('/PPC', PointsPricingRouter);
//
// Frontend base URL is REACT_APP_API_URL, which already ends
// with /PPC, so the admin UI hits e.g. /points-plans.
//
// Conventions:
//   - Reads/writes share collections with the user-facing
//     PointsRouter. Never create a parallel collection.
//   - `active` (bool) in admin JSON <-> `status: 'active'|'hide'`
//     in the DB. Translate here, leave the model alone.
//   - Soft-delete a plan by setting status='hide'. No hard delete.
//   - Plan _id is a foreign key in PointsTransaction/PointsPayU;
//     PUT rejects any attempt to change it.
// ============================================================

const express = require('express');
const router = express.Router();

const {
  PointsPlan,
  PointsBalance,
  PointsTransaction,
  PointsPayU,
  PointsPayLaterLead,
  PointsConfig,
  PointsRefundRequest,
} = require('./PointsPricingModel');

// Property (PPC ID) and Buyer Assistance (Ba_Id) models — used to classify
// points users as "has ID" vs "no ID".
const AddModel = require('../AddModel');
const BuyerAssistance = require('../BuyerAssistance/BuyerAssistanceModel');
const { requireAdmin } = require('../utils/adminAuth');

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
const normalizePhone = (raw = '') =>
  String(raw).replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

const toPlanJSON = (plan) => {
  if (!plan) return null;
  const o = plan.toObject ? plan.toObject() : plan;
  return { ...o, active: o.status === 'active' };
};

const parseIntOr = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Admin-side sentinel used to tag manual balance adjustments
// (PointsTransaction.type only allows 'credit' | 'deduct').
const MANUAL_ADJUST_PREFIX = 'MANUAL-ADJUST';

// Marker embedded in the transaction note for the one-time "no-ID" bonus, so
// the grant is idempotent: a user already tagged with it is never credited
// twice, even if the bulk action is run again.
const NO_ID_BONUS_PREFIX = 'NO-ID-BONUS';

// Build sets of normalized phone numbers that own a property (have a PPC ID)
// or a buyer-assistance record (have a Ba_Id). Phones in both source
// collections may carry +91/91/0 prefixes, so we normalize the same way the
// points balances are stored.
const buildIdPhoneSets = async () => {
  const [ppcPhones, baPhones] = await Promise.all([
    AddModel.distinct('phoneNumber', { ppcId: { $ne: null } }),
    BuyerAssistance.distinct('phoneNumber'),
  ]);
  const ppc = new Set(ppcPhones.map((p) => normalizePhone(p)).filter(Boolean));
  const ba = new Set(baPhones.map((p) => normalizePhone(p)).filter(Boolean));
  return { ppc, ba };
};

// Attach hasPPC / hasBA / hasId flags to a PointsBalance document.
const classifyUser = (u, sets) => {
  const phone = normalizePhone(u.phoneNumber);
  const hasPPC = sets.ppc.has(phone);
  const hasBA = sets.ba.has(phone);
  const obj = u.toObject ? u.toObject() : u;
  return { ...obj, hasPPC, hasBA, hasId: hasPPC || hasBA };
};

// ============================================================
// SECTION A — Plans CRUD
// ============================================================

// Create a new plan.
router.post('/points-plans', async (req, res) => {
  try {
    const {
      name, description, price, points, durationDays, popular, sortOrder, active,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (!(Number(price) > 0)) {
      return res.status(400).json({ success: false, message: 'price must be > 0' });
    }
    if (!(Number(points) > 0)) {
      return res.status(400).json({ success: false, message: 'points must be > 0' });
    }

    const plan = await PointsPlan.create({
      name: String(name).trim(),
      description: description || '',
      price: Number(price),
      points: Number(points),
      durationDays: Number(durationDays) || 0,
      popular: !!popular,
      sortOrder: Number(sortOrder) || 0,
      status: active === false ? 'hide' : 'active',
    });
    return res.status(201).json({ success: true, plan: toPlanJSON(plan) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create plan', error: err.message });
  }
});

// Update a plan. _id may not change.
router.put('/points-plans/:id', async (req, res) => {
  try {
    const { _id, id, active, ...rest } = req.body || {};
    if ((_id && String(_id) !== String(req.params.id)) ||
        (id && String(id) !== String(req.params.id))) {
      return res.status(400).json({ success: false, message: 'Plan _id cannot be changed' });
    }

    if (rest.price != null && !(Number(rest.price) > 0)) {
      return res.status(400).json({ success: false, message: 'price must be > 0' });
    }
    if (rest.points != null && !(Number(rest.points) > 0)) {
      return res.status(400).json({ success: false, message: 'points must be > 0' });
    }

    const update = { ...rest };
    if (typeof active === 'boolean') update.status = active ? 'active' : 'hide';

    const plan = await PointsPlan.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    return res.json({ success: true, plan: toPlanJSON(plan) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update plan', error: err.message });
  }
});

// Toggle active flag.
router.patch('/points-plans/:id/active', async (req, res) => {
  try {
    const { active } = req.body || {};
    if (typeof active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'body { active: boolean } required' });
    }
    const plan = await PointsPlan.findByIdAndUpdate(
      req.params.id,
      { status: active ? 'active' : 'hide' },
      { new: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    return res.json({ success: true, plan: toPlanJSON(plan) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle plan', error: err.message });
  }
});

// Soft-delete: set status='hide'. Historic transactions keep their planId ref intact.
router.delete('/points-plans/:id', async (req, res) => {
  try {
    const plan = await PointsPlan.findByIdAndUpdate(
      req.params.id,
      { status: 'hide' },
      { new: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    return res.json({ success: true, message: 'Plan hidden (soft delete)', plan: toPlanJSON(plan) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete plan', error: err.message });
  }
});

// ============================================================
// SECTION B — Users + manual balance adjust
// ============================================================

// Paginated users. Optional ?phone= filter (substring match).
router.get('/points-users', async (req, res) => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = Math.min(parseIntOr(req.query.limit, 25), 200);
    const filter = {};
    if (req.query.phone) {
      const q = normalizePhone(req.query.phone);
      filter.phoneNumber = { $regex: q, $options: 'i' };
    }
    // idStatus: 'none' = only users with no PPC ID and no Ba_Id,
    //           'with' = only users that have at least one ID,
    //           undefined/'' = all users.
    const idStatus = req.query.idStatus;
    const sets = await buildIdPhoneSets();

    if (idStatus === 'none' || idStatus === 'with') {
      // Classify across the full matching set, then paginate in memory.
      const allMatching = await PointsBalance.find(filter).sort({
        lastActivityAt: -1,
        updatedAt: -1,
      });
      const classified = allMatching.map((u) => classifyUser(u, sets));
      const wantId = idStatus === 'with';
      const matched = classified.filter((u) => u.hasId === wantId);
      const total = matched.length;
      const start = (page - 1) * limit;
      const users = matched.slice(start, start + limit);
      return res.json({ success: true, total, page, limit, users });
    }

    const [total, rawUsers] = await Promise.all([
      PointsBalance.countDocuments(filter),
      PointsBalance.find(filter)
        .sort({ lastActivityAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    const users = rawUsers.map((u) => classifyUser(u, sets));
    return res.json({ success: true, total, page, limit, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list users', error: err.message });
  }
});

// Manual credit/debit. body: { phoneNumber, points (signed int), reason, adminId }
// +N credits, -N debits. Writes a PointsTransaction with a note starting
// with MANUAL_ADJUST_PREFIX so the admin ledger can filter for adjustments.
router.post('/points-adjust', async (req, res) => {
  try {
    const { phoneNumber, points, reason, adminId } = req.body || {};
    const delta = Number(points);
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber is required' });
    }
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ success: false, message: 'points must be a non-zero number' });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: 'reason is required' });
    }

    const phone = normalizePhone(phoneNumber);
    let doc = await PointsBalance.findOne({ phoneNumber: phone });
    if (!doc) doc = await PointsBalance.create({ phoneNumber: phone, balance: 0 });

    if (delta < 0 && doc.balance < Math.abs(delta)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot debit more than current balance',
        balance: doc.balance,
      });
    }

    // Atomic balance update using $inc to avoid lost-update races.
    const inc = { balance: delta };
    if (delta > 0) inc.totalEarned = delta;
    else inc.totalSpent = -delta;

    const updated = await PointsBalance.findOneAndUpdate(
      { phoneNumber: phone },
      { $inc: inc, $set: { lastActivityAt: new Date() } },
      { new: true }
    );

    const type = delta > 0 ? 'credit' : 'deduct';
    const note = `${MANUAL_ADJUST_PREFIX} | ${String(reason).trim()} | by ${adminId || 'unknown'}`;

    const txn = await PointsTransaction.create({
      phoneNumber: phone,
      type,
      points: Math.abs(delta),
      balanceAfter: updated.balance,
      reason: 'manual-adjust',
      note,
    });

    return res.json({ success: true, balance: updated.balance, transaction: txn });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to adjust balance', error: err.message });
  }
});

// ----------------------------------------------------------
// No-ID bonus — grant points to users with no PPC ID and no Ba_Id
// ----------------------------------------------------------

// Preview: how many points users have no ID, and how many of those have
// already received the no-ID bonus. Lets the admin confirm before granting.
router.get('/points-no-id-summary', async (req, res) => {
  try {
    const sets = await buildIdPhoneSets();
    const all = await PointsBalance.find({}, { phoneNumber: 1 });
    const noIdPhones = all
      .map((u) => normalizePhone(u.phoneNumber))
      .filter((p) => p && !sets.ppc.has(p) && !sets.ba.has(p));

    const bonusedRaw = await PointsTransaction.distinct('phoneNumber', {
      note: { $regex: NO_ID_BONUS_PREFIX },
    });
    const bonusedSet = new Set(bonusedRaw.map((p) => normalizePhone(p)));
    const alreadyBonused = noIdPhones.filter((p) => bonusedSet.has(p)).length;

    return res.json({
      success: true,
      noId: noIdPhones.length,
      alreadyBonused,
      eligible: noIdPhones.length - alreadyBonused,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to summarize no-ID users', error: err.message });
  }
});

// Grant a one-time bonus (default 100 pts) to every points user who has
// neither a PPC ID nor a Ba_Id. Idempotent: users already tagged with a
// NO-ID-BONUS transaction are skipped, so re-running never double-credits.
// body: { adminId, points? }
router.post('/points-bonus-no-id', requireAdmin, async (req, res) => {
  try {
    const { adminId, reason } = req.body || {};
    const points = Number(req.body?.points) || 100;
    if (!Number.isFinite(points) || points <= 0) {
      return res.status(400).json({ success: false, message: 'points must be a positive number' });
    }
    const reasonText = String(reason || '').trim();
    if (!reasonText) {
      return res.status(400).json({ success: false, message: 'A note/reason is required' });
    }
    // Pipes are the note field separator — neutralize any in the admin's note
    // so the "MANUAL-ADJUST | reason | by X" structure stays parseable.
    const safeReason = reasonText.replace(/\s*\|\s*/g, ' / ');

    const sets = await buildIdPhoneSets();
    const all = await PointsBalance.find({});
    const noId = all.filter((u) => {
      const p = normalizePhone(u.phoneNumber);
      return p && !sets.ppc.has(p) && !sets.ba.has(p);
    });

    const bonusedRaw = await PointsTransaction.distinct('phoneNumber', {
      note: { $regex: NO_ID_BONUS_PREFIX },
    });
    const bonusedSet = new Set(bonusedRaw.map((p) => normalizePhone(p)));

    // Tagged with MANUAL_ADJUST_PREFIX so it also shows in the admin "Admin
    // Logs" view; NO_ID_BONUS_PREFIX in the reason makes it idempotent.
    const note = `${MANUAL_ADJUST_PREFIX} | ${NO_ID_BONUS_PREFIX} ${points}pts — ${safeReason} | by ${adminId || 'unknown'}`;

    let credited = 0;
    let skipped = 0;
    for (const u of noId) {
      const phone = normalizePhone(u.phoneNumber);
      if (bonusedSet.has(phone)) {
        skipped++;
        continue;
      }
      const updated = await PointsBalance.findOneAndUpdate(
        { phoneNumber: phone },
        { $inc: { balance: points, totalEarned: points }, $set: { lastActivityAt: new Date() } },
        { new: true }
      );
      await PointsTransaction.create({
        phoneNumber: phone,
        type: 'credit',
        points,
        balanceAfter: updated.balance,
        reason: 'manual-adjust',
        note,
      });
      credited++;
    }

    return res.json({ success: true, credited, skipped, total: noId.length, points });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to grant no-ID bonus', error: err.message });
  }
});

// ============================================================
// SECTION C — Transactions ledger
// ============================================================
//
// Logical type filters the admin UI exposes:
//   purchase       -> type:'credit' AND txnId != null AND note !~ MANUAL-ADJUST
//   contact-reveal -> type:'deduct' AND reason in ('view-owner-contact','view-buyer-contact')
//   manual-adjust  -> note starts with MANUAL-ADJUST
//   refund         -> reserved; currently alias for manual-adjust with reason 'refund'
router.get('/points-transactions', async (req, res) => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = Math.min(parseIntOr(req.query.limit, 50), 500);
    const filter = {};

    if (req.query.phone) filter.phoneNumber = normalizePhone(req.query.phone);
    if (req.query.planId) filter.planId = req.query.planId;

    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    switch (req.query.type) {
      case 'purchase':
        filter.type = 'credit';
        filter.txnId = { $ne: null };
        filter.note = { $not: /^MANUAL-ADJUST/ };
        break;
      case 'contact-reveal':
        filter.type = 'deduct';
        filter.reason = { $in: ['view-owner-contact', 'view-buyer-contact'] };
        break;
      case 'manual-adjust':
        filter.note = { $regex: `^${MANUAL_ADJUST_PREFIX}` };
        break;
      case 'refund':
        filter.note = { $regex: `^${MANUAL_ADJUST_PREFIX} \\| refund`, $options: 'i' };
        break;
      case 'credit':
      case 'deduct':
        filter.type = req.query.type;
        break;
      default:
        break;
    }

    const [total, txns] = await Promise.all([
      PointsTransaction.countDocuments(filter),
      PointsTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.json({ success: true, total, page, limit, transactions: txns });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: err.message });
  }
});

// ============================================================
// SECTION D — Pay-later leads
// ============================================================

// List pay-later leads. Merges PointsPayU rows with
// PointsPayLaterLead follow-up rows. Optional ?status= filters on lead status.
router.get('/points-paylater', async (req, res) => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = Math.min(parseIntOr(req.query.limit, 50), 500);

    const payUFilter = { payustatususer: 'pay later' };
    const [payURows, total] = await Promise.all([
      PointsPayU.find(payUFilter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PointsPayU.countDocuments(payUFilter),
    ]);

    const txnIds = payURows.map((r) => r.txnid);
    const leads = await PointsPayLaterLead.find({ _id: { $in: txnIds } });
    const leadMap = new Map(leads.map((l) => [l._id, l]));

    const merged = payURows.map((r) => {
      const lead = leadMap.get(r.txnid);
      return {
        ...r.toObject(),
        leadStatus: lead?.status || 'new',
        leadNote: lead?.note || '',
        lastContactAt: lead?.lastContactAt || null,
        updatedBy: lead?.updatedBy || null,
      };
    });

    const filtered = req.query.status
      ? merged.filter((row) => row.leadStatus === req.query.status)
      : merged;

    return res.json({ success: true, total, page, limit, leads: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list pay-later leads', error: err.message });
  }
});

// Update a lead. :id is the PayU txnid. body: { status, note, adminId }
router.patch('/points-paylater/:id', async (req, res) => {
  try {
    const { status, note, adminId } = req.body || {};
    if (status && !['new', 'contacted', 'converted', 'dropped'].includes(status)) {
      return res.status(400).json({ success: false, message: 'invalid status' });
    }

    // Confirm the underlying PayU row exists — prevents writing leads for unknown txnids.
    const payu = await PointsPayU.findOne({ txnid: req.params.id });
    if (!payu) return res.status(404).json({ success: false, message: 'PayU record not found' });

    const now = new Date();
    const set = { updatedBy: adminId || null };
    if (status) set.status = status;
    if (typeof note === 'string') set.note = note;
    if (status === 'contacted' || status === 'converted') set.lastContactAt = now;

    const historyEntry = {
      status: status || undefined,
      note: note || undefined,
      by: adminId || undefined,
      at: now,
    };

    const lead = await PointsPayLaterLead.findOneAndUpdate(
      { _id: req.params.id },
      { $set: set, $push: { history: historyEntry }, $setOnInsert: { _id: req.params.id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update lead', error: err.message });
  }
});

// ============================================================
// SECTION E — Config (singleton)
// ============================================================

const getConfig = async () => {
  let cfg = await PointsConfig.findById('points-config');
  if (!cfg) cfg = await PointsConfig.create({ _id: 'points-config' });
  return cfg;
};

router.get('/points-config', async (req, res) => {
  try {
    const cfg = await getConfig();
    return res.json({ success: true, config: cfg });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to read config', error: err.message });
  }
});

router.put('/points-config', async (req, res) => {
  try {
    const { pointsPerContactReveal, pointsPerBuyerContactReveal, adminId } = req.body || {};
    const update = { updatedBy: adminId || null };
    if (pointsPerContactReveal != null) {
      const n = Number(pointsPerContactReveal);
      if (!Number.isFinite(n) || n < 1) {
        return res.status(400).json({ success: false, message: 'pointsPerContactReveal must be >= 1' });
      }
      update.pointsPerContactReveal = n;
    }
    if (pointsPerBuyerContactReveal != null) {
      const n = Number(pointsPerBuyerContactReveal);
      if (!Number.isFinite(n) || n < 1) {
        return res.status(400).json({ success: false, message: 'pointsPerBuyerContactReveal must be >= 1' });
      }
      update.pointsPerBuyerContactReveal = n;
    }
    const cfg = await PointsConfig.findByIdAndUpdate(
      'points-config',
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, config: cfg });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update config', error: err.message });
  }
});

// ============================================================
// SECTION F — Refund requests (admin)
// ============================================================

// List refund requests. Filters: ?status=pending|approved|rejected, ?phone=
router.get('/points-refund-requests', async (req, res) => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = Math.min(parseIntOr(req.query.limit, 50), 500);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.phone) filter.phoneNumber = normalizePhone(req.query.phone);

    const [total, requests] = await Promise.all([
      PointsRefundRequest.countDocuments(filter),
      PointsRefundRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    return res.json({ success: true, total, page, limit, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list refund requests', error: err.message });
  }
});

// Approve or reject a refund. body: { status: 'approved'|'rejected', adminId, adminNote }
// On approval the original deducted points are credited back atomically and a
// matching credit row is added to PointsTransaction with note "REFUND | ...".
router.patch('/points-refund-requests/:id', async (req, res) => {
  try {
    const { status, adminId, adminNote } = req.body || {};
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }
    const reqDoc = await PointsRefundRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Refund request not found' });
    if (reqDoc.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Already ${reqDoc.status}` });
    }

    const now = new Date();

    if (status === 'rejected') {
      reqDoc.status = 'rejected';
      reqDoc.adminId = adminId || null;
      reqDoc.adminNote = String(adminNote || '').trim();
      reqDoc.resolvedAt = now;
      await reqDoc.save();
      return res.json({ success: true, request: reqDoc });
    }

    // Approval path — credit the points back atomically.
    const updated = await PointsBalance.findOneAndUpdate(
      { phoneNumber: reqDoc.phoneNumber },
      {
        $inc: { balance: reqDoc.points, totalEarned: reqDoc.points },
        $set: { lastActivityAt: now },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const refundNote = `REFUND | request ${reqDoc._id} | by ${adminId || 'admin'}${adminNote ? ' | ' + String(adminNote).trim() : ''}`;
    const creditTxn = await PointsTransaction.create({
      phoneNumber: reqDoc.phoneNumber,
      type: 'credit',
      points: reqDoc.points,
      balanceAfter: updated.balance,
      reason: 'refund',
      note: refundNote,
    });

    reqDoc.status = 'approved';
    reqDoc.adminId = adminId || null;
    reqDoc.adminNote = String(adminNote || '').trim();
    reqDoc.resolvedAt = now;
    reqDoc.refundTxnId = String(creditTxn._id);
    await reqDoc.save();

    return res.json({ success: true, request: reqDoc, balance: updated.balance, transaction: creditTxn });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update refund request', error: err.message });
  }
});

module.exports = router;
