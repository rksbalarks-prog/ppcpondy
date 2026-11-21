// Staff follow-up state for a "hot client" (one document per 10-digit phone).
const mongoose = require('mongoose');

const STATUSES = ['new', 'called', 'interested', 'not_interested', 'closed'];

const HotClientNoteSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true }, // last 10 digits
    status: { type: String, enum: STATUSES, default: 'new' },
    remark: { type: String, default: '' },
    followUpDate: { type: Date, default: null },
    updatedBy: { type: String, default: '' },
    history: [
      {
        status: String,
        remark: String,
        updatedBy: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.HotClientNote || mongoose.model('HotClientNote', HotClientNoteSchema);
module.exports.STATUSES = STATUSES;
