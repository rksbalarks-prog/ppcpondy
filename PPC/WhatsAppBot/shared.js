// Shared WhatsApp number: one SmartGrowth account / one number for BOTH
// Pondicherry Matrimony (PM_Matri_Admin, PHP bot) and Pondy Properties (this bot).
//
// Who answers what:
//   1. A message this rule calls a PROPERTY message -> Pondy Properties. PM runs the
//      identical rule (components/PondyPropertyShare.php) and stays silent - no
//      network call needed, both sides decide the same way.
//   2. A message PM would only answer with its generic welcome / AI ("Hi", "ok",
//      "Lawspet") from a number Pondy Properties talked to in the last
//      ACTIVE_MINUTES -> PM asks POST /PPC/wa-bot/handoff; if we take it, PM is silent.
//   3. Everything else (matrimony buttons, relay chat, forms, Maggie) -> PM. This bot
//      never answers it, even when it is switched on.
//
// The rule is deliberately narrow: a missed property message still gets PM's
// welcome, but a matrimony member must never get a property bot. The test cases in
// shared-number-cases.json are shared with PM; run `node shared.js --test`.

const ACTIVE_MINUTES = 20;

// Exact messages (after lower-casing and turning punctuation into spaces).
const EXACT = new Set([
  'property', 'properties', 'pondy property', 'pondy properties', 'pondyproperty', 'pondyproperties',
  'buyer', 'seller', 'buy property', 'sell property', 'real estate',
]);
const BRAND = /\bpondy ?propert(y|ies)\b|\bppc ?id\b/;
const DEAL = /\b(buy|buying|sell|selling|sale|purchase|purchasing)\b/;
const ASSET = /\b(property|properties|plot|plots|land|lands|flat|flats|apartment|apartments|villa|villas|house|houses|home|site|building|shop)\b/;
const SIZE = /\b\d+(\.\d+)?\s*(bhk|sq ?ft|sqft|sq ?feet|cents?|grounds?|acres?)\b/;
const TAMIL = /(மனை|நிலம்|சொத்து|வீடு|வீட்டு).{0,30}(விற்பனை|விற்க|வாங்க)/u;

function norm(body) {
  return String(body || '').toLowerCase().replace(/[^a-z0-9஀-௿]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Is this typed message a Pondy Properties message? (identical rule in PondyPropertyShare.php) */
function isPropertyMessage(body) {
  const b = norm(body);
  if (!b) return false;
  if (EXACT.has(b)) return true;
  if (BRAND.test(b)) return true;
  if (DEAL.test(b) && ASSET.test(b)) return true;
  if (SIZE.test(b)) return true;
  if (TAMIL.test(b)) return true;
  return false;
}

module.exports = { isPropertyMessage, ACTIVE_MINUTES, norm };

if (require.main === module && process.argv.includes('--test')) {
  const cases = require('./shared-number-cases.json');
  let bad = 0;
  for (const t of cases.property) if (!isPropertyMessage(t)) { bad += 1; console.log('MISSED property:', t); }
  for (const t of cases.matrimony) if (isPropertyMessage(t)) { bad += 1; console.log('WRONGLY property:', t); }
  console.log(bad ? `${bad} case(s) failed` : `all ${cases.property.length + cases.matrimony.length} cases pass`);
  process.exit(bad ? 1 : 0);
}
