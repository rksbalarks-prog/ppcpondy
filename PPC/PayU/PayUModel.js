
const mongoose = require('mongoose');

const paymentPayUSchema = new mongoose.Schema({
  txnid: String,
  status: String,
  amount: String,
  productinfo: String,
  firstname: String,
  email: String,
  phone: String,
  mihpayid: String,
  payUdate: String,
  payustatususer: {
    type: String,
    enum: ['pay now', 'pay later', 'paid', 'pay failed','expiredPlan'],
    required: true,
  },
  planName: String,
ppcId: {
  type: Number,
  unique: true,
  required: true,
}

}, { timestamps: true });

module.exports = mongoose.model('PaymentPayU', paymentPayUSchema);
