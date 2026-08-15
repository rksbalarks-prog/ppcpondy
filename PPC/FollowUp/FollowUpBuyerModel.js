

const mongoose = require('mongoose');

// City-base (PY/CH) helpers — tag each buyer follow-up on save and auto-filter
// list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require('../utils/baseFilter');
const { getScopedBase } = require('../utils/baseScope');
const cityScopePlugin = require('../utils/cityScopePlugin');

const followUpBuyerSchema = new mongoose.Schema({
  ba_id: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  followupStatus: { type: String, required: true },
  followupType: { type: String, required: true },
  followupDate: { type: Date, required: true },
  adminName: { type: String, required: true },
  // Free-text remark/note for this follow-up.
  remarks: { type: String, default: '' },
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
}, { timestamps: true });

// City-base tagging: a PY/CH-scoped admin's follow-ups are tagged to their city.
followUpBuyerSchema.pre('save', function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
followUpBuyerSchema.plugin(cityScopePlugin);

module.exports = mongoose.model('FollowUpBuyer', followUpBuyerSchema);
