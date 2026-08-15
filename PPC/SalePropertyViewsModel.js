const mongoose = require('mongoose');

const SalePropertyViewSchema = new mongoose.Schema({
  ppcId: { type: Number}, // The PPC ID of the property
  userPhoneNumber: { type: String, required: true }, 
    viewedPhonenumber: { type: String }, // ✅ NEW FIELD

  viewedAt: { type: Date, default: Date.now }, // Timestamp of when the property was viewed
});

const SalePropertyView = mongoose.model('SalePropertyView', SalePropertyViewSchema);

module.exports = SalePropertyView;
