// // models/FollowUp.js
// const mongoose = require('mongoose');

// const followUpSchema = new mongoose.Schema({
// ppcId:{
//     type:String
// },
// phoneNumber:{
//   type:String
// },
// adminName:{
//   type:String
// },
//   followupStatus: {
//     type: String,
//     enum: ['Ring', 'Ready To Pay', 'Not Decided', 'Not Interested-Closed', 'Paid Closed'],
//     required: true
//   },
//   followupType: {
//     type: String,
//     enum: ['Payment Followup', 'Data Followup', 'Enquiry Followup'],
//     required: true
//   },
//   followupDate: {
//     type: Date,
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('FollowUp', followUpSchema);









const mongoose = require('mongoose');

// City-base (PY/CH) helpers — tag each follow-up on save and auto-filter
// list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require('../utils/baseFilter');
const { getScopedBase } = require('../utils/baseScope');
const cityScopePlugin = require('../utils/cityScopePlugin');

const followUpSchema = new mongoose.Schema({
  ppcId: String,
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
  // Keep the existing manual `createdAt` (default: Date.now) untouched, but let
  // Mongoose manage an `updatedAt` so edits (findByIdAndUpdate / .save) are
  // timestamped. The Staff Report's "Follow Updated" metric relies on this.
  timestamps: { createdAt: false, updatedAt: true }
});

// City-base tagging: a PY/CH-scoped admin's follow-ups are tagged to their city.
followUpSchema.pre('save', function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
followUpSchema.plugin(cityScopePlugin);

module.exports = mongoose.model('FollowUp', followUpSchema);
