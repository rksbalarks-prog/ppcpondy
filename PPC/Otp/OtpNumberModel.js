const mongoose = require('mongoose');

// OTP recipient phone numbers for the admin login flow.
// Source of truth for the numbers that previously lived hard-coded in
// utils/officeMobileMap.js. Editable from the admin panel (OTP Numbers page).
const otpNumberSchema = new mongoose.Schema({
  // Which login office this recipient belongs to. Matches AdminLogin.officeName
  // so /send-otp-login can look up the right list for the logging-in admin.
  officeName: {
    type: String,
    enum: ['ADMIN', 'ARV 1', 'ARV 2', 'ARV 3'],
    default: 'ADMIN',
  },
  // 10-digit Indian mobile, no country code (the SMS sender prepends 91).
  mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
  // Optional human label so admins can tell whose phone this is.
  label: { type: String, default: '' },
  // Inactive numbers stay in the list but do NOT receive OTPs.
  active: { type: Boolean, default: true },
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('OtpNumber', otpNumberSchema);
