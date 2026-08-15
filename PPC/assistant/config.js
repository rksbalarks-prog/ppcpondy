// Central config for the AI assistant. Reads process.env ONCE and exposes a
// frozen object. Nothing else in the assistant reads process.env directly.
//
// The assistant is an additive layer: if ASSISTANT_ENABLED !== 'true' the router
// short-circuits and the rest of the app is unaffected.
//
// NOTE: this backend is CommonJS (server.js uses require), so the whole assistant
// folder is CommonJS — unlike the Rent Pondy copy, which is ESM.

const bool = (v, d = false) =>
  v === undefined ? d : String(v).toLowerCase() === 'true';
const int = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const config = {
  enabled: bool(process.env.ASSISTANT_ENABLED, true),

  // "openai" | "mock". Mock needs no API key and is deterministic (tests/CI).
  provider: (process.env.ASSISTANT_PROVIDER || 'openai').toLowerCase(),

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
    transcribeModel: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe',
    ttsModel: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
    ttsVoice: process.env.OPENAI_TTS_VOICE || 'coral',
  },

  maxToolLoops: int(process.env.ASSISTANT_MAX_TOOL_LOOPS, 6),
  historyTurns: int(process.env.ASSISTANT_HISTORY_TURNS, 12),
  dailyTokenBudget: int(process.env.ASSISTANT_DAILY_TOKEN_BUDGET, 200000),

  // Points charged to reveal an owner's contact. Matches the user app's
  // POINTS_PER_CONTACT_VIEW in Details.jsx. Sent to /points-deduct on confirm.
  contactRevealPoints: int(process.env.ASSISTANT_CONTACT_REVEAL_POINTS, 10),

  // HMAC secret for signing short-lived assistant session tokens.
  sessionSecret: process.env.ASSISTANT_JWT_SECRET || '',
  // Token lifetime (minutes).
  sessionTtlMin: int(process.env.ASSISTANT_SESSION_TTL_MIN, 720),
  // If true, /token verifies the phone completed OTP (via apiBase) before minting.
  requireVerifiedLogin: bool(process.env.ASSISTANT_REQUIRE_VERIFIED_LOGIN, false),

  // Base URL the read-tools call for LIVE data. In production this is the app's
  // own origin (127.0.0.1:PORT/PPC); in local dev it can point at the prod REST
  // API so the assistant reads live property data. The AI NEVER touches Mongo —
  // every tool goes through this HTTP surface, inheriting the app's endpoints and
  // validation.
  apiBase: (
    process.env.ASSISTANT_API_BASE ||
    `http://127.0.0.1:${process.env.PORT || 5006}/PPC`
  ).replace(/\/+$/, ''),

  // When true, search_properties calls the lean indexed /assistant/search-properties
  // endpoint instead of filtering the on-demand dump in-layer. Turn this on after
  // deploying the assistant to the VPS (in-process, 127.0.0.1) for fast search.
  useLeanSearch: bool(process.env.ASSISTANT_LEAN_SEARCH, false),

  // City base sent on every internal tool call. 'ALL' means the cityScopePlugin
  // applies no restriction, so the assistant can see both PY and CH listings.
  cityBase: process.env.ASSISTANT_CITY_BASE || 'ALL',

  // Rate limits (requests per window).
  rate: {
    windowMs: 5 * 60 * 1000,
    chat: int(process.env.ASSISTANT_RATE_CHAT, 30),
    voice: int(process.env.ASSISTANT_RATE_VOICE, 40),
  },

  voice: {
    maxUploadBytes: 25 * 1024 * 1024, // 25 MB
    minAudioBytes: 1200,              // reject silence (hallucination guard)
    minTranscriptChars: 3,            // reject "you" / "." style hallucinations
  },
};

function assertProviderReady() {
  if (config.provider === 'openai' && !config.openai.apiKey) {
    throw new Error(
      'ASSISTANT_PROVIDER=openai but OPENAI_API_KEY is missing. ' +
      'Set the key or use ASSISTANT_PROVIDER=mock.'
    );
  }
}

// assertProviderReady is attached BEFORE freezing — a frozen object silently
// rejects later property assignment.
config.assertProviderReady = assertProviderReady;

module.exports = Object.freeze(config);
