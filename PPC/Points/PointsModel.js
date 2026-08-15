// ============================================================
// PointsModel.js
// Self-contained models for the Points system.
// Nothing in here touches or depends on existing PayU / plan
// models. Safe to drop in next to existing folders.
// ============================================================

const mongoose = require('mongoose');

/* ------------------------------------------------------------
 * 1) PointsPlan
 *    Admin-configurable packs the user can buy.
 *    e.g. ₹100 -> 100pts, ₹200 -> 200pts, ₹900 -> 1000pts
 * ---------------------------------------------------------- */
const PointsPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },     // in INR
    points: { type: Number, required: true, min: 0 },    // points granted
    durationDays: { type: Number, default: 0 },          // 0 = no expiry
    popular: { type: Boolean, default: false },          // "MOST POPULAR" badge
    status: {
      type: String,
      enum: ['active', 'hide'],
      default: 'active',
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------
 * 2) PointsBalance
 *    One document per user (phoneNumber).
 *    `balance` is the current redeemable points.
 * ---------------------------------------------------------- */
const PointsBalanceSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0 },   // lifetime credited
    totalSpent: { type: Number, default: 0 },    // lifetime deducted
    totalPaid: { type: Number, default: 0 },     // lifetime ₹ paid for points
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------
 * 3) PointsTransaction
 *    Immutable audit log. Every credit/deduct creates a row.
 *    Admin uses this to answer "how much did this user pay?".
 * ---------------------------------------------------------- */
const PointsTransactionSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, index: true, trim: true },
    type: {
      type: String,
      enum: ['credit', 'deduct'],
      required: true,
    },
    points: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },

    // credit-only fields
    planId: { type: String, default: null },    // PointsPlan _id as string
    planName: { type: String, default: null },
    amount: { type: Number, default: 0 },       // ₹ paid
    txnId: { type: String, default: null },     // PayU mihpayid / internal txnid

    // deduct-only fields
    rentId: { type: String, default: null },
    reason: { type: String, default: null },    // e.g. 'view-owner-contact'

    note: { type: String, default: '' },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------
 * 4) PointsPayU
 *    Separate PayU payment log for points purchases.
 *    Kept out of the existing PaymentPayU collection so the
 *    original module is untouched.
 * ---------------------------------------------------------- */
const PointsPayUSchema = new mongoose.Schema(
  {
    txnid: { type: String, required: true, index: true },
    status: { type: String, default: 'process' },      // process | success | fail | pending
    amount: { type: String },
    productinfo: { type: String, default: 'Points Plan' },
    firstname: { type: String },
    email: { type: String },
    phone: { type: String, index: true },
    mihpayid: { type: String, default: null },
    payUdate: { type: String, default: () => new Date().toISOString() },
    payustatususer: {
      type: String,
      enum: ['pay now', 'pay later', 'paid', 'pay failed'],
      required: true,
    },
    planName: { type: String },
    planId: { type: String, index: true },
    points: { type: Number, default: 0 },
    credited: { type: Boolean, default: false },       // prevents double-credit
    remark: { type: String, default: '' },             // admin free-text note per record
  },
  { timestamps: true }
);

/* ------------------------------------------------------------
 * Export
 * Reuse existing compiled models on hot-reload.
 * ---------------------------------------------------------- */
module.exports = {
  PointsPlan:
    mongoose.models.PointsPlan || mongoose.model('PointsPlan', PointsPlanSchema),
  PointsBalance:
    mongoose.models.PointsBalance || mongoose.model('PointsBalance', PointsBalanceSchema),
  PointsTransaction:
    mongoose.models.PointsTransaction ||
    mongoose.model('PointsTransaction', PointsTransactionSchema),
  PointsPayU:
    mongoose.models.PointsPayU || mongoose.model('PointsPayU', PointsPayUSchema),
};
