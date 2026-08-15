const mongoose = require('mongoose');

const InterestedDetailsSchema = new mongoose.Schema(
  {
    rent: { type: String, default: '' },
    advance: { type: String, default: '' },
    bhk: { type: String, default: '' },
    floorNo: { type: String, default: '' },
    carPark: { type: String, default: '' },
    availableFrom: { type: String, default: '' },
    capturedAt: { type: Date },
  },
  { _id: false }
);

const RcmCallSchema = new mongoose.Schema(
  {
    agentUsername: {
      type: String,
      required: true,
      index: true,
    },
    number: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    mode: {
      type: String,
      enum: ['Manual', 'Automatic'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Ring', 'Not Exist', 'Not Interested', 'Interested'],
      default: 'Ring',
    },
    interestedDetails: { type: InterestedDetailsSchema, default: undefined },
    autoNumberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RcmAutoNumber',
      default: null,
    },
  },
  { timestamps: true }
);

RcmCallSchema.index({ createdAt: -1 });
RcmCallSchema.index({ agentUsername: 1, createdAt: -1 });

module.exports = mongoose.model('RcmCall', RcmCallSchema);
