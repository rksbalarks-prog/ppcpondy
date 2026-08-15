// models/BuyerAssistViewModel.js

const mongoose = require('mongoose');

const BuyerAssistViewSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true
  },
  ba_id: {
    type: Number, // ✅ Match type with BuyerAssistance model
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BuyerAssistView', BuyerAssistViewSchema);
