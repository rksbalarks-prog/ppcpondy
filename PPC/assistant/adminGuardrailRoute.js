// Admin-side, read-only visibility into the assistant's guardrail learning.
// Mounted under /PPC (same open posture as the rest of the admin API).
//
//   GET /PPC/assistant/admin/guardrail-events    recent flagged attempts (?category=, ?key=)
//   GET /PPC/assistant/admin/guardrail-patterns   the LEARNED memory, most-frequent first
//   GET /PPC/assistant/admin/guardrail-stats      rollups by category + totals
//
// There is no write endpoint: the store is populated automatically and is
// monotonic (see GuardrailPatternModel). Admins read it for oversight.

const express = require('express');
const GuardrailEvent = require('./store/GuardrailEventModel');
const GuardrailPattern = require('./store/GuardrailPatternModel');

const router = express.Router();

router.get('/assistant/admin/guardrail-events', async (req, res) => {
  try {
    const q = {};
    if (req.query.category) q.category = String(req.query.category);
    if (req.query.key) q.key = String(req.query.key);
    if (req.query.action) q.action = String(req.query.action);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);
    const events = await GuardrailEvent.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, count: events.length, events });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/assistant/admin/guardrail-patterns', async (req, res) => {
  try {
    const patterns = await GuardrailPattern.find({}).sort({ count: -1, lastSeen: -1 }).limit(500).lean();
    res.json({ success: true, count: patterns.length, patterns });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/assistant/admin/guardrail-stats', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [byCategory, totals, blocked] = await Promise.all([
      GuardrailEvent.aggregate([
        { $group: { _id: '$category', attempts: { $sum: 1 } } },
        { $sort: { attempts: -1 } },
      ]),
      GuardrailEvent.countDocuments({}),
      GuardrailEvent.countDocuments({ action: 'block' }),
    ]);
    const last30 = await GuardrailEvent.countDocuments({ createdAt: { $gte: since } });
    res.json({ success: true, totals: { all: totals, blocked, last30 }, byCategory });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
