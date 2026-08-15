// Signed assistant session. A short-lived HMAC token binds the assistant to ONE
// verified phone. The middleware injects that phone into every tool call
// server-side, so the model (or a prompt injection) can never pivot to another
// user's data. Uses Node's built-in crypto — no new dependency.
//
// Token format:  base64url(payloadJSON) "." base64url(hmacSHA256)
// payload = { p: <phone>, exp: <epoch ms> }

const crypto = require('crypto');
const config = require('./config');

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(payloadB64) {
  return crypto.createHmac('sha256', config.sessionSecret).update(payloadB64).digest('base64url');
}

// Preserve the phone format the client uses (the app stores "+91XXXXXXXXXX" and
// the prod endpoints match on that). We only validate that it looks like a phone.
function normalizePhone(raw) {
  const s = String(raw || '').trim();
  const digits = s.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return s;
}

// Stable internal key for scoping (store, rate limit, budget): last 10 digits.
function canonicalKey(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function mintToken(phone, now = Date.now()) {
  if (!config.sessionSecret) throw new Error('ASSISTANT_JWT_SECRET is not set');
  const payload = { p: phone, exp: now + config.sessionTtlMin * 60 * 1000 };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function verifyToken(token, now = Date.now()) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new Error('missing token');
  }
  const [payloadB64, sig] = token.split('.');
  const expected = sign(payloadB64);
  const a = Buffer.from(sig || '', 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('bad signature');
  }
  let payload;
  try { payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')); }
  catch { throw new Error('bad payload'); }
  if (!payload.exp || payload.exp < now) throw new Error('token expired');
  const phone = normalizePhone(payload.p);
  if (!phone) throw new Error('bad phone in token');
  return { phone, key: canonicalKey(phone) };
}

// Express middleware: requires a valid Bearer token, sets req.assistant.
function requireAssistantSession(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : (req.headers['x-assistant-token'] || '');
    const { phone, key } = verifyToken(token);
    req.assistant = { phone, key };
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized', detail: e.message });
  }
}

module.exports = { mintToken, verifyToken, requireAssistantSession, normalizePhone, canonicalKey };
