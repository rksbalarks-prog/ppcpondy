const mongoose = require('mongoose');

// City-base (PY/CH) helpers — tag each follow-up on save and auto-filter
// list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require('../utils/baseFilter');
const { getScopedBase } = require('../utils/baseScope');
const cityScopePlugin = require('../utils/cityScopePlugin');

// Ring follow-ups are keyed only by phone number (no property / buyer id).
// They capture follow-ups for users marked "Ring" on the Login Report — the
// same shape as the seller FollowUp, just its own collection / page.
const ringFollowUpSchema = new mongoose.Schema({
  phoneNumber: String,
  adminName: String,
  followupStatus: {
    type: String,
    enum: ['Ring', 'Ready To Pay', 'Not Decided', 'Not Interested-Closed', 'Paid Closed'],
    required: true
  },
  followupType: {
    type: String,
    enum: ['Payment Followup', 'Data Followup', 'Enquiry Followup', 'Payment Closed'],
    required: true
  },
  followupDate: {
    type: Date,
    required: true
  },
  // Free-text remark/note for this follow-up.
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  transferHistory: [
    {
      from: String,
      to: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // ✅ City base: 'PY' = Pondicherry (default), 'CH' = Chennai.
  base: {
    type: String,
    enum: ['PY', 'CH'],
    default: 'PY'
  }
}, {
  // Keep the manual `createdAt` (default: Date.now) but let Mongoose manage an
  // `updatedAt` so edits are timestamped (matches the seller FollowUp model).
  timestamps: { createdAt: false, updatedAt: true }
});

// City-base tagging: a PY/CH-scoped admin's follow-ups are tagged to their city.
ringFollowUpSchema.pre('save', function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
ringFollowUpSchema.plugin(cityScopePlugin);

module.exports = mongoose.model('RingFollowUp', ringFollowUpSchema);
