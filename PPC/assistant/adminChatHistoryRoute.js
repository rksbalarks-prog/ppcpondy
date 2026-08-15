// Admin-side routes for AI-assistant chat history. Mounted under /PPC (same open
// posture as the rest of the admin API — the admin app has no auth layer).
//
//   GET /PPC/assistant/admin/chat-history                     one row per user (phone):
//                                                             tokens, sessions, messages, last-active
//   GET /PPC/assistant/admin/chat-history/:phone/transcript   download the user's full
//                                                             transcript as a .txt file
//   GET /PPC/assistant/admin/chat-history/:phone/messages     JSON transcript (for in-page view)
//
// The store scopes every message/conversation by the user's canonical phone (last
// 10 digits), so grouping by `phone` yields one row per logged-in user.

const express = require('express');
const Conversation = require('./store/ConversationModel');
const Message = require('./store/MessageModel');

const router = express.Router();

// GET list — one aggregated row per user.
router.get('/assistant/admin/chat-history', async (req, res) => {
  try {
    // Conversations grouped by user: total tokens, #sessions, last activity.
    const convAgg = await Conversation.aggregate([
      {
        $group: {
          _id: '$phone',
          tokens: { $sum: { $ifNull: ['$tokens', 0] } },
          sessions: { $sum: 1 },
          lastMessageAt: { $max: '$lastMessageAt' },
          firstMessageAt: { $min: '$createdAt' },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 2000 },
    ]);

    // Message counts grouped by user (both roles).
    const msgAgg = await Message.aggregate([
      { $group: { _id: '$phone', messages: { $sum: 1 } } },
    ]);
    const msgMap = new Map(msgAgg.map((m) => [m._id, m.messages]));

    const users = convAgg
      .filter((c) => c._id) // skip any null phone
      .map((c) => ({
        phone: c._id,
        tokens: c.tokens || 0,
        sessions: c.sessions || 0,
        messages: msgMap.get(c._id) || 0,
        lastMessageAt: c.lastMessageAt,
        firstMessageAt: c.firstMessageAt,
      }));

    res.json({ success: true, count: users.length, users });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Load a user's full transcript (oldest-first, grouped by session).
async function loadUserMessages(phone) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  return Message.find({ phone: digits }).sort({ sessionId: 1, createdAt: 1 }).lean();
}

// GET JSON transcript — used by the in-page "View" modal.
router.get('/assistant/admin/chat-history/:phone/messages', async (req, res) => {
  try {
    const msgs = await loadUserMessages(req.params.phone);
    res.json({
      success: true,
      phone: String(req.params.phone || '').replace(/\D/g, '').slice(-10),
      count: msgs.length,
      messages: msgs.map((m) => ({
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        actions: m.actions,
        at: m.createdAt,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET .txt transcript — downloadable file.
router.get('/assistant/admin/chat-history/:phone/transcript', async (req, res) => {
  try {
    const digits = String(req.params.phone || '').replace(/\D/g, '').slice(-10);
    const msgs = await loadUserMessages(digits);

    const out = [];
    out.push('Pondy Properties — AI Chat Transcript');
    out.push(`User (phone): ${digits}`);
    out.push(`Total messages: ${msgs.length}`);
    out.push(`Generated: ${new Date().toISOString()}`);
    out.push('='.repeat(64));

    let lastSession = null;
    for (const m of msgs) {
      if (m.sessionId !== lastSession) {
        out.push('');
        out.push(`----- Session: ${m.sessionId} -----`);
        lastSession = m.sessionId;
      }
      const ts = m.createdAt ? new Date(m.createdAt).toISOString() : '';
      const who = m.role === 'user' ? 'USER' : 'ASSISTANT';
      out.push(`[${ts}] ${who}: ${m.content || ''}`);
      if (Array.isArray(m.actions)) {
        for (const a of m.actions) out.push(`      -> action: ${a.label || a.tool || ''}`);
      }
    }
    if (!msgs.length) out.push('\n(no messages)');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ai-chat-${digits || 'user'}.txt"`);
    res.send(out.join('\n'));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
