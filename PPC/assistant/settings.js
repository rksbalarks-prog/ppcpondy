// Live, admin-editable settings accessor for the assistant.
//
// The singleton ai_assistant_settings doc (AssistantSettingsModel) overrides the
// static env config at runtime. Reads are CACHED (short TTL) so the hot path never
// hits Mongo per request:
//   - getSettings()      async; refreshes the cache when stale. The /chat, /speak,
//                        /transcribe entry points call this once per request, which
//                        keeps the cache warm.
//   - getSettingsSync()  sync; returns the last cached value (or env defaults if the
//                        cache is cold). Used by the hot-path helpers (rate limit,
//                        token budget, tool proposals, guardrail) so they need no
//                        signature changes.
//   - invalidate()       called after an admin PUT so the change applies immediately.
//
// Every default mirrors the current env config, so with NO doc present the assistant
// behaves exactly as before — this layer is purely additive.

const config = require('./config');
const AssistantSettings = require('./store/AssistantSettingsModel');

const TTL_MS = 30 * 1000;
let cache = null;
let cacheAt = 0;

function defaults() {
  return {
    enabled: config.enabled,
    contactRevealPoints: config.contactRevealPoints,
    rateChat: config.rate.chat,
    rateVoice: config.rate.voice,
    dailyTokenBudget: config.dailyTokenBudget,
    promptExtra: '',
    greetingEn: '',
    greetingTa: '',
    guardrailPhrases: [],
  };
}

function fromDoc(doc) {
  const d = defaults();
  if (!doc) return d;
  for (const k of ['enabled', 'contactRevealPoints', 'rateChat', 'rateVoice', 'dailyTokenBudget', 'promptExtra', 'greetingEn', 'greetingTa']) {
    if (doc[k] !== undefined && doc[k] !== null) d[k] = doc[k];
  }
  if (Array.isArray(doc.guardrailPhrases)) {
    d.guardrailPhrases = doc.guardrailPhrases
      .filter((p) => p && p.phrase)
      .map((p) => ({ phrase: String(p.phrase), category: p.category || 'jailbreak', severity: Number(p.severity) || 3 }));
  }
  return d;
}

async function getSettings(force = false, now = Date.now()) {
  if (!force && cache && now - cacheAt < TTL_MS) return cache;
  try {
    const doc = await AssistantSettings.findOne({ key: 'singleton' }).lean();
    cache = fromDoc(doc);
    cacheAt = now;
  } catch (e) {
    // Mongo hiccup: keep serving the last good cache, or fall back to env defaults.
    if (!cache) cache = defaults();
  }
  return cache;
}

// Never throws, never awaits — safe inside the request hot path.
function getSettingsSync() {
  return cache || defaults();
}

function invalidate() {
  cache = null;
  cacheAt = 0;
}

module.exports = { getSettings, getSettingsSync, invalidate };
