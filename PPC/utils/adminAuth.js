/**
 * Lightweight, dependency-free admin auth tokens.
 *
 * We sign a compact token (same shape as a JWT) using HMAC-SHA256 over a
 * base64url-encoded JSON payload. No external library is required — this uses
 * Node's built-in `crypto`, so nothing new has to be installed on the
 * production backend.
 *
 * Token format:  base64url(payloadJSON) + "." + base64url(HMAC_SHA256(payloadJSON))
 *
 * The payload carries { name, role, base, exp } where `exp` is an absolute
 * expiry timestamp in ms since epoch. The HMAC signature makes the payload
 * tamper-proof: a client cannot change their role or expiry without knowing
 * the server secret.
 */

const crypto = require('crypto');

// Secret used to sign tokens. MUST be set in production via the
// ADMIN_JWT_SECRET env var. The fallback only exists so local/dev keeps
// working; a warning is logged so it is never silently relied on in prod.
const SECRET =
  process.env.ADMIN_JWT_SECRET ||
  (() => {
    console.warn(
      '[adminAuth] ADMIN_JWT_SECRET is not set — using an insecure built-in ' +
        'fallback. Set ADMIN_JWT_SECRET in the backend environment for production.'
    );
    return 'ppc-insecure-dev-secret-change-me';
  })();

// Token lifetime in days. Default 0 = NEVER expires (the admin stays logged in
// until they click Logout). Set ADMIN_TOKEN_TTL_DAYS to a positive number to
// enforce a finite expiry instead (e.g. 30 = re-login monthly).
const rawTtl = process.env.ADMIN_TOKEN_TTL_DAYS;
const TTL_DAYS = rawTtl === undefined || rawTtl === '' ? 0 : Number(rawTtl);

const b64url = (buf) =>
  Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const sign = (data) =>
  b64url(crypto.createHmac('sha256', SECRET).update(data).digest());

/** Create a signed token for an authenticated admin. */
function signAdminToken({ name, role, base }, ttlDays = TTL_DAYS) {
  const payload = {
    name,
    role,
    base: base || 'ALL',
  };
  // Only stamp an expiry when a positive TTL is configured. With ttlDays <= 0
  // the token carries no `exp` and is valid until the admin logs out (or the
  // server secret is rotated).
  if (Number.isFinite(ttlDays) && ttlDays > 0) {
    payload.exp = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  }
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/**
 * Verify a token string. Returns the payload object, or null if the token is
 * missing, malformed, tampered with, or expired.
 */
function verifyAdminTokenString(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [body, providedSig] = token.split('.');
  if (!body || !providedSig) return null;

  const expectedSig = sign(body);
  // Constant-time comparison to avoid signature timing attacks.
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64').toString('utf8'));
  } catch (_) {
    return null;
  }

  if (!payload) return null;
  // A token without `exp` never expires; one with `exp` is rejected once past.
  if (typeof payload.exp === 'number' && Date.now() > payload.exp) {
    return null;
  }
  return payload;
}

/**
 * Express middleware: require a valid admin token.
 *
 * On success sets req.admin = payload and calls next(). On failure responds
 * 401 with a distinctive { code: 'TOKEN_INVALID' } so the frontend can tell a
 * genuine "session expired" apart from other 401s (e.g. a wrong OTP at login,
 * which must NOT trigger a global logout).
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyAdminTokenString(token);

  if (!payload) {
    return res.status(401).json({
      code: 'TOKEN_INVALID',
      message: 'Session expired. Please log in again.',
    });
  }

  req.admin = payload;
  next();
}

module.exports = { signAdminToken, verifyAdminTokenString, requireAdmin };
