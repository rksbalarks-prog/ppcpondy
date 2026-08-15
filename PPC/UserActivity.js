const mongoose = require('mongoose');

const userLoginActivitySchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  openedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('UserLoginActivity', userLoginActivitySchema);
