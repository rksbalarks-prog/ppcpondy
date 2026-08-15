// Admin-side, read/write route for the chatbot's live settings singleton.
// Mounted under /PPC (same open posture as the rest of the admin API).
//
//   GET /PPC/assistant/admin/settings   -> current settings (+ defaults for blanks)
//   PUT /PPC/assistant/admin/settings   -> upsert; changes apply LIVE (cache cleared)
//
// Every field is optional on PUT; only provided keys are written. Numbers are
// clamped to safe ranges so a typo can't disable rate limiting or make contact
// free. guardrailPhrases fully replaces the list when provided.

const express = require('express');
const AssistantSettings = require('./store/AssistantSettingsModel');
const { getSettings, invalidate } = require('./settings');

const router = express.Router();

const clampInt = (v, min, max, dflt) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
};

const VALID_CATEGORY = new Set(['contact_extraction', 'jailbreak', 'impersonation']);

router.get('/assistant/admin/settings', async (req, res) => {
  try {
    const settings = await getSettings(true); // force-fresh read
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/assistant/admin/settings', async (req, res) => {
  try {
    const b = req.body || {};
    const patch = {};

    if (b.enabled !== undefined) patch.enabled = !!b.enabled;
    if (b.contactRevealPoints !== undefined) patch.contactRevealPoints = clampInt(b.contactRevealPoints, 1, 100000, 10);
    if (b.rateChat !== undefined) patch.rateChat = clampInt(b.rateChat, 1, 100000, 30);
    if (b.rateVoice !== undefined) patch.rateVoice = clampInt(b.rateVoice, 1, 100000, 40);
    if (b.dailyTokenBudget !== undefined) patch.dailyTokenBudget = clampInt(b.dailyTokenBudget, 0, 100000000, 200000);
    if (b.promptExtra !== undefined) patch.promptExtra = String(b.promptExtra).slice(0, 4000);
    if (b.greetingEn !== undefined) patch.greetingEn = String(b.greetingEn).slice(0, 500);
    if (b.greetingTa !== undefined) patch.greetingTa = String(b.greetingTa).slice(0, 500);

    if (Array.isArray(b.guardrailPhrases)) {
      patch.guardrailPhrases = b.guardrailPhrases
        .filter((p) => p && String(p.phrase || '').trim())
        .slice(0, 200)
        .map((p) => ({
          phrase: String(p.phrase).trim().slice(0, 200),
          category: VALID_CATEGORY.has(p.category) ? p.category : 'jailbreak',
          severity: clampInt(p.severity, 1, 3, 3),
        }));
    }

    if (b.updatedBy !== undefined) patch.updatedBy = String(b.updatedBy).slice(0, 120);

    const doc = await AssistantSettings.findOneAndUpdate(
      { key: 'singleton' },
      { $set: patch, $setOnInsert: { key: 'singleton' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    invalidate(); // apply immediately
    const settings = await getSettings(true);
    res.json({ success: true, settings, savedAt: doc?.updatedAt });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
