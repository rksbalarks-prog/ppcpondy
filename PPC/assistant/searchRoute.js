// Lean, filtered, paginated, indexed property search — the "correct" search
// surface for the assistant when it runs in-process with the DB (VPS deploy).
// Additive route: does NOT touch AddModel.js. It also creates the indexes the
// property collection was missing (filter columns) so this query is not a full
// collection scan.
//
// Note: MongoDB, so no EXPLAIN / SQL_CALC_FOUND_ROWS. We use a separate lean
// countDocuments() rather than counting the full result set.

const express = require('express');
const AddModel = require('../AddModel');

const router = express.Router();

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rx = (s, anchored = false) =>
  anchored ? new RegExp('^' + escapeRegex(s) + '$', 'i') : new RegExp(escapeRegex(s), 'i');

const PROJECTION =
  'ppcId propertyType propertyMode bedrooms price area city district furnished totalArea areaUnit postedBy onDemand';

function leanCard(p) {
  return {
    ppcId: p.ppcId,
    propertyType: p.propertyType,
    propertyMode: p.propertyMode,
    bedrooms: p.bedrooms,
    price: p.onDemand ? 'On Demand' : p.price,
    area: p.area,
    city: p.city,
    furnished: p.furnished,
    totalArea: p.totalArea,
    areaUnit: p.areaUnit,
    postedBy: p.postedBy,
  };
}

router.get('/assistant/search-properties', async (req, res) => {
  try {
    const { city, area, bedrooms, propertyType, propertyMode, postedBy } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 15);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const q = { status: 'active' };
    // Live `bedrooms` values are inconsistent — mostly "3", but some rows were
    // entered as "3 BHK". Anchor on the leading digits so both forms match.
    if (bedrooms) {
      const digits = String(bedrooms).match(/\d+/);
      q.bedrooms = digits ? new RegExp(`^${digits[0]}\\b`, 'i') : String(bedrooms);
    }
    if (propertyType) q.propertyType = rx(propertyType);
    if (propertyMode) q.propertyMode = rx(propertyMode, true);
    if (postedBy) q.postedBy = rx(postedBy, true);

    if (city) {
      const c = String(city).toLowerCase();
      if (/pond|pudu|pudh/.test(c)) {
        q.$or = [{ city: /pond|pudu|pudh/i }, { area: /pond|pudu|pudh/i }];
      } else {
        q.$or = [{ city: rx(city) }, { area: rx(city) }, { district: rx(city) }];
      }
    }
    if (area) {
      const areaMatch = [{ area: rx(area) }, { city: rx(area) }];
      if (q.$or) { q.$and = [{ $or: q.$or }, { $or: areaMatch }]; delete q.$or; }
      else q.$or = areaMatch;
    }

    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      q.price = {};
      if (Number.isFinite(minPrice)) q.price.$gte = minPrice;
      if (Number.isFinite(maxPrice)) q.price.$lte = maxPrice;
    }

    const [items, count] = await Promise.all([
      AddModel.find(q).select(PROJECTION).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AddModel.countDocuments(q),
    ]);

    res.json({
      success: true,
      count,
      page,
      limit,
      showing: items.length,
      results: items.map(leanCard),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Create the indexes the search relies on. Idempotent; safe to call at startup.
async function ensureSearchIndexes() {
  const specs = [
    { status: 1, city: 1, price: 1 },
    { status: 1, area: 1 },
    { status: 1, bedrooms: 1 },
    { status: 1, propertyType: 1 },
    { ppcId: 1 },
  ];
  const created = [];
  for (const spec of specs) {
    try {
      const name = await AddModel.collection.createIndex(spec);
      created.push(name);
    } catch (e) {
      // Non-fatal: log and continue (e.g. conflicting existing index).
      console.warn('[assistant] index create skipped:', e.message);
    }
  }
  return created;
}

module.exports = router;
module.exports.ensureSearchIndexes = ensureSearchIndexes;
