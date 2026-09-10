// Central config for the Adexpress import pipeline.
//
// Reads process.env ONCE and exposes a frozen object; nothing else in the
// module touches process.env. The pipeline is strictly additive: with
// ADEXPRESS_ENABLED=false every route short-circuits and the rest of the app is
// unaffected.
//
// Source: https://adexpressonline.in — the Adexpress Pondicherry classified
// weekly. Each issue is published as a WordPress post carrying a scanned PDF
// (10-ish A4 pages, no text layer), so extraction is OCR — by default the local
// Tesseract reader, which costs no tokens; see `reader` below.
//
// This is the Pondy Properties copy: the same pipeline as Rent Pondy's, but
// pointed at the paper's FOR SALE advertisements instead of its rentals, and
// publishing them as sale listings (ppcId / price / salesType). See README.md.

const path = require('path');

const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true');
const int = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const config = {
  enabled: bool(process.env.ADEXPRESS_ENABLED, true),

  // Which advertisements this app cares about. Pondy Properties sells, so it
  // takes the "for sale" boxes; Rent Pondy's copy of this module takes "rent".
  // Everything downstream — the cron, the screen's default filter, the counters
  // and the drawn card — follows this one value.
  deal: (process.env.ADEXPRESS_DEAL || 'sale').toLowerCase(),

  // ── Source site ──────────────────────────────────────────────────────────
  site: (process.env.ADEXPRESS_SITE || 'https://adexpressonline.in').replace(/\/+$/, ''),

  // WordPress category ids the publisher uses per edition. Discovery falls back
  // to resolving them by slug if these ever change on their side.
  categories: {
    Pondicherry: int(process.env.ADEXPRESS_CAT_PONDICHERRY, 782556320),
    Cuddalore: int(process.env.ADEXPRESS_CAT_CUDDALORE, 782556321),
  },

  // Editions this importer will actually read. Pondicherry only — Rent Pondy is
  // a Pondicherry app, and the Cuddalore edition's ads are for a market it does
  // not serve. Everything (discovery, upload, import) is refused for any other
  // edition rather than quietly accepted. Set ADEXPRESS_EDITIONS to change it.
  editions: (process.env.ADEXPRESS_EDITIONS || 'Pondicherry')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Identify ourselves honestly and stay slow. The site's robots.txt allows
  // general crawling; we only ever read issue posts that are publicly visible
  // and never try to reach content behind their subscriber paywall.
  userAgent:
    process.env.ADEXPRESS_USER_AGENT ||
    'RentPondyImporter/1.0 (+https://rentpondy.com; contact admin@rentpondy.com)',
  requestDelayMs: int(process.env.ADEXPRESS_REQUEST_DELAY_MS, 1500),
  requestTimeoutMs: int(process.env.ADEXPRESS_REQUEST_TIMEOUT_MS, 120000),

  // ── Storage ──────────────────────────────────────────────────────────────
  // Downloaded / uploaded issue PDFs. Relative to the backend's cwd, same as
  // the app's existing `uploads/` convention.
  storageDir: process.env.ADEXPRESS_STORAGE_DIR || path.join('uploads', 'adexpress'),
  keepPdf: bool(process.env.ADEXPRESS_KEEP_PDF, true),
  maxPdfBytes: int(process.env.ADEXPRESS_MAX_PDF_BYTES, 60 * 1024 * 1024),

  // ── OCR / extraction ─────────────────────────────────────────────────────
  // Which reader turns a scanned box into fields:
  //   'local'  Tesseract on this machine — no API key, no tokens (default)
  //   'openai' the original vision calls, kept as a fallback
  // Both implement the same interface; see ocr.js and vision.js. Switching is
  // the whole reason processor.js talks to `vision` through one variable.
  reader: (process.env.ADEXPRESS_READER || 'local').toLowerCase(),

  ocr: {
    // Tesseract workers held per profile. Each one costs memory and a second of
    // start-up, and pages are read one at a time, so two is plenty on the VPS.
    workers: int(process.env.ADEXPRESS_OCR_WORKERS, 2),
    // Below this the reading is treated as unreliable and cannot carry a phone
    // number to unanimity on its own.
    minConfidence: int(process.env.ADEXPRESS_OCR_MIN_CONFIDENCE, 30),
  },

  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  // Vision model used for both page triage and ad extraction. gpt-4o reads the
  // mixed English/Tamil boxes reliably at the tile sizes below.
  visionModel: process.env.ADEXPRESS_VISION_MODEL || 'gpt-4o',
  visionTimeoutMs: int(process.env.ADEXPRESS_VISION_TIMEOUT_MS, 120000),
  visionRetries: int(process.env.ADEXPRESS_VISION_RETRIES, 4),
  // Hard tokens-per-minute ceiling on the OpenAI account. Reading one ad at a
  // time means many small calls, and going over this silently loses ads, so
  // every call reserves its share of a rolling one-minute window. Raise it if
  // the account's tier goes up.
  tokensPerMinute: int(process.env.ADEXPRESS_TPM, 28000),

  // A scanned page is ~1440x2184. Cutting it into a 3x4 grid puts roughly one
  // print column x a third of the page in each crop, which is what the model
  // needs to read 8pt classified type without the API's downscaling losing it.
  tile: {
    cols: int(process.env.ADEXPRESS_TILE_COLS, 3),
    rows: int(process.env.ADEXPRESS_TILE_ROWS, 4),
    overlap: num(process.env.ADEXPRESS_TILE_OVERLAP, 0.06), // fraction, both sides
    quality: int(process.env.ADEXPRESS_TILE_QUALITY, 88),
  },

  // ── Ad-box detection ─────────────────────────────────────────────────────
  // Each ad is read on its own rather than six at a time: reading a whole crop,
  // the model misread and even invented phone digits; reading one box, three
  // independent passes agreed on the printed number every time. Boxes are found
  // from the printed rules by boxes.js — no model involved.
  useBoxes: bool(process.env.ADEXPRESS_USE_BOXES, true),
  // Below this many boxes we assume detection failed on that page and fall back
  // to reading overlapping tiles (results are then marked unverified).
  minBoxesPerPage: int(process.env.ADEXPRESS_MIN_BOXES, 6),
  maxBoxesPerPage: int(process.env.ADEXPRESS_MAX_BOXES, 120),

  // ── Phone verification ───────────────────────────────────────────────────
  // How many independent digits-only readings of an ad box must agree before a
  // number counts as read. Unanimity is required, not a majority: a majority
  // vote once produced 9994141660 for a printed 9994114660.
  phoneReads: int(process.env.ADEXPRESS_PHONE_READS, 3),
  // Which ads get that (extra) verification. Everything else stays unverified
  // and cannot be imported without a person confirming it.
  verifyDeals: (process.env.ADEXPRESS_VERIFY_DEALS || 'sale')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  // A person must confirm every number against the picture of the ad before it
  // can be imported. Turning this off lets unanimously-read numbers import on
  // their own — faster, but no longer guaranteed correct.
  requireConfirm: bool(process.env.ADEXPRESS_REQUIRE_CONFIRM, true),

  // Tiles processed in parallel. Pages are always processed one at a time so
  // peak memory stays at roughly one decoded page (~200 MB) on the VPS.
  concurrency: int(process.env.ADEXPRESS_CONCURRENCY, 2),
  maxPages: int(process.env.ADEXPRESS_MAX_PAGES, 24),
  // Skip the per-page triage call and OCR every page (costlier, highest recall).
  ocrAllPages: bool(process.env.ADEXPRESS_OCR_ALL_PAGES, false),

  // Guard rail so a runaway issue can never burn the OpenAI budget.
  maxTilesPerIssue: int(process.env.ADEXPRESS_MAX_TILES_PER_ISSUE, 400),

  // ── Scheduled run ────────────────────────────────────────────────────────
  // Picks up the newest openly-published issue, reads it, and publishes the
  // sale ads whose independent readings agreed. See schedule.js for why a cron
  // is allowed to publish without a person confirming each number.
  cron: {
    enabled: bool(process.env.ADEXPRESS_CRON_ENABLED, true),
    // Saturday 16:30 IST. The paper is published on Saturday, so the job runs
    // once a week, after it is out — the same schedule the Rent Pondy copy runs.
    expression: process.env.ADEXPRESS_CRON || '30 16 * * 6',
    timezone: process.env.ADEXPRESS_CRON_TZ || 'Asia/Kolkata',
    // How many recent issues to list when working out which one is newest.
    lookBack: int(process.env.ADEXPRESS_CRON_LOOKBACK, 4),
    // Only ever read the NEWEST issue. If it has already been read the run does
    // nothing — it never works backwards through the archive. Without this a
    // daily cron walks into last month's papers as soon as the current one is
    // done and starts importing properties that sold weeks ago.
    latestOnly: bool(process.env.ADEXPRESS_CRON_LATEST_ONLY, true),
    // false = read and stage only, publish nothing.
    autoPublish: bool(process.env.ADEXPRESS_CRON_AUTO_IMPORT, true),
    // 'verified'  — publish numbers every reading agreed on (default)
    // 'confirmed' — publish nothing until a person has confirmed it by hand
    minPhoneStatus: (process.env.ADEXPRESS_CRON_MIN_PHONE || 'verified').toLowerCase(),
  },

  // ── Import ───────────────────────────────────────────────────────────────
  // Fill the fields a classified ad never states so a row clears the
  // completeness gate and lands in PreApproved rather than Pending. The values
  // are placeholders, not guesses — the drawn card says "Not stated" for the
  // same fields, and the full ad text goes into the description.
  forcePreApproved: bool(process.env.ADEXPRESS_FORCE_PREAPPROVED, true),
  publishDefaults: {
    postedBy: process.env.ADEXPRESS_POSTED_BY || 'Owner',
    salesType: process.env.ADEXPRESS_SALES_TYPE || 'Direct',
    areaUnit: process.env.ADEXPRESS_AREA_UNIT || 'Sq.ft',
    brand: process.env.ADEXPRESS_CARD_BRAND || 'Pondy Properties',
  },

  // ── Straight through to Approved ─────────────────────────────────────────
  // After importing, raise a follow-up and a bill for each new property. The
  // bill is what sets status 'active', which is what puts the listing on the
  // Approved page and in the public feed. Defaults mirror what this office
  // already does for this kind of lead, and every value below was checked
  // against its OWN 296 existing bills (30 May 2026 backup) rather than
  // carried over from the other app:
  //
  //   planName    'Free'      233 of 296 bills ("Free" 121 + "free" 112);
  //                           the rest are Silver (57) and GOLD PLUS (6).
  //                           Note 'Free' is NOT a pricingplans row — the plan
  //                           list holds only Silver / GOLD PLUS / Platinum —
  //                           but it is overwhelmingly what the bills record.
  //   paymentType 'Free'      271 of 296, and it IS a real paymenttypes row.
  //   adminOffice 'AUROBINDO' 296 of 296, the only office in use.
  //
  // followupStatus and followupType are enum members on FollowUpModel, so those
  // two are checked by the schema itself.
  autoApprove: {
    enabled: bool(process.env.ADEXPRESS_AUTO_APPROVE, true),
    followupStatus: process.env.ADEXPRESS_FOLLOWUP_STATUS || 'Not Decided',
    followupType: process.env.ADEXPRESS_FOLLOWUP_TYPE || 'Data Followup',
    // The endpoint caps remarks at 50 characters.
    remarks: (process.env.ADEXPRESS_FOLLOWUP_REMARKS || 'Adexpress import').slice(0, 50),
    billOffice: process.env.ADEXPRESS_BILL_OFFICE || 'AUROBINDO',
    billPlan: process.env.ADEXPRESS_BILL_PLAN || 'Free',
    billPaymentType: process.env.ADEXPRESS_BILL_PAYMENT_TYPE || 'Free',
    billAmount: int(process.env.ADEXPRESS_BILL_AMOUNT, 0),
    billValidity: int(process.env.ADEXPRESS_BILL_VALIDITY, 180),
    billNoOfAds: int(process.env.ADEXPRESS_BILL_NO_OF_ADS, 1),
  },

  // Base URL for the app's own REST surface, used when this module calls the
  // existing follow-up / bill endpoints rather than touching Mongo.
  apiBase: (
    process.env.ADEXPRESS_IMPORT_BASE ||
    `http://127.0.0.1:${process.env.PORT || 5005}/PPC`
  ).replace(/\/+$/, ''),

  // ── Locality lookup (public records) ─────────────────────────────────────
  // Only used when the local gazetteer cannot place an ad's locality. Asks
  // India Post, then OpenStreetMap, and believes neither without a 605xxx
  // Puducherry pincode. Answers are cached in Mongo forever.
  geocodeEnabled: bool(process.env.ADEXPRESS_GEOCODE, true),
  geocodeTimeoutMs: int(process.env.ADEXPRESS_GEOCODE_TIMEOUT_MS, 20000),

  // Where property photos live — the same folder the rest of the app uploads to.
  photoDir: process.env.ADEXPRESS_PHOTO_DIR || 'uploads',

  // The existing publish path staged ads are handed to. Nothing is written to
  // the live rentals collection by this module directly.
  importEndpoint:
    (process.env.ADEXPRESS_IMPORT_BASE ||
      `http://127.0.0.1:${process.env.PORT || 5005}/PPC`).replace(/\/+$/, '') +
    '/bulk-upload-properties',
  // NOTE: this app's /bulk-upload-properties reads base as "PY only when
  // explicitly PY, otherwise CH" — the opposite of Rent Pondy's — so the value
  // has to be passed deliberately.
  defaultBase: (process.env.ADEXPRESS_DEFAULT_BASE || 'PY').toUpperCase(),
};

module.exports = Object.freeze(config);
