const mongoose = require('mongoose');

const UserPlanSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  ppcId: { type: Number, required: true },
  planName: { type: String, required: true },
  createdAt: { type: Date, required: true },
  expireDate: { type: Date, required: true }
});

module.exports = mongoose.model('UserPricingPlan', UserPlanSchema);
