// Mirrors admin's price-bucket definitions (Pondy Properties ADMIN/src/utils/pricingBuckets.js)
// so the user-side marquee shows the same counts the admin Pricing Info page renders.
// Each approved property falls into exactly one bucket: min < price <= max.
// The first lakh bucket is inclusive of 0 (covers anything ≤ 10 L).
// Anything above the 10 Cr ceiling lives in the dedicated `aboveTen` bucket.

export const LAKH = 100000;       // 1 Lakh  = 1,00,000
export const CRORE = 10000000;    // 1 Crore = 1,00,00,000

export const LAKH_BUCKETS = [
  { key: "10L", label: "Below 10 Lakhs",     short: "10 L", min: 0,         max: 10 * LAKH },
  { key: "25L", label: "10 Lakhs - 25 Lakhs", short: "25 L", min: 10 * LAKH, max: 25 * LAKH },
  { key: "50L", label: "25 Lakhs - 50 Lakhs", short: "50 L", min: 25 * LAKH, max: 50 * LAKH },
  { key: "75L", label: "50 Lakhs - 75 Lakhs", short: "75 L", min: 50 * LAKH, max: 75 * LAKH },
  { key: "90L", label: "75 Lakhs - 90 Lakhs", short: "90 L", min: 75 * LAKH, max: 90 * LAKH },
];

export const CRORE_BUCKETS = [
  { key: "1Cr",  label: "90 Lakhs - 1 Crore",  short: "1 Cr",  min: 90 * LAKH, max: 1 * CRORE  },
  { key: "3Cr",  label: "1 Crore - 3 Crores",  short: "3 Cr",  min: 1 * CRORE, max: 3 * CRORE  },
  { key: "5Cr",  label: "3 Crores - 5 Crores", short: "5 Cr",  min: 3 * CRORE, max: 5 * CRORE  },
  { key: "8Cr",  label: "5 Crores - 8 Crores", short: "8 Cr",  min: 5 * CRORE, max: 8 * CRORE  },
  { key: "10Cr", label: "8 Crores - 10 Crores", short: "10 Cr", min: 8 * CRORE, max: 10 * CRORE },
];

// Pseudo-bucket — has no max, used only when price > 10 Cr.
export const ABOVE_TEN_BUCKET = {
  key: "above-10Cr",
  label: "Above 10 Crores",
  short: "10 Cr+",
  min: 10 * CRORE,
  max: Infinity,
};

// Tally an array of properties into the same buckets the admin page uses.
// Properties without a finite, non-negative numeric price are skipped — this
// matches the admin behaviour (e.g. "On Demand" listings are dropped).
export const tallyBuckets = (properties) => {
  const lakhCounts = new Array(LAKH_BUCKETS.length).fill(0);
  const croreCounts = new Array(CRORE_BUCKETS.length).fill(0);
  let aboveTen = 0;
  let total = 0;

  (properties || []).forEach((prop) => {
    const price = Number(prop?.price);
    if (!Number.isFinite(price) || price < 0) return;
    total += 1;

    const li = LAKH_BUCKETS.findIndex((b, i) =>
      i === 0 ? price <= b.max : price > b.min && price <= b.max
    );
    if (li !== -1) { lakhCounts[li] += 1; return; }

    const ci = CRORE_BUCKETS.findIndex((b) => price > b.min && price <= b.max);
    if (ci !== -1) { croreCounts[ci] += 1; return; }

    aboveTen += 1;
  });

  return { lakhCounts, croreCounts, aboveTen, total };
};
