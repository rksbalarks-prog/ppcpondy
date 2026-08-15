// ai_message — one row per turn, scoped by session + phone.
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    phone: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    // Optional: action proposals surfaced on this assistant turn (for replay).
    actions: { type: Array, default: undefined },
  },
  { timestamps: true, collection: 'ai_message' }
);

MessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.models.AiMessage ||
  mongoose.model('AiMessage', MessageSchema);
