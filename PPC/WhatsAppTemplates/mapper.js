// The website / Flutter app send their action alerts as free text to POST /send-message
// (one fixed text per action - Components/Details.jsx, Login.jsx, AllProperty.jsx...).
// This reads such a text and says which approved template carries the same news, with
// its values - so templates can be switched on WITHOUT changing or releasing the
// website or the app. Anything it cannot read confidently -> null, and the message
// goes by OneMsg exactly as before.

const { classify, last10 } = require('../WhatsAppActivity/classify');
const { BY_KEY } = require('./templates');

// What each classify() category becomes, per audience.
const CATEGORY_KEY = {
  otp: { account: 'login_otp' },
  login: { account: 'login_success' },
  login_failed: { account: 'login_failed' },
  logout: { account: 'logout' },
  call: { owner: 'owner_call', user: 'user_call' },
  interest: { owner: 'owner_interest', user: 'user_interest' },
  address: { owner: 'owner_address_request', user: 'user_address_request' },
  contact_view: { owner: 'owner_contact_viewed', user: 'user_contact_viewed' },
  photo_request: { owner: 'owner_photo_request', user: 'user_photo_request' },
  favorite: { owner: 'owner_favorite', user: 'user_favorite' },
  offer: { owner: 'owner_offer', user: 'user_offer' },
  share: { owner: 'owner_shared', user: 'user_shared' },
  property_view: { owner: 'owner_viewed', user: 'user_viewed' },
};

// A template value: one line, no tabs, no runs of spaces, not empty (Meta refuses all four).
const val = (v, fallback) => {
  const s = String(v == null ? '' : v).replace(/N\/A,?\s*/g, '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '').trim();
  return (s || fallback).slice(0, 80);
};
const grab = (text, re) => { const m = String(text).match(re); return m ? (m.slice(1).find((x) => x != null) || '').trim() : ''; };

function fields(text) {
  return {
    ppcId: grab(text, /(?:Rent|PPC|Property)\s*ID\s*[:#-]?\s*(\d{1,9})/i),
    other: grab(text, /User Phone:\s*([+\d][\d\s-]{8,})|Contact(?: Number)?:\s*([+\d][\d\s-]{8,})|Shared by:\s*([+\d][\d\s-]{8,})|viewed by\s*([+\d][\d\s-]{8,})/i),
    place: grab(text, /Location:\s*([^\n]+)/i) || grab(text, /Property:\s*([^\n(]+)/i),
    ownerName: grab(text, /Owner(?: Name)?:\s*([^\n]+)/i),
    ownerPhone: grab(text, /Owner (?:Phone|Contact):\s*([+\d][\d\s-]{8,})/i),
    amount: grab(text, /Offered (?:Rent|Price|Amount):\s*₹?\s*([\d,]+)/i),
    otp: grab(text, /OTP[^0-9]{0,40}?(\d{4,8})/i),
  };
}

const phone10 = (p) => last10(p) || '';
const when = () => new Date().toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

/**
 * -> { key, params[] } or null.
 * `firstLogin` (from the caller) turns a "Login successful" into the Welcome template.
 */
function toTemplate(message, to, { firstLogin = false } = {}) {
  const info = classify(message, to);
  // "Login Attempt Failed ... incorrect OTP was entered" is filed under 'otp' by classify (first match wins).
  if (info.category === 'otp' && /login attempt failed/i.test(message)) { info.category = 'login_failed'; info.audience = 'account'; }
  const map = CATEGORY_KEY[info.category];
  let key = map && map[info.audience];
  if (!key) return null;
  if (key === 'login_success' && firstLogin) key = 'welcome';
  const f = fields(message);
  const tail = phone10(to).slice(-4);
  const id = f.ppcId;
  const place = val(f.place, 'Pondicherry');
  const other = phone10(f.other);
  const prop = id ? `PPC ID ${id}` : 'on Pondy Properties';

  let params;
  switch (key) {
    case 'login_otp': if (!f.otp) return null; params = [f.otp]; break;
    case 'welcome': params = [tail]; break;
    case 'login_success': case 'login_failed': case 'logout': params = [tail, when()]; break;
    case 'owner_call': case 'owner_interest': case 'owner_address_request': case 'owner_shared': case 'owner_viewed':
      if (!id || !other) return null; params = [id, place, other]; break;
    case 'user_call': case 'user_interest': case 'user_address_request': case 'user_photo_request':
    case 'user_favorite': case 'user_shared': case 'user_viewed':
      if (!id) return null; params = [id, place]; break;
    case 'owner_contact_viewed': if (!id || !other) return null; params = [id, other]; break;
    case 'user_contact_viewed':
      if (!id || !phone10(f.ownerPhone)) return null; params = [id, val(f.ownerName, 'Owner'), phone10(f.ownerPhone)]; break;
    case 'owner_photo_request': case 'owner_favorite': if (!other) return null; params = [prop, other]; break;
    case 'owner_offer': if (!f.amount || !id || !other) return null; params = [f.amount, id, place, other]; break;
    case 'user_offer': if (!f.amount || !id) return null; params = [f.amount, id, place]; break;
    default: return null;
  }
  const t = BY_KEY[key];
  if (!t || params.length !== t.example.length || params.some((p) => !String(p).trim())) return null;
  return { key, params: params.map((p) => val(p, '-')) };
}

module.exports = { toTemplate, CATEGORY_KEY, fields };
