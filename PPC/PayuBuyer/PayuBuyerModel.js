
// const mongoose = require('mongoose');

// const paymentPayUBuyerSchema = new mongoose.Schema({
//   txnid: String,
//   status: String,
//   amount: String,
//   productinfo: String,
//   firstname: String,
//   email: String,
//   phone: String,
//   mihpayid: String,
//   payUdate: String,
//   payustatususer: {
//     type: String,
//     enum: ['pay now', 'pay later', 'paid', 'pay failed'],
//     required: true,
//   },
//   planName: String,
//    ba_id: {
//     type: Number,
//     unique: true,
//     required: true,
//   },

// }, { timestamps: true });

// module.exports = mongoose.model('PaymentPayUBuyer', paymentPayUBuyerSchema);













const mongoose = require('mongoose');

const paymentPayUBuyerSchema = new mongoose.Schema({
  txnid: { type: String, required: true },
  status: { type: String, required: true }, // e.g., process, pending, success, failure
  amount: { type: String, required: true },
  productinfo: { type: String },
  firstname: { type: String },
  email: { type: String },
  phone: { type: String },
  mihpayid: { type: String },
  payUdate: { type: String },
  payustatususer: {
    type: String,
    enum: ['pay now', 'pay later', 'paid', 'pay failed','expiredPlan'],
    required: true,
  },
  planName: { type: String },
  ba_id: {
    type: Number,
    required: true,
    unique:true,
  },
}, { timestamps: true });

module.exports = mongoose.model('PaymentPayUBuyer', paymentPayUBuyerSchema);
