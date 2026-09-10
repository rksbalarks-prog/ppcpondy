// The local reader. Same five functions as vision.js, same return shapes, so
// processor.js can use either one without knowing which it has.
//
// What changes against vision.js:
//   - no API key, no tokens, no tokens-per-minute ceiling, no 429s
//   - a page of 66 boxes reads in about half a minute instead of three minutes
//   - the three independent phone readings come from three different pixel
//     treatments of the crop rather than three different prompts
//
// What deliberately does NOT change:
//   - a phone number is published only when every reading agrees (resolvePhones
//     in normalize.js decides that, exactly as before)
//   - a box that cannot be classified comes back with dealType 'unknown', which
//     normalizeAd turns into an issue so a person sees it
//   - the reviewer still confirms against the saved crop image
//
// `usage` is reported as zeros so the job counters, the admin screen and the
// run history keep working unchanged — they simply now record that an issue
// cost nothing to read.

const config = require('./config');
const engine = require('./ocrEngine');
const { extractFields, detectPhones, detectMoney } = require('./fields');

const NO_USAGE = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

// Kept so the interface matches vision.js exactly. The pass index selects a
// pixel treatment (see ocrEngine.DIGIT_PROFILES); these strings are only ever
// used for logging now.
const DIGIT_NUDGES = [
  'Local OCR, crop as printed.',
  'Local OCR, 2x upscale with a hard threshold.',
  'Local OCR, 3x upscale, sparse-text segmentation.',
];

/**
 * Does this page carry property ads at all?
 *
 * The model was asked to look at the page; here we read it and count the words
 * that only appear on the property pages. Cheap, and it only has to be roughly
 * right — a page wrongly kept just means its boxes are read and discarded.
 */
async function triagePage(pageJpeg) {
  const { text } = await engine.recognize(pageJpeg, 'text');
  const flat = text.replace(/\s+/g, ' ');

  const rentHits = (flat.match(/\bFOR\s+RENT\b|\bTO\s+LET\b|வாடகை/gi) || []).length;
  const saleHits = (flat.match(/\bFOR\s+SALE\b|விற்பனை|மனை/gi) || []).length;
  const propertyWords =
    (flat.match(/\bBHK\b|\bPLOT\b|\bHOUSE\b|\bFLAT\b|\bSQ\.?\s*FT\b|வீடு|மனை/gi) || []).length;

  const sections = [];
  if (/REAL\s*ESTATE/i.test(flat)) sections.push('REAL ESTATE');
  if (/RENTAL|வாடகை/i.test(flat)) sections.push('RENTAL');
  if (/EMPLOYMENT|வேலை/i.test(flat)) sections.push('EMPLOYMENT');
  if (/MATRIMON|திருமண/i.test(flat)) sections.push('MATRIMONY');

  return {
    hasProperty: propertyWords >= 4 || rentHits + saleHits >= 3,
    // Named `hasRent` because that is the field processor.js and the issue
    // records already carry, but it means "carries the kind of ad THIS app
    // publishes" — sale boxes here, rentals in the Rent Pondy copy. Keeping the
    // rental meaning would let a page of nothing but sale ads look empty.
    hasRent: (config.deal === 'rent' ? rentHits : saleHits) >= 1,
    sections: sections.slice(0, 12),
    // A rough count is all the caller wants; ad boxes carry a phone each.
    approxAdBoxes: detectPhones(flat).length,
    usage: { ...NO_USAGE },
  };
}

/**
 * The single ad in one detected box, or null if the box is not a property ad.
 *
 * The money figure gets the same treatment as the phone digits, for the same
 * reason. It is read once here, and if a number came out it is confirmed
 * against a second, independently preprocessed reading. A single OCR slip
 * otherwise reaches a live listing: on the rental side a printed "Rent:
 * Rs.9,000" was read as 159000 and published at that price. A sale price is
 * worth more still — it is what buyers sort and filter by, and a misread digit
 * moves it by a factor of ten. When the two readings disagree the figure is
 * dropped to null, which the app renders as "Call Owner" — wrong-but-silent is
 * much worse than absent.
 *
 * Both readings are interpreted for the ad's own deal type, so a sale box is
 * confirmed against detectPrice and a rental one against detectRent.
 */
async function extractAdFromBox(boxJpeg) {
  const { text } = await engine.recognize(boxJpeg, 'text');
  const ad = extractFields(text);

  if (ad && ad.rentAmount != null) {
    const second = await engine.recognize(boxJpeg, 'text2');
    if (detectMoney(second.text, ad.dealType) !== ad.rentAmount) {
      ad.rentAmount = null;
      ad.priceUnconfirmed = true;  // kept on the staged ad for the reviewer
    }
  }

  return { ad, usage: { ...NO_USAGE } };
}

/**
 * One digits-only reading of a box.
 *
 * Independence matters here: agreement between the passes is what allows an ad
 * to be published without a person confirming it, so the passes must not be the
 * same computation run three times. Each one gets the crop at a different scale
 * and threshold (ocrEngine.PROFILES), which is the OCR equivalent of the prompt
 * nudges the model version used.
 *
 * @param {Buffer} boxJpeg
 * @param {number} pass index into DIGIT_PROFILES
 */
async function readPhoneDigits(boxJpeg, pass = 0) {
  const profile = engine.DIGIT_PROFILES[pass % engine.DIGIT_PROFILES.length];
  const { text, words } = await engine.recognize(boxJpeg, profile);

  const digits = detectPhones(text);

  // Score the number, not the page. A digits-only pass throws away most of the
  // box, so its mean confidence sits around 20-40 even when the phone number is
  // read perfectly — gating on that marks correct readings unreadable and
  // resolvePhones then refuses a number all three passes agreed on.
  const conf = engine.digitConfidence(words);
  const readable = conf < 0 ? true : conf >= config.ocr.minConfidence;

  return {
    numbers: digits.map((d) => ({
      digits: d,
      printedAs: `${d.slice(0, 5)} ${d.slice(5)}`,
      readable,
    })),
    usage: { ...NO_USAGE },
  };
}

/**
 * Fallback for a page whose boxes could not be found: read a whole tile and
 * split it into ads.
 *
 * Nothing from this path is ever treated as a confirmed number (processor.js
 * passes no verification for tiles), so splitting on the phone numbers is good
 * enough — every one of these lands in the review queue regardless.
 */
async function extractAdsFromTile(tileJpeg) {
  const { text } = await engine.recognize(tileJpeg, 'text');
  return { ads: splitIntoAds(text), usage: { ...NO_USAGE } };
}

/** Fallback: an issue whose PDF carries a real text layer. */
async function extractAdsFromText(text) {
  return { ads: splitIntoAds(String(text || '').slice(0, 60000)), usage: { ...NO_USAGE } };
}

/**
 * Cut a multi-ad block into individual ads. Each classified ad ends with its
 * phone number, so a line carrying one closes the ad it belongs to.
 */
function splitIntoAds(text) {
  const lines = String(text || '').split('\n');
  const ads = [];
  let buffer = [];

  for (const line of lines) {
    buffer.push(line);
    if (detectPhones(line).length) {
      const ad = extractFields(buffer.join('\n'));
      if (ad) ads.push(ad);
      buffer = [];
    }
  }

  // Whatever is left over may still be an ad whose number did not read.
  if (buffer.join('').trim().length > 20) {
    const ad = extractFields(buffer.join('\n'));
    if (ad) ads.push(ad);
  }

  return ads;
}

module.exports = {
  triagePage,
  extractAdFromBox,
  readPhoneDigits,
  extractAdsFromTile,
  extractAdsFromText,
  shutdown: engine.shutdown,
  DIGIT_NUDGES,
};
