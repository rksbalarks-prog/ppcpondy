// One row per WhatsApp message sent through POST /send-message (OneMsg).
// OTP codes are masked before saving — see classify.js.
const mongoose = require('mongoose');

const WhatsAppLogSchema = new mongoose.Schema(
  {
    to: { type: String, index: true },          // last 10 digits of the recipient
    category: { type: String, index: true },    // see classify.js CATEGORIES
    audience: { type: String },                 // owner | user | account
    aboutPhone: { type: String, default: '' },  // other party mentioned in the message (e.g. the user who called)
    ppcId: { type: Number, default: null },
    message: { type: String, default: '' },     // masked, max 2000 chars
    status: { type: String, enum: ['sent', 'failed'], index: true },
    error: { type: String, default: '' },
    provider: { type: String, default: '' },    // short provider response, for debugging
    source: { type: String, default: '' },      // app | website | admin | other
  },
  { timestamps: true }
);
WhatsAppLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.WhatsAppLog || mongoose.model('WhatsAppLog', WhatsAppLogSchema);
