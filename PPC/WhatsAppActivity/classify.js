// Works out what a WhatsApp message is about from its text (the templates in the
// website / Flutter app), and masks OTP codes so they are never stored.

const CATEGORIES = [
  // key, label, audience, test — first match wins
  ['otp', 'Login OTP', 'account', /\bOTP\b/i],
  ['login_failed', 'Login failed', 'account', /login attempt failed/i],
  ['login', 'Login success', 'account', /login successful/i],
  ['logout', 'Logged out', 'account', /logged out/i],
  ['contact_view', 'Owner contact viewed', null, /viewed (your|the owner'?s) contact/i],
  ['address', 'Address request', null, /address/i],
  ['call', 'Call', null, /\bcalling\b/i],
  ['interest', 'Interest', null, /\binterest\b/i],
  ['offer', 'Offer', null, /made an offer|your offer/i],
  ['photo_request', 'Photo request', null, /requested photos|photo request/i],
  ['favorite', 'Favourite', null, /favou?rite/i],
  ['share', 'Property shared', null, /property shared|shared (this|your) property/i],
  ['property_view', 'Property viewed', null, /currently visit the property|has been viewed by/i],
];
const LABELS = Object.fromEntries([...CATEGORIES.map(([k, l]) => [k, l]), ['other', 'Other']]);

const last10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);

function maskOtp(text) {
  return String(text || '').replace(/(\bOTP\b[^0-9]{0,40})(\d{4,8})/gi, (m, pre, code) => `${pre}${'•'.repeat(code.length)}`);
}

function classify(rawMessage, to) {
  const message = String(rawMessage || '');
  const hit = CATEGORIES.find(([, , , re]) => re.test(message));
  const category = hit ? hit[0] : 'other';
  let audience = hit && hit[2];
  if (!audience) {
    audience = /^\W*(hello|hi)\s+(property\s+)?owner\b/i.test(message) || /your property has been/i.test(message) ? 'owner' : 'user';
  }
  const recipient = last10(to);
  const others = (message.match(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/g) || []).map(last10).filter((p) => p !== recipient);
  const id = message.match(/(?:rent|ppc|property)\s*id\s*[:#-]?\s*(\d{1,9})/i);
  return {
    category,
    audience,
    aboutPhone: others[0] || '',
    ppcId: id ? Number(id[1]) : null,
    message: maskOtp(message).slice(0, 2000),
  };
}

module.exports = { classify, maskOtp, LABELS, last10 };
