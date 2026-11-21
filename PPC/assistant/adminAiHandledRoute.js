// Admin-side "AI Handled" report: one row per assistant chat session, showing
// what the user asked, what the AI offered, and whether the user then actually
// followed through — checked against real records, not the chat text.
// Read-only. Mounted under /PPC (same open posture as the rest of the admin API).
//
//   GET /PPC/assistant/admin/ai-handled?days=90
//
// Outcome per session (first match wins):
//   converted       the user did something after the chat started: unlocked an
//                   owner contact, bought points, registered a buyer requirement,
//                   or left an owner (sell/rent) lead
//   needs_followup  the AI offered a next step (buy points, buyer assistance,
//                   post property) but nothing happened — staff should call
//   answered        the AI answered and nothing further was needed/offered
//
// Follow-through is only credited inside a window after the session
// (FOLLOW_WINDOW_DAYS) so an unrelated purchase months later doesn't count.

const express = require('express');
const Conversation = require('./store/ConversationModel');
const Message = require('./store/MessageModel');
const OwnerLead = require('./store/OwnerLeadModel');
const BuyerAssistance = require('../BuyerAssistance/BuyerAssistanceModel');
const { PointsTransaction } = require('../Points/PointsModel');

const router = express.Router();

const FOLLOW_WINDOW_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

const last10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Tools whose action means "the AI offered the user a next step".
const OFFER_TOOLS = new Set(['offer_buyer_assistance', 'offer_points_purchase', 'offer_add_property']);

// Builds the per-session report. Also used by the Hot Clients report.
async function buildAiHandled(days) {
    const since = new Date(Date.now() - days * DAY);

    const convs = await Conversation.find({ lastMessageAt: { $gte: since } })
      .sort({ lastMessageAt: -1 }).limit(1000).lean();
    if (!convs.length) return [];

    const sessionIds = convs.map((c) => c.sessionId);
    const msgs = await Message.find({ sessionId: { $in: sessionIds } })
      .sort({ createdAt: 1 }).select('sessionId role content actions createdAt').lean();
    const bySession = new Map();
    for (const m of msgs) {
      if (!bySession.has(m.sessionId)) bySession.set(m.sessionId, []);
      bySession.get(m.sessionId).push(m);
    }

    // Follow-through records for every phone in range, in one query per collection.
    // Phones are stored inconsistently (+91…, 91…, 0…, bare 10 digits).
    const phones = [...new Set(convs.map((c) => last10(c.phone)).filter((p) => p.length === 10))];
    const phoneRe = new RegExp(`^(\\+?91|0)?(${phones.map(escapeRe).join('|')})$`);
    const earliest = new Date(Math.min(...convs.map((c) => new Date(c.createdAt || c.lastMessageAt).getTime())));

    const [buyerReqs, pointTx, ownerLeads] = phones.length ? await Promise.all([
      BuyerAssistance.find({ phoneNumber: phoneRe, createdAt: { $gte: earliest } })
        .select('phoneNumber createdAt ba_id').lean(),
      PointsTransaction.find({ phoneNumber: phoneRe, createdAt: { $gte: earliest } })
        .select('phoneNumber type points amount reason createdAt rentId').lean(),
      OwnerLead.find({ phone: { $in: phones }, createdAt: { $gte: earliest } })
        .select('phone createdAt status ppcId').lean(),
    ]) : [[], [], []];

    const group = (rows, key) => {
      const m = new Map();
      for (const r of rows) {
        const k = last10(r[key]);
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(r);
      }
      return m;
    };
    const baByPhone = group(buyerReqs, 'phoneNumber');
    const txByPhone = group(pointTx, 'phoneNumber');
    const leadByPhone = group(ownerLeads, 'phone');

    const inWindow = (d, start, end) => {
      const t = new Date(d).getTime();
      return t >= start && t <= end + FOLLOW_WINDOW_DAYS * DAY;
    };

    const sessions = convs.map((c) => {
      const phone = last10(c.phone);
      const items = bySession.get(c.sessionId) || [];
      const userMsgs = items.filter((m) => m.role === 'user');
      const start = new Date(c.createdAt || items[0]?.createdAt || c.lastMessageAt).getTime();
      const end = new Date(c.lastMessageAt || start).getTime();

      // What the AI offered/did, de-duplicated by tool.
      const offered = new Map();
      let requirement = null;
      for (const m of items) {
        for (const a of m.actions || []) {
          if (!a || !a.tool) continue;
          if (!offered.has(a.tool)) offered.set(a.tool, { tool: a.tool, label: a.label || a.tool });
          if (a.tool === 'offer_buyer_assistance' && a.prefill) requirement = a.prefill;
        }
      }

      const ba = (baByPhone.get(phone) || []).filter((r) => inWindow(r.createdAt, start, end));
      const tx = (txByPhone.get(phone) || []).filter((r) => inWindow(r.createdAt, start, end));
      const leads = (leadByPhone.get(phone) || []).filter((r) => inWindow(r.createdAt, start, end));
      const results = {
        buyerRequirement: ba.length > 0,
        pointsBought: tx.filter((t) => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0),
        pointsBoughtCount: tx.filter((t) => t.type === 'credit').length,
        contactsUnlocked: tx.filter((t) => t.type === 'deduct' && t.reason === 'view-owner-contact').length,
        ownerLead: leads.length > 0,
      };
      const converted = results.buyerRequirement || results.pointsBoughtCount > 0
        || results.contactsUnlocked > 0 || results.ownerLead;
      const madeOffer = [...offered.keys()].some((t) => OFFER_TOOLS.has(t));

      return {
        sessionId: c.sessionId,
        phone,
        startedAt: new Date(start),
        lastMessageAt: c.lastMessageAt,
        userMessages: userMsgs.length,
        totalMessages: items.length,
        tokens: c.tokens || 0,
        firstQuestion: (userMsgs[0]?.content || '').slice(0, 300),
        lastQuestion: userMsgs.length > 1 ? (userMsgs[userMsgs.length - 1].content || '').slice(0, 300) : '',
        offered: [...offered.values()],
        requirement,
        results,
        outcome: converted ? 'converted' : madeOffer ? 'needs_followup' : 'answered',
      };
    });

    return sessions;
}

router.get('/assistant/admin/ai-handled', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 90, 1), 365);
    const sessions = await buildAiHandled(days);
    res.json({ success: true, days, followWindowDays: FOLLOW_WINDOW_DAYS, count: sessions.length, sessions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
module.exports.buildAiHandled = buildAiHandled;
