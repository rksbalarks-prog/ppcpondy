// ai_conversation — one row per chat session, scoped by user phone.
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    // Cumulative model tokens spent across this session's turns (for admin usage view).
    tokens: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'ai_conversation' }
);

module.exports = mongoose.models.AiConversation ||
  mongoose.model('AiConversation', ConversationSchema);
