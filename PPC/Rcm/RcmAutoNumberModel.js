const mongoose = require('mongoose');

const RcmAutoNumberSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    addedBy: {
      type: String,
      default: 'system',
    },
    assignCount: {
      type: Number,
      default: 0,
      index: true,
    },
    lastAssignedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

RcmAutoNumberSchema.index({ active: 1, assignCount: 1, _id: 1 });

module.exports = mongoose.model('RcmAutoNumber', RcmAutoNumberSchema);
