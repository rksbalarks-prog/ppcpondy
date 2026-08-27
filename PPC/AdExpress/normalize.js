// Cleans up what the vision model returns and shapes it for the review screen
// and, later, for the app's existing bulk-upload publish path.
//
// The model reads the scan well but a scan is still a scan: a smudged digit can
// turn "9994114660" into "999414660". Everything that leaves this module is
// therefore validated rather than trusted — a phone number that is not a real
// Indian number is dropped and the ad is flagged for review instead of being
// silently imported with a wrong contact.

// Indian mobile numbers are 10 digits starting 6-9. Anything else (landlines,
// half-read numbers) is kept aside so the reviewer can still see it.
const MOBILE_RE = /^[6-9]\d{9}$/;

const DEAL_TYPES = new Set(['rent', 'sale', 'wanted', 'unknown']);

/**
 * A 10-digit number that passed MOBILE_RE can still be a bad read: when the
 * scan blurs the second half of a number the model tends to pad it out with
 * zeros or repeat a digit. Real mobiles almost never look like that, so these
 * get flagged for a human rather than silently imported as a contact.
 */
function looksMisread(mobile) {
  if (!mobile) return false;
  if (/(\d)\1{4,}/.test(mobile)) return true; // 5+ of the same digit in a row
  if (/0{4,}$/.test(mobile)) return true; // padded tail
  if (new Set(mobile).size <= 3) return true; // only two or three distinct digits
  return false;
}

// What the model may say -> what the app's property form calls it. Anything not
// in this map is passed through untouched for the reviewer to adjust; the
// form's own dropdown values live in the database (GET /PPC/fetch), so this is
// a best-effort nudge, never a hard mapping.
const PROPERTY_TYPE_MAP = {
  house: 'Independent House',
  'independent house': 'Independent House',
  villa: 'Independent House',
  flat: 'Flat',
  apartment: 'Flat',
  portion: 'Portion',
  room: 'Room',
  pg: 'PG',
  'paying guest': 'PG',
  shop: 'Shop',
  office: 'Office',
  'commercial space': 'Commercial Space',
  godown: 'Godown',
  warehouse: 'Godown',
  building: 'Commercial Space',
  land: 'Land',
  plot: 'Plot',
};

const EDITION_PLACE = {
  Pondicherry: { city: 'Pondicherry', state: 'Puducherry', district: 'Puducherry' },
  Cuddalore: { city: 'Cuddalore', state: 'Tamil Nadu', district: 'Cuddalore' },
};

const clean = (v, max = 400) =>
  v == null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Digits-only Indian phone. Returns { mobile, other } so a landline or a
 * half-read number is preserved for the reviewer without ever being treated as
 * a contact number.
 */
function normalizePhone(value) {
  const digits = String(value == null ? '' : value).replace(/\D/g, '');
  if (!digits) return { mobile: null, other: null };

  // Strip country / trunk prefixes: +91 98… , 0 98… , 0091 98…
  let d = digits;
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 13 && d.startsWith('091')) d = d.slice(3);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);

  if (MOBILE_RE.test(d)) return { mobile: d, other: null };
  // Keep anything plausible-looking (landline / partially read) as a note.
  if (digits.length >= 6 && digits.length <= 13) return { mobile: null, other: digits };
  return { mobile: null, other: null };
}

/** "18K" / "Rs.18,000" / "5 Lakhs" / 18000 -> 18000 */
function normalizeAmount(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? Math.round(value) : null;

  const s = String(value).toLowerCase().replace(/,/g, '');
  const num = parseFloat((s.match(/\d+(?:\.\d+)?/) || [])[0]);
  if (!Number.isFinite(num)) return null;

  // "18K" has no word boundary between the digits and the K, so the suffix is
  // matched directly against the number instead.
  let amount = num;
  if (/lakh|lac|\d\s*l(?![a-z])/.test(s)) amount = num * 100000;
  else if (/crore|\d\s*cr(?![a-z])/.test(s)) amount = num * 10000000;
  else if (/thousand|\d\s*k(?![a-z])/.test(s)) amount = num * 1000;

  if (amount <= 0 || amount > 100000000) return null;
  return Math.round(amount);
}

function normalizeBedrooms(value) {
  if (value == null || value === '') return '';
  const n = parseInt(String(value).match(/\d+/)?.[0], 10);
  return Number.isFinite(n) && n >= 1 && n <= 20 ? String(n) : '';
}

function normalizePropertyType(value) {
  const raw = clean(value, 60);
  if (!raw) return '';
  return PROPERTY_TYPE_MAP[raw.toLowerCase()] || raw;
}

function normalizeMode(value, propertyType) {
  const raw = clean(value, 30).toLowerCase();
  if (raw.startsWith('comm')) return 'Commercial';
  if (raw.startsWith('res')) return 'Residential';
  // Fall back to what the type implies.
  return /shop|office|commercial|godown|warehouse/i.test(propertyType || '')
    ? 'Commercial'
    : 'Residential';
}

/**
 * Decide what an ad's phone numbers are, from several independent readings of
 * the same ad box.
 *
 * The rule is unanimity, and it is deliberately harsh. Majority voting is not
 * safe here: reading a page crop three times, "9994141660" won two votes out of
 * three and the printed number was 9994114660. A number is only taken as read
 * when every pass agrees on every digit — anything less is handed to a person
 * with the picture of the ad.
 *
 * @param {Array<Array<{digits:string,readable:boolean}>>} reads digits-only passes
 * @param {string[]} extracted phones the field-extraction pass reported
 */
function resolvePhones(reads, extracted = []) {
  const passes = (reads || []).filter(Array.isArray);
  const tally = new Map(); // mobile -> { digits, votes, unreadableVotes }
  const others = new Set();
  const order = [];

  for (const pass of passes) {
    const seenThisPass = new Set();
    for (const item of pass) {
      const { mobile, other } = normalizePhone(item && item.digits);
      if (other) others.add(other);
      if (!mobile || seenThisPass.has(mobile)) continue;
      seenThisPass.add(mobile);
      if (!tally.has(mobile)) {
        tally.set(mobile, { digits: mobile, votes: 0, unreadable: 0 });
        order.push(mobile);
      }
      const row = tally.get(mobile);
      row.votes += 1;
      if (item && item.readable === false) row.unreadable += 1;
    }
  }

  const total = passes.length;
  const candidates = order.map((d) => tally.get(d));
  const agreed = candidates.filter((c) => total > 0 && c.votes === total && c.unreadable === 0);

  const extractedMobiles = [];
  for (const p of extracted || []) {
    const { mobile } = normalizePhone(p);
    if (mobile && !extractedMobiles.includes(mobile)) extractedMobiles.push(mobile);
  }

  let status;
  if (!total) status = 'unverified'; // verification did not run
  else if (agreed.length) status = 'verified';
  else if (candidates.length) status = 'disputed';
  else status = 'unreadable';

  const phones = agreed.map((c) => c.digits);
  const extractionDiffers =
    status === 'verified' &&
    extractedMobiles.length > 0 &&
    extractedMobiles.some((m) => !phones.includes(m));

  return {
    phoneStatus: status,
    phones,
    primaryPhone: phones[0] || '',
    phoneCandidates: candidates
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 8)
      .map((c) => ({ digits: c.digits, votes: c.votes, of: total })),
    otherNumbers: [...others].slice(0, 6),
    extractionPhones: extractedMobiles,
    extractionDiffers,
  };
}

/**
 * Turn one raw model object into the shape stored in `adexpress_ads`.
 * `context` carries the issue it came from.
 */
function normalizeAd(raw, context = {}, verification = null) {
  const propertyType = normalizePropertyType(raw.propertyType);
  const dealType = DEAL_TYPES.has(String(raw.dealType || '').toLowerCase())
    ? String(raw.dealType).toLowerCase()
    : 'unknown';

  // With a verification result the agreed digits win; without one (the tile and
  // text fallbacks) the extraction's own reading stands, marked unverified so
  // it can never be imported without a person looking at it.
  let phones = [];
  let otherNumbers = [];
  let phoneStatus = 'unverified';
  let phoneCandidates = [];
  let extractionDiffers = false;

  if (verification) {
    phones = verification.phones.slice();
    otherNumbers = verification.otherNumbers.slice();
    phoneStatus = verification.phoneStatus;
    phoneCandidates = verification.phoneCandidates;
    extractionDiffers = verification.extractionDiffers;
  } else {
    for (const p of Array.isArray(raw.phones) ? raw.phones.slice(0, 6) : []) {
      const { mobile, other } = normalizePhone(p);
      if (mobile && !phones.includes(mobile)) phones.push(mobile);
      else if (other && !otherNumbers.includes(other)) otherNumbers.push(other);
    }
  }

  const rentAmount = normalizeAmount(raw.rentAmount);
  const deposit = normalizeAmount(raw.deposit);
  const areaSqft = normalizeAmount(raw.areaSqft);

  const features = (Array.isArray(raw.features) ? raw.features : [])
    .map((f) => clean(f, 40))
    .filter(Boolean)
    .slice(0, 12);

  const rawText = clean(raw.rawText, 2000);
  const headline = clean(raw.headline, 200);

  // Why an ad still needs a person's eyes.
  const issues = [];
  if (phoneStatus === 'disputed') {
    issues.push('phone number unconfirmed — the readings disagreed');
  } else if (phoneStatus === 'unreadable') {
    issues.push('no phone number could be read from this ad');
  } else if (phoneStatus === 'unverified') {
    issues.push('phone number was not double-checked');
  }
  if (extractionDiffers) issues.push('one reading saw a different number');
  if (!phones.length && phoneStatus === 'verified') issues.push('no valid mobile number');
  if (dealType === 'unknown') issues.push('rent or sale unclear');
  if (otherNumbers.length && !phones.length) issues.push('number could not be read as a mobile');
  if (phones.some(looksMisread)) issues.push('phone digits look misread — check against the ad');
  if (dealType === 'rent' && rentAmount != null && rentAmount < 500) {
    issues.push('rent looks too small to be a monthly figure');
  }

  return {
    ...context,
    dealType,
    headline,
    rawText,
    phones,
    primaryPhone: phones[0] || '',
    otherNumbers,
    phoneStatus,
    phoneCandidates,
    rentAmount,
    deposit,
    bedrooms: normalizeBedrooms(raw.bedrooms),
    propertyMode: normalizeMode(raw.propertyMode, propertyType),
    propertyType,
    locality: clean(raw.locality, 120),
    address: clean(raw.address, 300),
    areaSqft,
    floorNo: clean(raw.floorNo, 30),
    features,
    language: ['en', 'ta', 'mixed'].includes(raw.language) ? raw.language : 'mixed',
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : null,
    reviewIssues: issues,
    needsReview: issues.length > 0,
  };
}

/**
 * Ad identity inside one issue. Crops overlap, so the same box is often read
 * twice; the same phone + deal type + bedrooms in one issue is the same ad.
 */
function adKeyFor(ad) {
  // When the ad was read from a detected box, the box itself is the identity:
  // two boxes are two ads even when the same advertiser printed the same pair
  // of numbers in both (which happens, and used to fold them into one).
  if (ad.box && Number.isFinite(ad.box.x)) {
    return [ad.issueKey || '', `p${ad.pageNo || 0}`, `${ad.box.x},${ad.box.y},${ad.box.w}x${ad.box.h}`].join('|');
  }

  const phones = (ad.phones || []).slice().sort().join(',');
  const fallback = (ad.rawText || ad.headline || '').toLowerCase().replace(/\W+/g, '').slice(0, 60);
  return [
    ad.issueKey || '',
    phones || fallback,
    ad.dealType || '',
    ad.bedrooms || '',
    ad.propertyType || '',
  ].join('|');
}

/** Cross-issue lead identity — lets the screen show "advertised again". */
function leadKeyFor(ad) {
  return [(ad.phones || []).slice().sort().join(','), ad.dealType || ''].join('|');
}

/**
 * Merge the per-crop results of one page/issue. Later reads of the same ad top
 * up fields the earlier read missed (a crop may cut off the rent line).
 */
function mergeAds(ads) {
  const byKey = new Map();

  for (const ad of ads) {
    const key = adKeyFor(ad);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...ad, adKey: key, seenTimes: 1 });
      continue;
    }

    existing.seenTimes += 1;
    // Prefer the richer read for every optional field.
    for (const f of ['rentAmount', 'deposit', 'areaSqft']) {
      if (existing[f] == null && ad[f] != null) existing[f] = ad[f];
    }
    for (const f of ['bedrooms', 'locality', 'address', 'floorNo', 'headline', 'propertyType']) {
      if (!existing[f] && ad[f]) existing[f] = ad[f];
    }
    if ((ad.rawText || '').length > (existing.rawText || '').length) existing.rawText = ad.rawText;
    for (const n of ad.otherNumbers || []) {
      if (!existing.otherNumbers.includes(n)) existing.otherNumbers.push(n);
    }
    if (!existing.features.length && ad.features.length) existing.features = ad.features;
    if ((ad.confidence || 0) > (existing.confidence || 0)) existing.confidence = ad.confidence;

    // Merging must never soften a phone verdict. A confirmed reading beats an
    // unconfirmed one; two records that disagree stay disagreeing.
    const rank = { verified: 3, disputed: 2, unreadable: 1, unverified: 0 };
    if ((rank[ad.phoneStatus] || 0) > (rank[existing.phoneStatus] || 0)) {
      existing.phoneStatus = ad.phoneStatus;
      existing.phones = ad.phones.slice();
      existing.phoneCandidates = ad.phoneCandidates;
      existing.reviewIssues = ad.reviewIssues.slice();
    } else if (
      ad.phoneStatus === existing.phoneStatus &&
      // Compare the numbers as a set: an ad that prints two numbers can report
      // them in either order, and that is agreement, not a disagreement.
      ad.phones.slice().sort().join(',') !== existing.phones.slice().sort().join(',')
    ) {
      existing.phoneStatus = 'disputed';
      existing.reviewIssues = [...new Set([...existing.reviewIssues, 'two readings of this ad disagreed'])];
    }
    existing.primaryPhone = existing.phones[0] || '';
    existing.needsReview = existing.reviewIssues.length > 0;
  }

  return [...byKey.values()].map((a) => ({ ...a, leadKey: leadKeyFor(a) }));
}

/**
 * Shape a staged ad into a row for the app's existing
 * POST /PPC/bulk-upload-properties endpoint — the same path the admin's Excel
 * bulk upload already uses. `defaults` lets the importer fill the fields a
 * newspaper ad never states (salesType, postedBy, area) so a row can land as
 * complete rather than pending.
 *
 * This is the sale-side shape: `price` rather than a monthly rent, `salesType`
 * rather than a tenant preference, and no availability/tenant fields at all.
 */
// Digit runs long enough to be a contact number. Shorter runs — rents, plot
// sizes, floor areas, pin codes — are left alone.
const PHONE_LIKE = /\d(?:[\s.\-()]*\d){7,13}/g;
// Labels that are left dangling once the number after them is gone.
const ORPHAN_LABEL = /\b(cell|ph|phone|mob|mobile|contact|call|whatsapp|tel)\b\s*[:.\-]?\s*(?=[,|/)\].]|$)/gi;

/**
 * Take the contact numbers out of text that will be published.
 *
 * The description is shown on the public listing page and is fed to the
 * crawlable SEO pages, while the app charges points to reveal an owner's
 * number. Copying the advertisement's text through verbatim would give every
 * scraped number away for free, and to Google — so the digits come out here.
 */
function withoutPhoneNumbers(text) {
  return String(text || '')
    .replace(PHONE_LIKE, (match) => (match.replace(/\D/g, '').length >= 10 ? ' ' : match))
    .replace(ORPHAN_LABEL, '')
    // tidy up the punctuation the removal leaves behind
    .replace(/\s*([,|/])\s*(?=[,|/])/g, ' ')
    .replace(/\s*[,|/:;-]\s*$/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function toBulkUploadRow(ad, defaults = {}) {
  const place = EDITION_PLACE[ad.edition] || EDITION_PLACE.Pondicherry;
  // No contact numbers, and no mention of where the listing was sourced from —
  // this text is public.
  const descriptionBits = [
    withoutPhoneNumbers(ad.headline),
    withoutPhoneNumbers(ad.rawText),
    ad.features && ad.features.length ? `Features: ${ad.features.join(', ')}` : '',
  ].filter(Boolean);

  const row = {
    phoneNumber: ad.primaryPhone || '',
    alternatePhone: (ad.phones || [])[1] || '',
    phoneNumberCountryCode: '+91',
    alternatePhoneCountryCode: '+91',
    propertyMode: ad.propertyMode || '',
    propertyType: ad.propertyType || '',
    // The asking price, not a monthly figure — the ad's "rent" slot carries it
    // for a sale box because the extractor reports whatever money it printed.
    price: ad.rentAmount == null ? '' : ad.rentAmount,
    bedrooms: ad.bedrooms || '',
    floorNo: ad.floorNo || '',
    totalArea: ad.areaSqft == null ? '' : ad.areaSqft,
    areaUnit: ad.areaSqft == null ? '' : defaults.areaUnit || 'Sq.ft',
    country: 'India',
    state: place.state,
    district: place.district,
    city: place.city,
    area: ad.locality || '',
    rentalPropertyAddress: ad.address || ad.locality || '',
    description: descriptionBits.join(' | ').slice(0, 1500),
    // Helper columns the bulk endpoint knowingly ignores, kept so the sheet /
    // payload stays self-documenting.
    heading: ad.headline || '',
    sourcePage: ad.pageNo || '',
    SourceFile: ad.issueLabel || '',
    IssueDate: ad.issueDate ? new Date(ad.issueDate).toISOString().slice(0, 10) : '',
  };

  // Anything the ad did not state falls back to the caller's default — including
  // areaUnit, which is left blank above precisely so this can fill it. Without
  // it a row with no printed area has no unit either, and the completeness gate
  // drops the whole listing into Pending.
  for (const [field, value] of Object.entries(defaults)) {
    if (value !== undefined && value !== null && String(value).trim() !== '' && !row[field]) {
      row[field] = value;
    }
  }

  return row;
}

module.exports = {
  withoutPhoneNumbers,
  normalizePhone,
  normalizeAmount,
  normalizeAd,
  resolvePhones,
  looksMisread,
  adKeyFor,
  leadKeyFor,
  mergeAds,
  toBulkUploadRow,
  EDITION_PLACE,
};
