const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RcmStaffSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    plainPassword: {
      type: String,
    },
    role: {
      type: String,
      enum: ['STAFF', 'ADMIN'],
      default: 'STAFF',
    },
    active: {
      type: Boolean,
      default: true,
    },
    tokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

RcmStaffSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('RcmStaff', RcmStaffSchema);
