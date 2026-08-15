/**
 * City-base filtering helper.
 *
 * The platform serves two cities, identified by a `base` code on each
 * property / buyer / user document:
 *   'PY' = Pondicherry   (the original city)
 *   'CH' = Chennai
 *
 * Legacy documents created before this feature have NO `base` field at all.
 * They belong to Pondicherry, so the 'PY' filter intentionally also matches
 * documents where `base` is null or missing. This keeps Pondicherry views
 * correct even if the one-time backfill migration has not been run yet.
 *
 * The 'CH' filter is strict: it matches only documents explicitly tagged 'CH'.
 *
 * Any other value (including 'ALL', undefined, or empty) returns an empty
 * filter `{}`, meaning "no city restriction" — used by the admin ALL view and
 * by every endpoint that does not send a base.
 */

const VALID_BASES = ['PY', 'CH'];

/**
 * Normalise an incoming base value to 'PY' | 'CH' | null.
 * Accepts the raw query/body value; trims and upper-cases it.
 * Returns null for 'ALL', empty, or anything unrecognised.
 */
function normalizeBase(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim().toUpperCase();
  return VALID_BASES.includes(v) ? v : null;
}

/**
 * Build a Mongo filter fragment for the given base.
 * Spread the result into an existing query object, e.g.:
 *   AddModel.find({ status: 'active', ...baseFilter(req.query.base) })
 *
 * @param {string} value - raw base value ('PY' | 'CH' | 'ALL' | undefined)
 * @returns {object} a filter fragment ({} when no restriction applies)
 */
function baseFilter(value) {
  const base = normalizeBase(value);
  if (base === 'CH') return { base: 'CH' };
  if (base === 'PY') return { base: { $in: ['PY', null] } }; // null also matches missing field
  return {};
}

/**
 * Resolve the base to STORE on a newly created document.
 * New records are 'CH' only when explicitly created in the Chennai section;
 * everything else falls back to 'PY'.
 *
 * @param {string} value - raw base value from the request
 * @returns {'PY'|'CH'}
 */
function resolveCreateBase(value) {
  return normalizeBase(value) === 'CH' ? 'CH' : 'PY';
}

/**
 * Resolve the base from a record's actual address fields.
 *
 * This is the authoritative way to tag a property / buyer request: the city
 * a listing belongs to is decided by where the property *is*, not by which
 * section the user happened to be browsing when they posted it.
 *
 * Classification uses the `city` field first, then `district`. Pincode is
 * deliberately NOT used: the data contains Pondicherry properties carrying
 * stray 600xxx ("Chennai-looking") pincodes, so trusting pincode wrongly
 * drags them into Chennai.
 *
 * A record is 'CH' only when its city/district names Chennai (or Madras).
 * Anything naming Pondicherry/Puducherry — and any address we cannot
 * classify — is 'PY', matching the platform's Pondicherry-first default.
 *
 * @param {object} addr - a record (or plain object) with city / district
 * @returns {'PY'|'CH'}
 */
function resolveBaseFromAddress(addr = {}) {
  // `chenn?ai` also matches the common "Chenai" misspelling (single n).
  const isChennai = (t) => /\bchenn?ai\b/.test(t) || /\bmadras\b/.test(t);
  const isPondicherry = (t) => /\b(pondicherry|puducherry|pondy)\b/.test(t);

  const city = String(addr.city || '').toLowerCase();
  const district = String(addr.district || '').toLowerCase();

  // The city field is the most specific signal — check it first.
  if (isChennai(city)) return 'CH';
  if (isPondicherry(city)) return 'PY';
  // Fall back to the district name.
  if (isChennai(district)) return 'CH';
  if (isPondicherry(district)) return 'PY';

  // Unclassified addresses default to Pondicherry (the platform's home city).
  return 'PY';
}

/**
 * Resolve the base to STORE when a CH-scoped or PY-scoped admin saves a
 * record, falling back to address-based resolution otherwise.
 *
 * The admin frontend appends `?base=` to every backend call (via an axios
 * interceptor) carrying the staff member's chosen city scope. When that
 * scope is 'PY' or 'CH' we honour it: the admin only sees that city and
 * any record they create or edit must belong there, even if the user
 * mistyped the address. When the scope is 'ALL' (or absent) we still
 * auto-tag from the address so cross-city admins keep working as before.
 *
 * @param {string} adminBaseValue - raw value from req.query.base / req.body.base
 * @param {object} addr - record or plain object with city / district
 * @returns {'PY'|'CH'}
 */
function resolveBaseForSave(adminBaseValue, addr = {}) {
  const adminScope = normalizeBase(adminBaseValue);
  if (adminScope === 'CH' || adminScope === 'PY') return adminScope;
  return resolveBaseFromAddress(addr);
}

module.exports = {
  baseFilter,
  normalizeBase,
  resolveCreateBase,
  resolveBaseFromAddress,
  resolveBaseForSave,
  VALID_BASES,
};
