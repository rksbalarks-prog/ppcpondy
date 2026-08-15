














const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AdminLoginSchema = mongoose.Schema({
  name: { type: String, required: true },
  otp: { type: String, default: null },
  otpExpiry: { type: Date },
  address: String,
  office: { type: String, enum: ['AUROBINDO', 'SAINT'] },
    officeName: { type: String, enum: ['ADMIN', 'ARV 1','ARV 2','ARV 3'] },

  jobType: { type: String, enum: ['Full-time', 'Part-time'] },
  targetWeek: Number,
  targetMonth: String,
  mobile: { type: String, match: /^[0-9]{10}$/ },
  aadhaarNumber: { type: String, match: /^[0-9]{12}$/ },
  userName: String,
  // password: { type: String, required: true, minlength: 6 },
    password: { type: String, required: true, minlength: 6 },
  plainPassword: { type: String }, 
  role: { type: String, required: true },
    lastLogin: { type: Date },

  // City scope this admin may sign in to:
  //   'ALL' - both cities, 'PY' - Pondicherry only, 'CH' - Chennai only.
  // Existing accounts (no `base` set) are treated as 'ALL' at login.
  base: { type: String, enum: ['ALL', 'PY', 'CH'], default: 'ALL' }

});


// Auto-hash password before saving
AdminLoginSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// // Auto-hash password before saving
// AdminLoginSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

module.exports = mongoose.model('AdminLogin', AdminLoginSchema);
