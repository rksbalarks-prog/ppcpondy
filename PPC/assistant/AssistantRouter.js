// HTTP surface for the assistant. All data routes sit behind requireAssistantSession
// (a verified HMAC token). Chat streams over Server-Sent Events.
//
//   POST   /api/assistant/token        { phone } -> { token }
//   POST   /api/assistant/chat         { message, sessionId?, lang? } -> SSE
//   POST   /api/assistant/transcribe   multipart field "audio" -> { text, lang }
//   POST   /api/assistant/speak        { text, format?, lang? } -> audio bytes
//   GET    /api/assistant/session/:id  -> { messages }
//   DELETE /api/assistant/session/:id  -> reset
//   GET    /api/assistant/status       -> { enabled, provider, greeting }

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');

const config = require('./config');
const { assertProviderReady } = config;
const { requireAssistantSession, mintToken, normalizePhone, canonicalKey } = require('./session');
const { runAgent } = require('./orchestrator');
const { buildMessages, detectLang, STT_VOCAB } = require('./systemPrompt');
const { getProvider } = require('./providers');
const history = require('./store/history');
const OwnerLead = require('./store/OwnerLeadModel');
const { checkRate } = require('./rateLimit');
const { canSpend, record } = require('./tokenBudget');
const { validate } = require('./validate');
const { logEvent } = require('./logger');
const { apiGet } = require('./tools/httpClient');
const { getTool } = require('./tools/registry');
const { inspectMessage, detectPointsIntent } = require('./guardrail');
const { getSettings, getSettingsSync } = require('./settings');

const router = express.Router();

// Disabled -> everything 503s, app otherwise unaffected. The on/off flag is
// admin-editable (settings singleton); env config.enabled is the fallback default.
// This also warms the settings cache once per request for the sync hot-path readers.
router.use(async (req, res, next) => {
  let enabled = config.enabled;
  try { enabled = (await getSettings()).enabled; } catch { /* keep env default */ }
  if (!enabled) return res.status(503).json({ error: 'assistant_disabled' });
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.voice.maxUploadBytes },
  fileFilter: (req, file, cb) => {
    if (/^audio\//i.test(file.mimetype)) cb(null, true);
    else cb(new Error('only audio/* uploads are allowed'));
  },
});

const newSessionId = () => 'sess_' + crypto.randomUUID();

function mimeToExt(mimetype = '') {
  const m = mimetype.toLowerCase().split(';')[0].trim(); // strip ";codecs=opus"
  const map = {
    'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/x-m4a': 'm4a',
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
    'audio/aac': 'aac', 'audio/flac': 'flac',
  };
  return map[m] || (m.split('/')[1] || 'webm');
}

router.get('/status', (req, res) => {
  const s = getSettingsSync();
  // greeting overrides are surfaced so the user widget can show an admin-set welcome.
  res.json({
    enabled: s.enabled,
    provider: config.provider,
    greeting: { en: s.greetingEn || '', ta: s.greetingTa || '' },
  });
});

// ── POST /token ───────────────────────────────────────────────────────────────
// Mints a session token bound to the phone. When requireVerifiedLogin is on, the
// phone must have a verified OTP login (checked against the live API).
router.post('/token', async (req, res) => {
  const { ok, errors, value } = validate(req.body, {
    phone: { type: 'string', required: true, maxLen: 20 },
  });
  if (!ok) return res.status(400).json({ error: errors.join('; ') });

  const phone = normalizePhone(value.phone);
  if (!phone) return res.status(400).json({ error: 'invalid phone' });

  if (config.requireVerifiedLogin) {
    try {
      const digits = canonicalKey(phone);
      const data = await apiGet(`/user-login-history/${digits}`);
      const verified =
        (data?.history || []).some((h) => h.otpStatus === 'verified') || (data?.count > 0);
      if (!verified) return res.status(403).json({ error: 'no_verified_login' });
    } catch (e) {
      return res.status(403).json({ error: 'login_check_failed', detail: e.message });
    }
  }

  try {
    const token = mintToken(phone);
    logEvent({ phone, event: 'token', outcome: 'ok' });
    res.json({ token, expiresInMin: config.sessionTtlMin });
  } catch (e) {
    res.status(500).json({ error: 'mint_failed', detail: e.message });
  }
});

// ── POST /chat (SSE) ──────────────────────────────────────────────────────────
router.post('/chat', requireAssistantSession, async (req, res) => {
  const { phone, key } = req.assistant;

  const rl = checkRate(key, 'chat');
  if (!rl.ok) return res.status(429).json({ error: 'rate_limited', retryAfterMs: rl.retryAfterMs });

  const { ok, errors, value } = validate(req.body, {
    message: { type: 'string', required: true, maxLen: 2000 },
    sessionId: { type: 'string', maxLen: 100 },
    lang: { type: 'string', maxLen: 5 },
  });
  if (!ok) return res.status(400).json({ error: errors.join('; ') });

  const budget = canSpend(key, 3000);
  if (!budget.ok) return res.status(429).json({ error: 'daily_budget_exceeded', remaining: budget.remaining });

  const sessionId = value.sessionId || newSessionId();
  const message = value.message;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // stop nginx from buffering the stream
  });
  // Client-disconnect detection. NOTE: use res.on('close'), NOT req.on('close') —
  // the request stream can emit 'close' as soon as the POST body is fully read,
  // which would abort the stream immediately. res 'close' before writableEnded
  // means the client actually went away.
  let clientGone = false;
  res.on('close', () => { if (!res.writableEnded) clientGone = true; });
  const send = (event, data) => {
    if (clientGone || res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('session', { sessionId });

  const started = Date.now();
  let assistantText = '';
  const actions = [];
  let usage = null;

  try {
    const hist = await history.loadHistory(sessionId, key).catch(() => []);
    await history.appendMessage(sessionId, key, 'user', message).catch(() => {});

    // Guardrail: detect + LEARN from manipulation attempts (owner-contact
    // extraction, jailbreak, impersonation). A repeat abuser is blocked right here
    // with a canned refusal — the model is never called. A first/second attempt
    // passes through, but with a just-in-time refusal note injected into the prompt.
    const guard = await inspectMessage({ text: message, key, sessionId, lang: value.lang })
      .catch(() => ({ flagged: false }));
    if (guard.action === 'block') {
      assistantText = guard.reply;
      send('token', { text: guard.reply });
      // Even a blocked (bypass) attempt is steered to the Points page — show a
      // "Buy Points" button so the user can convert instead of hitting a dead end.
      const blockActions = [];
      if (guard.offerPoints) {
        const pt = getTool('offer_points_purchase');
        if (pt) { const p = pt.proposal(phone, {}); blockActions.push(p); send('action', p); }
      }
      send('done', { text: guard.reply, actions: blockActions });
      await history
        .appendMessage(sessionId, key, 'assistant', guard.reply, blockActions.length ? blockActions : undefined)
        .catch(() => {});
      logEvent({
        phone, event: 'chat', outcome: 'blocked', category: guard.category,
        latencyMs: Date.now() - started,
      });
      return; // finally{} ends the SSE response
    }

    assertProviderReady();

    // When the user is asking for an owner's contact, state their LIVE balance
    // authoritatively. Without this the model can repeat a stale "your balance is 0"
    // from earlier in the SAME conversation (history is replayed each turn) instead
    // of trusting a fresh lookup — which is exactly what users hit after topping up.
    let balanceNote = '';
    if (guard.category === 'contact_extraction') {
      try {
        const b = await getTool('get_my_points_balance').execute(phone);
        balanceNote =
          ` LIVE ACCOUNT DATA (authoritative — OVERRIDES anything said earlier in this conversation): ` +
          `balance=${b.balance} points, revealCost=${b.revealCost}, hasEnoughPoints=${b.hasEnoughPoints}. ` +
          (b.hasEnoughPoints
            ? 'The user CAN afford it — call request_contact_owner so they can Confirm the spend. Do NOT claim their balance is 0 and do NOT show the Buy Points button.'
            : 'The user CANNOT afford it — call offer_points_purchase and insist on the "Buy Points" button.');
      } catch { /* best-effort: fall back to the model calling the tool itself */ }
    }

    const messages = buildMessages({
      history: hist, userMessage: message, lang: value.lang,
      guardrail: (guard.note || '') + balanceNote,
      promptExtra: getSettingsSync().promptExtra,
    });
    // If the user directly asked for the Points page / to buy points, guarantee the
    // "Buy Points" button shows even if the model only describes it in prose.
    const wantsPoints = detectPointsIntent(message);

    for await (const ev of runAgent({ messages, phone, wantsPoints })) {
      if (clientGone) break;
      switch (ev.type) {
        case 'token': assistantText += ev.data; send('token', { text: ev.data }); break;
        case 'tool': send('tool', ev.data); break;
        case 'results': send('results', ev.data); break;
        case 'action': actions.push(ev.data); send('action', ev.data); break;
        case 'done':
          usage = ev.data.usage;
          send('done', { text: ev.data.text, actions: ev.data.actions });
          break;
        case 'error': send('error', { message: ev.data.message }); break;
        default: break;
      }
    }

    await history
      .appendMessage(sessionId, key, 'assistant', assistantText, actions.length ? actions : undefined)
      .catch(() => {});
    if (usage) {
      record(key, usage.total_tokens || 0);
      await history.recordUsage(sessionId, usage.total_tokens || 0).catch(() => {});
    }

    logEvent({
      phone, provider: config.provider, event: 'chat',
      chars: message.length, replyChars: assistantText.length,
      tokens: usage?.total_tokens || 0, actions: actions.length,
      latencyMs: Date.now() - started, outcome: 'ok',
    });
  } catch (e) {
    send('error', { message: e.message });
    logEvent({
      phone, provider: config.provider, event: 'chat',
      latencyMs: Date.now() - started, outcome: 'error', error: e.message,
    });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

// ── POST /transcribe ──────────────────────────────────────────────────────────
router.post('/transcribe', requireAssistantSession, upload.single('audio'), async (req, res) => {
  const { phone, key } = req.assistant;

  const rl = checkRate(key, 'voice');
  if (!rl.ok) return res.status(429).json({ error: 'rate_limited', retryAfterMs: rl.retryAfterMs });

  const file = req.file;
  if (!file || !file.buffer) return res.status(400).json({ error: 'no_audio' });
  // Silence produces STT hallucinations ("you", "."). Reject tiny blobs.
  if (file.size < config.voice.minAudioBytes) {
    return res.status(400).json({ error: 'no_audio', detail: 'recording too short' });
  }

  const started = Date.now();
  try {
    assertProviderReady();
    const provider = getProvider();
    // Extension MUST match the recorded container or STT mis-parses the audio.
    const filename = `voice.${mimeToExt(file.mimetype)}`;
    const { text } = await provider.transcribe({
      buffer: file.buffer, filename, mimetype: file.mimetype, prompt: STT_VOCAB,
    });

    if (!text || text.trim().length < config.voice.minTranscriptChars) {
      logEvent({ phone, provider: config.provider, event: 'transcribe', bytes: file.size, outcome: 'empty', latencyMs: Date.now() - started });
      return res.status(422).json({ error: 'no_speech', text: '' });
    }

    const lang = detectLang(text);
    logEvent({ phone, provider: config.provider, event: 'transcribe', bytes: file.size, chars: text.length, lang, outcome: 'ok', latencyMs: Date.now() - started });
    res.json({ text, lang });
  } catch (e) {
    logEvent({ phone, provider: config.provider, event: 'transcribe', bytes: file?.size, outcome: 'error', error: e.message, latencyMs: Date.now() - started });
    res.status(500).json({ error: 'transcription_failed', detail: e.message });
  }
});

// ── POST /speak ───────────────────────────────────────────────────────────────
router.post('/speak', requireAssistantSession, async (req, res) => {
  const { phone, key } = req.assistant;

  const rl = checkRate(key, 'voice');
  if (!rl.ok) return res.status(429).json({ error: 'rate_limited', retryAfterMs: rl.retryAfterMs });

  const { ok, errors, value } = validate(req.body, {
    text: { type: 'string', required: true, maxLen: 2000 },
    format: { type: 'string', maxLen: 8, default: 'mp3' },
    lang: { type: 'string', maxLen: 5 },
  });
  if (!ok) return res.status(400).json({ error: errors.join('; ') });

  const started = Date.now();
  try {
    assertProviderReady();
    const provider = getProvider();
    const lang = value.lang || detectLang(value.text);
    // Accent/pacing instructions — without these the model reads Tamil in a flat
    // American accent.
    const instructions =
      lang === 'ta'
        ? 'Speak conversational Puducherry Tanglish — Tamil mixed with English. Pronounce the Tamil words with a warm, natural South-Indian accent, and pronounce the English words (BHK, price, sqft, cent, plot, land, apartment, lakh, crore, etc.) in natural Indian English — do NOT Tamil-ise them. Unhurried pace, natural breath at commas, friendly and clear.'
        : 'Speak in English with a warm, natural Indian-English accent. Unhurried pace, natural breath at commas, friendly and clear.';

    const { audio, contentType } = await provider.speak({ text: value.text, format: value.format, instructions });

    logEvent({ phone, provider: config.provider, event: 'speak', chars: value.text.length, bytes: audio.length, lang, outcome: 'ok', latencyMs: Date.now() - started });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', audio.length);
    res.send(audio);
  } catch (e) {
    logEvent({ phone, provider: config.provider, event: 'speak', outcome: 'error', error: e.message, latencyMs: Date.now() - started });
    res.status(500).json({ error: 'tts_failed', detail: e.message });
  }
});

// ── POST /owner-lead ──────────────────────────────────────────────────────────
// Saves an owner's property-intake from the chat as a follow-up lead (NOT a public
// listing). Phone comes from the verified session.
router.post('/owner-lead', requireAssistantSession, async (req, res) => {
  const { phone, key } = req.assistant;

  const rl = checkRate(key, 'chat');
  if (!rl.ok) return res.status(429).json({ error: 'rate_limited', retryAfterMs: rl.retryAfterMs });

  const { ok, errors, value } = validate(req.body, {
    propertyMode: { type: 'string', maxLen: 40 },
    propertyType: { type: 'string', maxLen: 60 },
    bedrooms: { type: 'string', maxLen: 20 },
    floorNo: { type: 'string', maxLen: 40 },
    carParking: { type: 'string', maxLen: 10 },
    lift: { type: 'string', maxLen: 10 },
    price: { type: 'string', maxLen: 20 },
    totalArea: { type: 'string', maxLen: 20 },
    areaUnit: { type: 'string', maxLen: 20 },
    salesType: { type: 'string', maxLen: 30 },
    postedBy: { type: 'string', maxLen: 30 },
    area: { type: 'string', maxLen: 120 },
    pinCode: { type: 'string', maxLen: 12 },
    streetName: { type: 'string', maxLen: 200 },
    contactPhone: { type: 'string', maxLen: 20 },
    lang: { type: 'string', maxLen: 5 },
  });
  if (!ok) return res.status(400).json({ error: errors.join('; ') });

  try {
    const doc = await OwnerLead.create({ phone, ...value });
    logEvent({ phone, event: 'owner_lead', outcome: 'ok' });
    res.json({ ok: true, id: doc._id });
  } catch (e) {
    logEvent({ phone, event: 'owner_lead', outcome: 'error', error: e.message });
    res.status(500).json({ error: 'lead_save_failed', detail: e.message });
  }
});

// ── GET / DELETE session ──────────────────────────────────────────────────────
router.get('/session/:id', requireAssistantSession, async (req, res) => {
  try {
    const messages = await history.getSession(req.params.id, req.assistant.key);
    res.json({ sessionId: req.params.id, messages });
  } catch (e) {
    res.status(500).json({ error: 'session_fetch_failed', detail: e.message });
  }
});

router.delete('/session/:id', requireAssistantSession, async (req, res) => {
  try {
    const r = await history.resetSession(req.params.id, req.assistant.key);
    res.json({ sessionId: req.params.id, ...r });
  } catch (e) {
    res.status(500).json({ error: 'session_reset_failed', detail: e.message });
  }
});

// Multer / body errors within this router -> JSON (keeps the app's error shape).
router.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ error: 'assistant_bad_request', detail: err.message });
});

module.exports = router;
