const mongoose = require('mongoose');

const adsImageClickModel = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  clickedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AdsImageClick', adsImageClickModel);
