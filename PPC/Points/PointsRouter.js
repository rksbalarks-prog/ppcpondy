// ============================================================
// PointsRouter.js
// All endpoints for the Points system + PayU for Points.
// Self-contained. Does NOT modify existing routers.
//
// Mount in server.js:
//   const PointsRouter = require('./Points/PointsRouter');
//   app.use('/PPC', PointsRouter);
// ============================================================

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const {
  PointsPlan,
  PointsBalance,
  PointsTransaction,
  PointsPayU,
} = require('./PointsModel');

// PointsRefundRequest is admin-side schema; safe to require here without
// causing model collisions because PointsPricingModel re-exports the base
// models (no duplicate schema compilation).
const { PointsRefundRequest } = require('./PointsPricingModel');

// -----------------------------------------------------------
// PayU config
// Reuse the same merchant key/salt the existing module uses so
// credentials stay in one place, but allow env overrides.
// -----------------------------------------------------------
const MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || 'Qmgxku';
const SALT = process.env.PAYU_SALT || 'WUEzPab2A977ygBtkE6dSzsB65ebLsOc';

// Backend base URL (used for PayU surl/furl callbacks).
// PayU hits these URLs; they then redirect the user's browser to the frontend.
const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL || 'https://ppcpondy.com/PPC/PPC';

// Frontend base URL (used when redirecting user back after PayU callback).
const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || 'https://ppcpondy.com';

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
const normalizePhone = (raw = '') =>
  String(raw).replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '').trim();

const getOrCreateBalance = async (phoneNumber) => {
  const phone = normalizePhone(phoneNumber);
  let doc = await PointsBalance.findOne({ phoneNumber: phone });
  if (!doc) {
    doc = await PointsBalance.create({ phoneNumber: phone, balance: 0 });
  }
  return doc;
};

// ============================================================
// SECTION A — Points Plans (admin-configurable packs)
// ============================================================

// Public: list active plans for the user-facing Points Plans page
router.get('/points-plans', async (req, res) => {
  try {
    // Admin pages may pass ?all=1 to fetch hidden plans for plan picker UIs.
    if (req.query.all === '1') {
      const plans = await PointsPlan.find({}).sort({ sortOrder: 1, createdAt: -1 });
      return res.json(plans);
    }
    const plans = await PointsPlan.find({ status: 'active' }).sort({
      sortOrder: 1,
      price: 1,
    });
    return res.json(plans);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to load points plans', error: err.message });
  }
});

// Admin: list all (including hidden)
router.get('/points-plans/all', async (req, res) => {
  try {
    const plans = await PointsPlan.find({}).sort({ sortOrder: 1, createdAt: -1 });
    return res.json({ success: true, total: plans.length, plans });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to list plans', error: err.message });
  }
});

// One-time seed for the three default packs. Safe to call repeatedly —
// it only inserts when the DB is empty.
router.post('/points-plans/seed', async (req, res) => {
  try {
    const count = await PointsPlan.countDocuments({});
    if (count > 0) {
      return res.json({ success: true, message: 'Already seeded', count });
    }
    const defaults = [
      { name: 'Starter',  description: 'Great for trying things out',       price: 100, points: 100,  durationDays: 30,  sortOrder: 1 },
      { name: 'Standard', description: 'Most common choice',                price: 200, points: 200,  durationDays: 60,  sortOrder: 2, popular: true },
      { name: 'Pro',      description: 'Best value — 10% extra points',     price: 900, points: 1000, durationDays: 180, sortOrder: 3 },
    ];
    const plans = await PointsPlan.insertMany(defaults);
    return res.json({ success: true, inserted: plans.length, plans });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Seed failed', error: err.message });
  }
});

// ============================================================
// SECTION B — Balance, credit, deduct
// ============================================================

// Get current balance. Returns { balance: 0 } for new users.
router.get('/points-balance/:phoneNumber', async (req, res) => {
  try {
    const doc = await getOrCreateBalance(req.params.phoneNumber);
    return res.json({
      success: true,
      phoneNumber: doc.phoneNumber,
      balance: doc.balance,
      totalEarned: doc.totalEarned,
      totalSpent: doc.totalSpent,
      totalPaid: doc.totalPaid,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch balance', error: err.message });
  }
});

// Deduct points (called when user clicks "View owner contact details").
router.post('/points-deduct', async (req, res) => {
  try {
    const { phoneNumber, points, rentId, reason } = req.body;
    const amount = Number(points);

    if (!phoneNumber || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'phoneNumber and positive points are required' });
    }

    const doc = await getOrCreateBalance(phoneNumber);
    if (doc.balance < amount) {
      return res.status(200).json({
        success: false,
        message: 'Insufficient points',
        balance: doc.balance,
      });
    }

    doc.balance -= amount;
    doc.totalSpent += amount;
    doc.lastActivityAt = new Date();
    await doc.save();

    await PointsTransaction.create({
      phoneNumber: doc.phoneNumber,
      type: 'deduct',
      points: amount,
      balanceAfter: doc.balance,
      rentId: rentId || null,
      reason: reason || 'deduct',
    });

    return res.json({ success: true, balance: doc.balance });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to deduct points', error: err.message });
  }
});

// Credit points (called from PayU success handler or manual admin credit).
// Idempotent on txnId — calling twice with the same txnId will NOT double-credit.
router.post('/points-credit', async (req, res) => {
  try {
    const { phoneNumber, points, planId, amount, txnId, planName, note } = req.body;
    const pts = Number(points);

    if (!phoneNumber || !pts || pts <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'phoneNumber and positive points are required' });
    }

    if (txnId) {
      const already = await PointsTransaction.findOne({ txnId, type: 'credit' });
      if (already) {
        const doc = await getOrCreateBalance(phoneNumber);
        return res.json({
          success: true,
          balance: doc.balance,
          message: 'Already credited for this txn',
          duplicate: true,
        });
      }
    }

    const doc = await getOrCreateBalance(phoneNumber);
    doc.balance += pts;
    doc.totalEarned += pts;
    if (amount) doc.totalPaid += Number(amount);
    doc.lastActivityAt = new Date();
    await doc.save();

    await PointsTransaction.create({
      phoneNumber: doc.phoneNumber,
      type: 'credit',
      points: pts,
      balanceAfter: doc.balance,
      planId: planId || null,
      planName: planName || null,
      amount: Number(amount) || 0,
      txnId: txnId || null,
      note: note || '',
    });

    return res.json({ success: true, balance: doc.balance });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to credit points', error: err.message });
  }
});

// User: their own transaction history
router.get('/points-transactions/:phoneNumber', async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phoneNumber);
    const txns = await PointsTransaction.find({ phoneNumber: phone })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 100);
    return res.json({ success: true, total: txns.length, transactions: txns });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch transactions', error: err.message });
  }
});

// ============================================================
// SECTION C — PayU for Points
// Mirrors the existing /payu/payment flow but stores data in
// PointsPayU instead of PaymentPayU, and credits points on success.
// ============================================================

// Pre-select a plan (matches the frontend call in PointsPlans.jsx).
router.post('/select-points-plan', async (req, res) => {
  try {
    const { phoneNumber, planId, points, amount } = req.body;
    if (!phoneNumber || !planId) {
      return res
        .status(400)
        .json({ success: false, message: 'phoneNumber and planId are required' });
    }
    // Nothing strict to do server-side — just acknowledge. We could also
    // pre-create a PointsPayU row here, but the pay-now step does that.
    return res.json({ success: true, phoneNumber: normalizePhone(phoneNumber), planId, points, amount });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to select plan', error: err.message });
  }
});

// Pay now — returns PayU hash + form fields for the frontend to POST to PayU.
router.post('/payu/points-payment', async (req, res) => {
  try {
    const {
      txnid,
      amount,
      productinfo = 'Points Plan',
      firstname,
      email,
      phone,
      payustatususer,
      planName,
      planId,
      points,
    } = req.body;

    if (payustatususer !== 'pay now') {
      return res.status(400).json({ error: 'Invalid payment status for this endpoint.' });
    }
    if (!txnid || !amount || !firstname || !email || !phone || !planId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Stash planId/points/phone in udf1..udf3 so PayU echoes them back to us.
    const udf1 = planId || '';
    const udf2 = String(points || '');
    const udf3 = normalizePhone(phone);
    const udf4 = '';
    const udf5 = '';

    // PayU hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const hashString =
      `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|` +
      `${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    await PointsPayU.findOneAndUpdate(
      { txnid },
      {
        txnid,
        status: 'process',
        amount,
        productinfo,
        firstname,
        email,
        phone: udf3,
        payustatususer,
        planName,
        planId,
        points: Number(points) || 0,
        payUdate: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    return res.json({
      key: MERCHANT_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone: udf3,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      surl: `${BACKEND_BASE_URL}/payu/points-success`,
      furl: `${BACKEND_BASE_URL}/payu/points-failure`,
      service_provider: 'payu_paisa',
      hash,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to build PayU payload', error: err.message });
  }
});

// Pay later — record the intent.
router.post('/payu/points-payment-later', async (req, res) => {
  try {
    const {
      txnid,
      amount,
      productinfo = 'Points Plan',
      firstname,
      email,
      phone,
      payustatususer,
      planName,
      planId,
      points,
    } = req.body;

    if (payustatususer !== 'pay later') {
      return res.status(400).json({ error: 'Invalid pay status for pay later.' });
    }

    await PointsPayU.findOneAndUpdate(
      { txnid },
      {
        txnid,
        status: 'pending',
        amount,
        productinfo,
        firstname,
        email,
        phone: normalizePhone(phone),
        payustatususer,
        planName,
        planId,
        points: Number(points) || 0,
        payUdate: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    return res.json({ message: 'Pay later request saved successfully.' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to save pay later', error: err.message });
  }
});

// PayU success callback.
// PayU POSTs here; we mark paid, credit points, then redirect the user's browser to the frontend.
const handlePointsSuccess = async (req, res) => {
  try {
    const body = { ...req.query, ...req.body };
    const {
      txnid,
      amount,
      firstname,
      email,
      phone,
      mihpayid,
      status,
      udf1, // planId
      udf2, // points
      udf3, // normalized phone
    } = body;

    if (!txnid || !mihpayid) {
      console.error('Missing PayU points success fields:', body);
      return res.status(400).send('Missing payment details.');
    }

    const payment = await PointsPayU.findOne({ txnid });
    if (!payment) {
      console.error('Points payment not found for txnid:', txnid);
      return res.status(404).send('Payment record not found.');
    }

    const payUdate = new Date();
    payment.status = 'success';
    payment.mihpayid = mihpayid;
    payment.payUdate = payUdate.toISOString();
    payment.payustatususer = 'paid';

    // Credit points once (guarded by PointsPayU.credited + txnId in transactions).
    if (!payment.credited) {
      const phoneNumber = udf3 || normalizePhone(phone);
      const pts = Number(payment.points || udf2) || 0;

      if (phoneNumber && pts > 0) {
        // Per-mihpayid lock — second guard against double credit.
        const dupTxn = await PointsTransaction.findOne({ txnId: mihpayid, type: 'credit' });
        if (!dupTxn) {
          const doc = await getOrCreateBalance(phoneNumber);
          doc.balance += pts;
          doc.totalEarned += pts;
          doc.totalPaid += Number(amount) || 0;
          doc.lastActivityAt = payUdate;
          await doc.save();

          await PointsTransaction.create({
            phoneNumber: doc.phoneNumber,
            type: 'credit',
            points: pts,
            balanceAfter: doc.balance,
            planId: payment.planId || udf1 || null,
            planName: payment.planName || null,
            amount: Number(amount) || 0,
            txnId: mihpayid,
            note: 'PayU points-success',
          });
        }

        payment.credited = true;
      }
    }
    await payment.save();

    const qs = new URLSearchParams({
      txnid: txnid || '',
      firstname: firstname || '',
      status: 'success',
      amount: amount || '',
      email: email || '',
      phone: phone || '',
      mihpayid: mihpayid || '',
      payUdate: encodeURIComponent(payUdate.toISOString()),
      planName: payment.planName || '',
      planId: payment.planId || '',
      points: String(payment.points || 0),
    }).toString();

    return res.redirect(`${FRONTEND_BASE_URL}/points-payment-success?${qs}`);
  } catch (err) {
    console.error('Points PayU success error:', err);
    return res.status(500).send('Points payment success processing failed.');
  }
};

// PayU failure callback.
const handlePointsFailure = async (req, res) => {
  try {
    const body = { ...req.query, ...req.body };
    const { txnid, amount, firstname, email, phone, mihpayid, status } = body;

    if (txnid) {
      await PointsPayU.findOneAndUpdate(
        { txnid },
        {
          status: 'fail',
          mihpayid: mihpayid || null,
          payustatususer: 'pay failed',
          payUdate: new Date().toISOString(),
        }
      );
    }

    const qs = new URLSearchParams({
      txnid: txnid || '',
      firstname: firstname || '',
      status: status || 'failure',
      amount: amount || '',
      email: email || '',
      phone: phone || '',
      mihpayid: mihpayid || '',
      payUdate: encodeURIComponent(new Date().toISOString()),
    }).toString();

    return res.redirect(`${FRONTEND_BASE_URL}/points-payment-failure?${qs}`);
  } catch (err) {
    console.error('Points PayU failure error:', err);
    return res.status(500).send('Points payment failure processing error.');
  }
};

router.post('/payu/points-success', handlePointsSuccess);
router.get('/payu/points-success', handlePointsSuccess);
router.post('/payu/points-failure', handlePointsFailure);
router.get('/payu/points-failure', handlePointsFailure);

// Admin: list of all points-PayU payments (mirrors the existing /payu/payments/*)
router.get('/payu/points-payments/success', async (req, res) => {
  try {
    const payments = await PointsPayU.find({ payustatususer: 'paid' }).sort({ createdAt: -1 });
    return res.json({ success: true, total: payments.length, payments });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch payments', error: err.message });
  }
});

router.get('/payu/points-payments/failure', async (req, res) => {
  try {
    const payments = await PointsPayU.find({ payustatususer: 'pay failed' }).sort({ createdAt: -1 });
    return res.json({ success: true, total: payments.length, payments });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch payments', error: err.message });
  }
});

router.get('/payu/points-payments/all', async (req, res) => {
  try {
    const payments = await PointsPayU.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, total: payments.length, payments });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch payments', error: err.message });
  }
});

// Admin: set/update the free-text remark on a single points-PayU record.
// Used by all four tabs (Paid / Pay Now / Pay Later / Failed) — they share one collection.
router.patch('/payu/points-payments/:id/remark', async (req, res) => {
  try {
    const { remark } = req.body || {};
    const updated = await PointsPayU.findByIdAndUpdate(
      req.params.id,
      { remark: String(remark || '') },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    return res.json({ success: true, payment: updated });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to save remark', error: err.message });
  }
});

// ============================================================
// SECTION D — Refund requests (user-side)
// ============================================================

// Create a refund request for a specific deduct transaction.
// body: { phoneNumber, transactionId, reason }
// Validates: txn exists, belongs to this user, is a contact-reveal deduct,
// and there's no active (pending/approved) refund already in flight.
router.post('/points-refund-request', async (req, res) => {
  try {
    const { phoneNumber, transactionId, reason } = req.body || {};
    if (!phoneNumber || !transactionId) {
      return res.status(400).json({ success: false, message: 'phoneNumber and transactionId are required' });
    }
    // A valid reason is mandatory — the admin needs context to review.
    const reasonText = String(reason || '').trim();
    if (reasonText.length < 5) {
      return res.status(400).json({ success: false, message: 'A valid refund reason is required (at least 5 characters)' });
    }
    const phone = normalizePhone(phoneNumber);
    const txn = await PointsTransaction.findById(transactionId);
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (txn.phoneNumber !== phone) {
      return res.status(403).json({ success: false, message: 'Transaction does not belong to this user' });
    }
    if (txn.type !== 'deduct' ||
        !['view-owner-contact', 'view-buyer-contact'].includes(txn.reason)) {
      return res.status(400).json({ success: false, message: 'Only contact-reveal deductions can be refunded' });
    }

    // Block duplicate active refunds for the same transaction.
    const existing = await PointsRefundRequest.findOne({
      transactionId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.status === 'approved'
          ? 'This transaction has already been refunded'
          : 'A refund request for this transaction is already pending',
        request: existing,
      });
    }

    const reqDoc = await PointsRefundRequest.create({
      phoneNumber: phone,
      transactionId,
      rentId: txn.rentId || null,
      points: txn.points,
      reason: reasonText,
    });
    return res.status(201).json({ success: true, request: reqDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create refund request', error: err.message });
  }
});

// User: list their own refund requests (most recent first).
router.get('/points-refund-requests/:phoneNumber', async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phoneNumber);
    const requests = await PointsRefundRequest.find({ phoneNumber: phone })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 200);
    return res.json({ success: true, total: requests.length, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch refund requests', error: err.message });
  }
});

module.exports = router;
