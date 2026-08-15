// Central PII sanitizer for everything a READ tool returns to the model / UI.
//
// An owner's contact is PAYWALLED — it may only be revealed through the points
// flow (request_contact_owner -> /points-deduct, then the app fetches the number).
// The assistant must therefore NEVER surface it. Two layers of defense make that
// robust against prompt-manipulation ("give me the raw data", "ignore the rules",
// "I'm the admin", instructions hidden inside a description, etc.):
//
//   1. safeDetail(): an ALLOWLIST for the full property record. Only known-safe
//      display fields survive; every other field — including any future schema
//      column — is dropped. A denylist would leak every phone/PII field it forgot
//      to name. The /property/:ppcId endpoint returns the ENTIRE AddModel
//      document, and that document carries several numbers a denylist misses:
//      `alternatePhone`, `assignedPhoneNumber`, `countryCode`, plus arrays of
//      other users' phones (contactRequests, interestRequests, favoriteRequests,
//      soldOutReport, ...).
//   2. scrubPII(): a recursive net applied to EVERY read-tool result before it
//      reaches either the model or the UI. It drops keys whose NAME implies
//      contact info and redacts any phone/email-looking VALUE at any depth — so
//      even an unanticipated field can never expose a number.

// Known-safe, user-facing property fields for the SALE schema (AddModel.js).
// Deliberately EXCLUDES all contact/PII: phoneNumber, assignedPhoneNumber,
// previouslyAssignedPhoneNumber, alternatePhone, countryCode, email, ownerName,
// bestTimeToCall, and the exact-address fields streetName / doorNumber /
// rentalPropertyAddress / locationCoordinates (revealed with the paywalled
// contact, not by the AI). Engagement arrays that hold other users' phone numbers
// (contactRequests, interestRequests, favoriteRequests, favoriteRemoved,
// alreadySaved, helpRequests, reportProperty, soldOutReport, remarks) are omitted.
const SAFE_DETAIL_FIELDS = [
  'ppcId', 'propertyMode', 'propertyType', 'propertyAge',
  'bedrooms', 'kitchen', 'kitchenType', 'balconies', 'attachedBathrooms',
  'western', 'floorNo', 'numberOfFloors', 'facing', 'furnished', 'lift',
  'carParking', 'wheelChairAvailable',
  'price', 'negotiation', 'bankLoan', 'onDemand',
  'length', 'breadth', 'totalArea', 'areaUnit', 'ownership',
  'propertyApproved', 'postedBy', 'salesMode', 'salesType', 'description',
  'area', 'city', 'district', 'state', 'country', 'nagar', 'pinCode',
  'photos', 'video', 'views', 'planName', 'featureStatus', 'base', 'status',
];

// A run of 9+ phone-ish characters (digits plus the usual separators) — long
// enough to skip pincodes (6) and areas, short enough to still catch a 10-digit
// mobile written with spaces/dashes/brackets.
//
// NOTE for a SALE app: prices here are 6–9 digits (e.g. 4500000), which this
// pattern WOULD otherwise redact. Bare numeric values are therefore left alone —
// scrubPII only rewrites STRINGS, and prices arrive as numbers. Prices that are
// stringified are formatted by the UI, not by the model.
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Key NAMES that always imply contact info — dropped wholesale, whatever the value.
const CONTACT_KEY_RE = /(phone|mobile|whatsapp|contact|e-?mail|alternate|altnumber)/i;
const REDACTED = '[hidden]';

// Recursively strip contact info from any tool result. Objects: drop contact-named
// keys, recurse the rest. Strings: redact phone/email substrings. Arrays: map.
function scrubPII(value, depth = 0) {
  if (value == null || depth > 8) return value;
  if (typeof value === 'string') {
    return value.replace(EMAIL_RE, REDACTED).replace(PHONE_RE, REDACTED);
  }
  if (Array.isArray(value)) return value.map((v) => scrubPII(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (CONTACT_KEY_RE.test(k)) continue; // drop the whole contact field
      out[k] = scrubPII(v, depth + 1);
    }
    return out;
  }
  return value; // number / boolean
}

// Reduce a full property document to the safe, user-facing fields, then run the
// recursive scrub as a belt-and-braces second pass.
function safeDetail(p) {
  if (!p || typeof p !== 'object') return p;
  const out = {};
  for (const k of SAFE_DETAIL_FIELDS) if (p[k] !== undefined) out[k] = p[k];
  // Mirror the lean card's price display so callers/UI show a value even when the
  // listing is priced on demand.
  out.priceDisplay = p.onDemand || p.price === 'On Demand' ? 'On Demand' : p.price;
  return scrubPII(out);
}

module.exports = { scrubPII, safeDetail, SAFE_DETAIL_FIELDS };
