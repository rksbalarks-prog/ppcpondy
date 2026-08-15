// Conversation persistence + context loading. All operations are scoped by BOTH
// sessionId and phone so a user can only ever touch their own sessions.

const Conversation = require('./ConversationModel');
const Message = require('./MessageModel');
const config = require('../config');

async function ensureConversation(sessionId, phone) {
  await Conversation.updateOne(
    { sessionId },
    { $setOnInsert: { sessionId, phone }, $set: { lastMessageAt: new Date() } },
    { upsert: true }
  );
}

// Last N turns (N*2 messages) as {role, content}, oldest-first, for model context.
async function loadHistory(sessionId, phone, turns = config.historyTurns) {
  const docs = await Message.find({ sessionId, phone })
    .sort({ createdAt: -1 })
    .limit(turns * 2)
    .lean();
  return docs
    .reverse()
    .map((d) => ({ role: d.role, content: d.content }));
}

async function appendMessage(sessionId, phone, role, content, actions) {
  await ensureConversation(sessionId, phone);
  await Message.create({ sessionId, phone, role, content, actions });
  await Conversation.updateOne({ sessionId }, { $set: { lastMessageAt: new Date() } });
}

// Accumulate the model tokens a chat turn spent onto its conversation, so the admin
// AI-chat-history view can report per-user usage. Best-effort; never throws.
async function recordUsage(sessionId, tokens = 0) {
  const t = Number(tokens);
  if (!Number.isFinite(t) || t <= 0) return;
  await Conversation.updateOne({ sessionId }, { $inc: { tokens: t } });
}

// Full transcript for GET /session/:id (most recent first-page).
async function getSession(sessionId, phone, limit = 100) {
  const docs = await Message.find({ sessionId, phone })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
  return docs.map((d) => ({
    role: d.role,
    content: d.content,
    actions: d.actions,
    at: d.createdAt,
  }));
}

// DELETE /session/:id — wipe a user's session.
async function resetSession(sessionId, phone) {
  const res = await Message.deleteMany({ sessionId, phone });
  await Conversation.deleteOne({ sessionId, phone });
  return { deleted: res.deletedCount || 0 };
}

module.exports = { ensureConversation, loadHistory, appendMessage, recordUsage, getSession, resetSession };
