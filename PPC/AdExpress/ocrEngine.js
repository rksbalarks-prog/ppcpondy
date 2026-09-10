// Local OCR engine: Tesseract workers plus the pixel work that feeds them.
//
// This replaces the paid vision calls for reading a scanned ad box. Everything
// here runs on the box's own CPU — no API key, no tokens, no per-minute ceiling.
//
// Two things earn their place:
//
//   1. WORKER REUSE. Spinning up a Tesseract worker costs about a second and
//      loading the Tamil traineddata costs more, so workers are created once,
//      per profile, and reused for the whole issue. A page of 66 boxes would
//      otherwise spend a minute doing nothing but starting workers.
//
//   2. PREPROCESSING VARIANTS. The pipeline's safety rule is that independent
//      readings must agree before a phone number can be published. With a model
//      the readings were made independent by nudging the prompt; an OCR engine
//      ignores prompts, so independence has to come from the pixels instead.
//      Each digit profile scales and thresholds the crop differently, so the
//      three passes really are different computations and agreement between
//      them means something.
//
// Pure JS throughout (jpeg-js only) — deliberately no sharp and no canvas, for
// the same reason the rest of this folder avoids them.

const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const config = require('./config');

let Tesseract = null;
function tesseract() {
  if (!Tesseract) {
    try {
      // eslint-disable-next-line global-require
      Tesseract = require('tesseract.js');
    } catch (err) {
      throw new Error(
        'tesseract.js is not installed — the local Adexpress reader needs it. ' +
        'Run: npm install tesseract.js   (and make sure it is listed in package.json ' +
        'before any other npm install runs on the server, or it will be pruned).'
      );
    }
  }
  return Tesseract;
}

// ── profiles ───────────────────────────────────────────────────────────────
// A profile is a language set plus the pixel treatment its worker expects.
// `scale` and `threshold` are applied here; `params` go to Tesseract.
const PROFILES = {
  // Full ad text, both scripts. Tamil is what decides rent vs sale on roughly a
  // fifth of the boxes, so it is not optional.
  text: {
    langs: ['tam', 'eng'],
    scale: 2,
    threshold: 0,          // leave greys alone; Tesseract's own binarisation is
                           // better than a hard cut for mixed-script body text
    params: { tessedit_pageseg_mode: '6' },
  },

  // A second, independent look at the ad text. Used only to confirm a rent
  // figure — see ocr.extractAdFromBox. Different scale and a hard threshold so
  // it is genuinely a different computation, not the same one repeated.
  text2: {
    langs: ['tam', 'eng'],
    scale: 3,
    threshold: 145,
    params: { tessedit_pageseg_mode: '6' },
  },

  // Three digit readings that differ in the pixels they are given.
  digits0: {
    langs: ['eng'],
    scale: 1,
    threshold: 0,
    params: { tessedit_char_whitelist: '0123456789 /,-', tessedit_pageseg_mode: '6' },
  },
  digits1: {
    langs: ['eng'],
    scale: 2,
    threshold: 150,
    params: { tessedit_char_whitelist: '0123456789 /,-', tessedit_pageseg_mode: '6' },
  },
  digits2: {
    langs: ['eng'],
    scale: 3,
    threshold: 120,
    params: { tessedit_char_whitelist: '0123456789 /,-', tessedit_pageseg_mode: '11' },
  },
};

const DIGIT_PROFILES = ['digits0', 'digits1', 'digits2'];

// ── pixels ─────────────────────────────────────────────────────────────────

/**
 * Scale a JPEG up and optionally threshold it to pure black and white.
 * Nearest-neighbour is deliberate: the printed glyphs are already hard-edged,
 * and interpolating them just blurs the thin strokes that tell 3 from 8.
 *
 * @param {Buffer} jpegBuffer
 * @param {number} scale      integer factor, 1 leaves the image alone
 * @param {number} threshold  0 = keep greyscale, else the cut point (0-255)
 * @returns {Buffer} JPEG
 */
function preprocess(jpegBuffer, scale = 1, threshold = 0) {
  if (scale === 1 && !threshold) return jpegBuffer;

  const src = jpeg.decode(jpegBuffer, { useTArray: true });
  const W = src.width;
  const H = src.height;
  const w = W * scale;
  const h = H * scale;
  const out = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    const sy = (y / scale) | 0;
    for (let x = 0; x < w; x++) {
      const sx = (x / scale) | 0;
      const s = (sy * W + sx) * 4;
      const d = (y * w + x) * 4;

      const lum =
        (src.data[s] * 299 + src.data[s + 1] * 587 + src.data[s + 2] * 114) / 1000;
      const v = threshold ? (lum < threshold ? 0 : 255) : lum;

      out[d] = out[d + 1] = out[d + 2] = v;
      out[d + 3] = 255;
    }
  }

  return trimJpeg(jpeg.encode({ data: out, width: w, height: h }, 92).data);
}

/**
 * jpeg-js can leave a stray byte after the end-of-image marker, which makes
 * libjpeg inside Tesseract print "Corrupt JPEG data: 1 extraneous bytes before
 * marker 0xd9" for every image it is given. The image itself is fine; cutting
 * the buffer at EOI just keeps the server log readable.
 */
function trimJpeg(buf) {
  for (let i = buf.length - 2; i >= 2; i--) {
    if (buf[i] === 0xff && buf[i + 1] === 0xd9) {
      return i + 2 === buf.length ? buf : buf.subarray(0, i + 2);
    }
  }
  return buf;
}

// ── workers ────────────────────────────────────────────────────────────────

const pools = new Map(); // profile name -> { workers: [], next: 0 }

function cacheDir() {
  // Keep the traineddata beside the issue PDFs so it survives a deploy and can
  // be pre-seeded on a server with no outbound access to the CDN.
  return path.join(config.storageDir, 'tessdata');
}

async function buildWorker(name) {
  const spec = PROFILES[name];
  const { createWorker } = tesseract();

  // Tesseract will not create the cache directory itself: given a path that
  // does not exist it silently falls back to the process's cwd and drops
  // eng.traineddata / tam.traineddata there instead. That still works, but it
  // litters the backend root and makes the cache impossible to pre-seed.
  const dir = cacheDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* fall back to Tesseract's own default rather than failing the read */
  }

  const worker = await createWorker(spec.langs, 1, {
    cachePath: dir,
    logger: () => {},
    errorHandler: () => {},
  });

  // Tesseract writes "Estimating resolution as NNN" and similar to stderr for
  // every single image. At ~66 boxes a page x 4 passes that is thousands of
  // lines per issue in the pm2 log, so send its diagnostics to nowhere.
  await worker.setParameters({ debug_file: '/dev/null', ...(spec.params || {}) });
  return worker;
}

async function poolFor(name) {
  if (!PROFILES[name]) throw new Error(`unknown OCR profile: ${name}`);

  let pool = pools.get(name);
  if (!pool) {
    pool = { workers: [], next: 0 };
    pools.set(name, pool);
  }

  const want = Math.max(1, config.ocr.workers);
  while (pool.workers.length < want) {
    // Sequentially: two workers loading the same traineddata at once race on
    // the cache file.
    // eslint-disable-next-line no-await-in-loop
    pool.workers.push(await buildWorker(name));
  }
  return pool;
}

/**
 * Run one OCR pass.
 * @param {Buffer} jpegBuffer
 * @param {string} profile  key of PROFILES
 * @returns {Promise<{text:string, confidence:number}>}
 */
async function recognize(jpegBuffer, profile = 'text') {
  const spec = PROFILES[profile];
  const pool = await poolFor(profile);

  // Round-robin: tesseract.js queues jobs per worker, so several workers is the
  // only way to actually read two boxes at once.
  const worker = pool.workers[pool.next % pool.workers.length];
  pool.next += 1;

  // trimJpeg on the way in, not only on what we encode: the saved crops come
  // from crops.js (jpeg-js too) and carry the same stray trailing byte.
  const image = trimJpeg(preprocess(jpegBuffer, spec.scale, spec.threshold));
  const { data } = await worker.recognize(image);

  // Word-level confidence matters more than the page mean. On a digit-whitelisted
  // pass most of the box is punctuation noise that Tesseract scores near zero, so
  // the mean lands around 20-40 even when the phone number itself was read
  // perfectly. Judging a number by that mean rejects correct readings.
  const words = (data.words || [])
    .map((w) => ({ text: String(w.text || ''), confidence: Number(w.confidence) || 0 }))
    .filter((w) => w.text.trim());

  return {
    text: String(data.text || '').trim(),
    confidence: Number(data.confidence) || 0,
    words,
  };
}

/**
 * Mean confidence of the words that actually carry digits — the only part of a
 * digits pass whose score means anything.
 * @returns {number} 0-100, or -1 when the pass produced no digit words
 */
function digitConfidence(words) {
  const digitWords = (words || []).filter((w) => /\d{4,}/.test(w.text));
  if (!digitWords.length) return -1;
  const sum = digitWords.reduce((a, w) => a + w.confidence, 0);
  return sum / digitWords.length;
}

/** Release every worker. Called when an issue finishes. */
async function shutdown() {
  const all = [...pools.values()].flatMap((p) => p.workers);
  pools.clear();
  await Promise.all(all.map((w) => w.terminate().catch(() => {})));
}

module.exports = {
  recognize, preprocess, shutdown, digitConfidence, DIGIT_PROFILES, PROFILES,
};
