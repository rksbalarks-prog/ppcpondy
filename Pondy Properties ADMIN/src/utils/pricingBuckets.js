// Shared price-bucket definitions used by PricingInfo (overview cards) and
// PricingInfoDetail (bucket detail page). Keep the two in sync by importing
// from here only — never redefine the buckets inline.
//
// Each property falls into exactly one bucket: min < price <= max.
// The first lakh bucket is inclusive of 0 (covers anything ≤ 10 L).
// The last crore bucket is open-ended (max = Infinity) so anything above
// 10 Cr is folded into the "8 Cr & above" bucket and totals always match
// the Approved Property page.

export const LAKH = 100000;       // 1 Lakh   = 1,00,000
export const CRORE = 10000000;    // 1 Crore  = 1,00,00,000

export const LAKH_BUCKETS = [
  { key: "10L", label: "≤ 10 Lacs",    short: "10 L",  min: 0,         max: 10 * LAKH },
  { key: "25L", label: "10 - 25 Lacs", short: "25 L",  min: 10 * LAKH, max: 25 * LAKH },
  { key: "50L", label: "25 - 50 Lacs", short: "50 L",  min: 25 * LAKH, max: 50 * LAKH },
  { key: "75L", label: "50 - 75 Lacs", short: "75 L",  min: 50 * LAKH, max: 75 * LAKH },
  { key: "90L", label: "75 - 90 Lacs", short: "90 L",  min: 75 * LAKH, max: 90 * LAKH },
];

export const CRORE_BUCKETS = [
  { key: "1Cr",  label: "90 L - 1 Cr", short: "1 Cr",  min: 90 * LAKH, max: 1 * CRORE  },
  { key: "3Cr",  label: "1 - 3 Cr",    short: "3 Cr",  min: 1 * CRORE, max: 3 * CRORE  },
  { key: "5Cr",  label: "3 - 5 Cr",    short: "5 Cr",  min: 3 * CRORE, max: 5 * CRORE  },
  { key: "8Cr",  label: "5 - 8 Cr",    short: "8 Cr",  min: 5 * CRORE, max: 8 * CRORE  },
  { key: "10Cr", label: "8 Cr & above", short: "10 Cr+", min: 8 * CRORE, max: Infinity },
];

// Returns true when the given price falls in the bucket.
// LAKH_BUCKETS[0] is inclusive of zero; everything else is (min, max].
// The last crore bucket has max = Infinity, so it also catches prices > 10 Cr.
export const priceMatchesBucket = (price, bucket) => {
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) return false;
  if (bucket === LAKH_BUCKETS[0]) return n <= bucket.max;
  return n > bucket.min && n <= bucket.max;
};

// Look up a bucket (and its display accent) by the slug used in the URL.
export const findBucketByKey = (key) => {
  const lakh = LAKH_BUCKETS.find((b) => b.key === key);
  if (lakh) return { bucket: lakh, accent: "#16a34a" };
  const crore = CRORE_BUCKETS.find((b) => b.key === key);
  if (crore) return { bucket: crore, accent: "#7c3aed" };
  return null;
};
