// Last resort for a locality the local gazetteer does not know: ask public
// records what pincode it sits in.
//
// Only reached when locality.js has already failed, because it is slow (rate
// limited) and second-hand. Two sources, in order:
//
//   1. India Post's public pincode API (api.postalpincode.in) — authoritative,
//      but only knows POST OFFICE names, so it answers for "Sedarapet" and not
//      for "Raghavendra Nagar".
//   2. OpenStreetMap / Nominatim — knows sub-localities and nagars, which is
//      most of what a classified ad actually prints.
//
// Everything is validated hard before it is believed, because a loose lookup is
// worse than no lookup: asked for "Santhi Nagar", India Post cheerfully returns
// 673582 in KOZHIKODE, KERALA. Only a 605xxx pincode in Puducherry is accepted.
//
// Every answer — including "no answer" — is cached in Mongo, so a name is
// looked up once ever and repeat issues cost nothing.

const mongoose = require('mongoose');
const config = require('./config');

const PONDICHERRY_PIN = /^605\d{3}$/;

const cacheSchema = new mongoose.Schema(
  {
    // The normalised text that was looked up.
    key: { type: String, required: true, unique: true, trim: true },
    query: { type: String, default: '' },
    area: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    // 'indiapost' | 'osm' | 'none'
    source: { type: String, default: 'none' },
    // Set by hand to stop a bad answer being used again.
    rejected: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'adexpress_localities' }
);

const LocalityCache = mongoose.model('AdExpressLocality', cacheSchema);

const normalise = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[.,/\\()\-–—:;|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Local shorthand the ads use that no gazetteer lists under that name. OSM
 * finds "Indira Gandhi Medical College" instantly and "IGMC" not at all.
 */
const LANDMARK_ALIASES = [
  [/\bIGMC\b/i, 'Indira Gandhi Medical College'],
  [/\bJIPMER\b/i, 'Jawaharlal Institute of Postgraduate Medical Education and Research'],
  [/\bPIMS\b/i, 'Pondicherry Institute of Medical Sciences'],
  [/\bMGMC\b/i, 'Mahatma Gandhi Medical College'],
  [/\bSMVEC\b/i, 'Sri Manakula Vinayagar Engineering College'],
  [/\bPU\b/i, 'Pondicherry University'],
];

function expandLandmark(text) {
  let out = String(text || '');
  for (const [re, full] of LANDMARK_ALIASES) {
    if (re.test(out)) out = out.replace(re, full);
  }
  return out;
}

/**
 * Ads describe where a place is, not what it is called: "near Kamaraj
 * Mandapam", "opp. to IGMC Hospital", "Behind Hotel Surguru". A geocoder finds
 * the landmark perfectly well once the relative wording is taken off the front,
 * and the landmark's pincode is the property's pincode.
 */
function landmarkOf(text) {
  const cleaned = expandLandmark(String(text || ''))
    .replace(/^\s*(?:near(?:by)?|opp\.?(?:\s*to)?|opposite|behind|back\s*side\s*(?:of)?|beside|next\s*to|adjacent\s*to|close\s*to|@)\s+/i, '')
    .replace(/\s*(?:exact\s+)?back\s*side(?:\s+road)?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const original = String(text || '').replace(/\s+/g, ' ').trim();
  return cleaned && cleaned.toLowerCase() !== original.toLowerCase() ? cleaned : null;
}

// Nominatim's usage policy asks for at most one request a second and a
// descriptive User-Agent. Both are honoured here.
let lastCall = 0;
async function politely(url) {
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), config.geocodeTimeoutMs);
  try {
    return await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': config.userAgent, Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** India Post: exact post-office names only, and only in Puducherry. */
async function fromIndiaPost(text) {
  const res = await politely(
    `https://api.postalpincode.in/postoffice/${encodeURIComponent(text)}`
  );
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  const offices = Array.isArray(body) && body[0] ? body[0].PostOffice : null;
  if (!Array.isArray(offices)) return null;

  for (const po of offices) {
    const pin = String(po.Pincode || '').trim();
    const state = String(po.State || '').toLowerCase();
    // The state guard is the whole point — see the Kozhikode note above.
    if (!PONDICHERRY_PIN.test(pin)) continue;
    if (!state.includes('pondicherry') && !state.includes('puducherry')) continue;
    return { area: String(po.Name || text).trim(), pinCode: pin, source: 'indiapost' };
  }
  return null;
}

/** OpenStreetMap: knows nagars and streets, scoped to Puducherry. */
async function fromOsm(text) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=3&q=' +
    encodeURIComponent(`${text}, Puducherry, India`);
  const res = await politely(url);
  if (!res.ok) return null;
  const rows = await res.json().catch(() => null);
  if (!Array.isArray(rows)) return null;

  for (const row of rows) {
    const address = row.address || {};
    const pin = String(address.postcode || '').replace(/\s+/g, '');
    const state = String(address.state || '').toLowerCase();
    if (!PONDICHERRY_PIN.test(pin)) continue;
    if (!state.includes('puducherry') && !state.includes('pondicherry')) continue;

    // Prefer a real place name over the raw query when OSM gives one.
    const name =
      address.suburb || address.neighbourhood || address.village ||
      address.town || address.city_district || row.name || text;
    return { area: String(name).trim(), pinCode: pin, source: 'osm' };
  }
  return null;
}

/**
 * Resolve a locality to { area, pinCode } using public records.
 *
 * Returns null when nothing trustworthy is found — the caller then leaves the
 * listing without a pincode rather than filing it somewhere invented.
 */
async function lookup(text) {
  if (!config.geocodeEnabled) return null;
  const key = normalise(text);
  // Too short or numeric-only to be a place name worth asking about.
  if (key.length < 4 || /^\d+$/.test(key)) return null;

  const cached = await LocalityCache.findOne({ key }).lean().catch(() => null);
  if (cached) {
    if (cached.rejected || !cached.pinCode) return null;
    return { area: cached.area, pinCode: cached.pinCode, source: cached.source };
  }

  let found = null;
  try {
    found = (await fromIndiaPost(text)) || (await fromOsm(text));
    // Nothing under the phrase as printed — try the landmark inside it.
    if (!found) {
      const landmark = landmarkOf(text);
      if (landmark) found = await fromOsm(landmark);
    }
  } catch (err) {
    // A lookup failure must never cost the import — try again next time by
    // simply not caching it.
    console.error('[AdExpress] locality lookup failed for', key, '-', err.message);
    return null;
  }

  await LocalityCache.updateOne(
    { key },
    {
      $set: {
        query: String(text).slice(0, 200),
        area: found ? found.area : '',
        pinCode: found ? found.pinCode : '',
        source: found ? found.source : 'none',
      },
      $setOnInsert: { key },
    },
    { upsert: true }
  ).catch(() => {});

  return found;
}

module.exports = { lookup, LocalityCache };
