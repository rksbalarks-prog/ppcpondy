// Vision calls that turn a scanned classified page into structured ad records.
//
// The pipeline reads ONE ad box at a time. That is not a detail — it is the
// whole reason the phone numbers can be trusted. Reading a crop that holds six
// ads, the model misread or invented digits (a printed 87548 44856 came back as
// 8754000000, 8754444844 and 8754006789 on three tries). Reading the same ad on
// its own, three independent times, it returned 8754844856 every time.
//
//   triagePage(page)          does this page carry property ads at all?
//   extractAdFromBox(box)     the one ad in this crop, as fields
//   readPhoneDigits(box, n)   digits only — the reading that gets voted on
//   extractAdsFromTile(tile)  fallback for pages whose boxes cannot be found
//   extractAdsFromText(txt)   fallback for a PDF that ships a text layer
//
// Calls go through global fetch (Node 18+) rather than the openai SDK so this
// module stays independent of the assistant's provider wiring, and so timeouts
// and retries are ours to control.

const config = require('./config');

const CHAT_URL = () => `${config.openaiBaseUrl}/chat/completions`;

// Shared across the prompts so a field means the same thing everywhere.
const FIELD_SPEC = ` dealType     "rent" | "sale" | "wanted" | "unknown"
 headline     the bold heading, as printed
 phones       every phone number in the box, digits only, 10-digit Indian (strip +91 / leading 0 / spaces)
 rentAmount   monthly rent in rupees as a number ("18K"->18000, "Rent 65,000"->65000, "5 Lakhs Month"->500000), else null
 deposit      advance / deposit in rupees as a number ("Advance Rs.25,000"->25000), else null
 bedrooms     "1" / "2" / "3" ... taken from 1BHK / 2BHK / 3BHK, else null
 propertyMode "Residential" | "Commercial"
 propertyType House|Independent House|Flat|Apartment|Portion|Room|PG|Shop|Office|Commercial Space|Godown|Warehouse|Land|Plot|Building|Other
 locality     the Pondicherry / Cuddalore area, nagar or street named, else null
 address      the fuller address line if one is printed, else null
 areaSqft     built-up or plot area in sq.ft as a number, else null
 floorNo      "Ground" / "1" / "2" / "3" ..., else null
 features     short array of extras actually printed (car parking, lift, furnished, A/C, attached bathroom, ...)
 language     "en" | "ta" | "mixed"
 rawText      the complete ad text as printed, Tamil kept in Tamil, collapsed to one line`;

// The Tamil words for rent and sale are the single most valuable thing to get
// right, and a model that is not paying attention conflates them.
const DEAL_WORDS = `Tamil vocabulary that decides dealType — this is the most important field:
  வாடகைக்கு / வாடகை / RENT / FOR RENT / LEASE / TO LET   -> "rent"
  விற்பனைக்கு / விற்பனை / FOR SALE / SALE                 -> "sale"
  தேவை / WANTED / REQUIRED (someone looking for a place)  -> "wanted"
"மனை விற்பனைக்கு" (plot for sale) is SALE, never rent. "வீடு வாடகைக்கு" (house for rent) is RENT.`;

// Kept deliberately tight: this prompt is sent once per ad box, so every line
// of it is paid for ~60 times a page and counts against the account's
// tokens-per-minute ceiling.
const BOX_SYSTEM = `Read ONE classified ad box cut from a scanned page of the Adexpress
Pondicherry / Cuddalore weekly (English and/or Tamil).

${DEAL_WORDS}

Not a property ad (job, matrimony, vehicle, tuition, service, display advert, picture)?
Return {"ad":null}.

Otherwise return {"ad":{...}} with:
${FIELD_SPEC}

Transcribe phone digits EXACTLY as printed. Never guess, never complete a cut-off number; if a
digit is unreadable leave that number out of "phones".`;

const DIGITS_SYSTEM = `You are a careful OCR engine reading one small ad box cut out of a scanned
Indian newspaper classified page. Your ONLY job is to transcribe the telephone numbers printed in it.

Rules:
- Copy the digits EXACTLY as printed. Never guess, never complete, never "fix" a number.
- Indian mobile numbers are 10 digits and are usually printed in groups (98765 43210).
- A landline may be printed with an STD code (0413-2337927). Transcribe it as printed.
- If ANY digit of a number is blurred, cut off or ambiguous, set readable=false for that number.
- Do not output a number that is not physically printed in this image.

Respond with JSON:
{"numbers":[{"digits":"9876543210","printedAs":"98765 43210","readable":true}]}`;

const TILE_SYSTEM = `You are an OCR + data-extraction engine for scanned classified-ad pages of the
"Adexpress" Pondicherry / Cuddalore weekly newspaper. The crop you receive is part of a page packed
with small bordered ad boxes printed in English, Tamil, or both. A crop typically holds 4-15 boxes.

Work systematically: scan the crop column by column, top to bottom, and return EVERY property /
real-estate box you can see, including tiny Tamil-only ones and boxes only partly visible at the
edges. Do not stop early. Skip employment, matrimony, vehicle, tuition, service and pure
branding/display ads.

${DEAL_WORDS}

For each ad box return:
${FIELD_SPEC}
 confidence   0-1 — how sure you are that the phone digits are read correctly

Respond with JSON: {"ads":[ ... ]}. Return an empty list only if the crop truly has no property ads.
Never invent a phone number: if digits are unreadable, leave that number out and lower confidence.`;

const TRIAGE_SYSTEM = `You are looking at one full page of the Adexpress Pondicherry / Cuddalore
classified weekly. Decide whether the page carries property / real-estate classified ad boxes
(house, flat, plot, shop, commercial space — to rent or for sale, in English or Tamil). Section
headers run across the top of each page (REAL ESTATE / மனை விற்பனைக்கு, RENTAL / வாடகை, BUSINESS,
EMPLOYMENT / வேலைவாய்ப்பு).

Respond with JSON:
{"hasProperty":true|false,"hasRent":true|false,"sections":["..."],"approxAdBoxes":number}`;

const TEXT_SYSTEM = `${TILE_SYSTEM}

You are being given the text layer of the page instead of an image. Column order may be jumbled;
group the lines back into individual ad boxes as best you can.`;

function assertConfigured() {
  if (!config.openaiApiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set — the Adexpress importer needs it to read scanned pages.'
    );
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── tokens-per-minute budget ───────────────────────────────────────────────
// Reading one ad at a time means many small calls, and an OpenAI account has a
// hard tokens-per-minute ceiling (30,000 on the tier this runs against). Going
// over it fails calls, which silently costs ads — half a page went missing
// before this existed. So each call reserves its estimated tokens from a
// rolling one-minute window and waits its turn if the window is full.
const spend = []; // { at, tokens }

function windowUsed(now) {
  while (spend.length && now - spend[0].at > 60000) spend.shift();
  return spend.reduce((sum, s) => sum + s.tokens, 0);
}

async function reserve(estimate) {
  for (;;) {
    const now = Date.now();
    const used = windowUsed(now);
    if (used + estimate <= config.tokensPerMinute || !spend.length) {
      const entry = { at: now, tokens: estimate };
      spend.push(entry);
      return entry;
    }
    // Wait for the oldest spend to fall out of the window.
    await sleep(Math.max(250, 60000 - (now - spend[0].at) + 100));
  }
}

/** "Please try again in 428ms" / "in 1.772s" -> milliseconds */
function retryAfterMs(body, headers) {
  const header = headers && headers.get && headers.get('retry-after');
  if (header && Number.isFinite(Number(header))) return Number(header) * 1000;
  const m = /try again in ([\d.]+)(ms|s)/i.exec(body || '');
  if (!m) return 0;
  return m[2].toLowerCase() === 'ms' ? Number(m[1]) : Number(m[1]) * 1000;
}

/**
 * One chat-completions call with a JSON response, timeout, a tokens-per-minute
 * reservation, and retry/backoff on the transient failures (429 / 5xx / network).
 */
async function callModel(messages, { label = 'vision', estimate = 1500 } = {}) {
  assertConfigured();
  let lastErr;

  for (let attempt = 0; attempt <= config.visionRetries; attempt++) {
    const budget = await reserve(estimate);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), config.visionTimeoutMs);
    try {
      const res = await fetch(CHAT_URL(), {
        method: 'POST',
        signal: ac.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: config.visionModel,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const retriable = res.status === 429 || res.status >= 500;
        const err = new Error(`${label}: OpenAI ${res.status} ${body.slice(0, 200)}`);
        if (!retriable) throw err;
        lastErr = err;
        if (res.status === 429) {
          // The limiter under-estimated. Charge the window for the whole
          // request so the next one waits, and honour the server's own hint.
          budget.tokens = Math.max(budget.tokens, estimate * 2);
          await sleep(Math.max(retryAfterMs(body, res.headers) + 250, 1000));
          continue;
        }
      } else {
        const json = await res.json();
        // Replace the estimate with what the call actually cost, so the window
        // reflects reality rather than a guess.
        if (json?.usage?.total_tokens) budget.tokens = json.usage.total_tokens;
        const content = json?.choices?.[0]?.message?.content || '{}';
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = {};
        }
        return { parsed, usage: json?.usage || {} };
      }
    } catch (err) {
      lastErr = err;
      if (/OpenAI 4(?!29)/.test(err.message)) throw err;
    } finally {
      clearTimeout(timer);
    }

    if (attempt < config.visionRetries) await sleep(1200 * (attempt + 1));
  }

  throw lastErr || new Error(`${label}: OpenAI call failed`);
}

const dataUri = (buf) => `data:image/jpeg;base64,${buf.toString('base64')}`;

const imageMessage = (jpegBuffer, text) => ({
  role: 'user',
  content: [
    { type: 'text', text },
    { type: 'image_url', image_url: { url: dataUri(jpegBuffer), detail: 'high' } },
  ],
});

/** Does this page carry property ads at all? */
async function triagePage(pageJpeg) {
  const { parsed, usage } = await callModel(
    [
      { role: 'system', content: TRIAGE_SYSTEM },
      imageMessage(pageJpeg, 'Classify this page. Reply as JSON.'),
    ],
    { label: 'triage', estimate: 1400 }
  );

  return {
    hasProperty: !!parsed.hasProperty,
    hasRent: !!parsed.hasRent,
    sections: Array.isArray(parsed.sections) ? parsed.sections.slice(0, 12) : [],
    approxAdBoxes: Number(parsed.approxAdBoxes) || 0,
    usage,
  };
}

/** The single ad in one detected box, or null if the box is not a property ad. */
async function extractAdFromBox(boxJpeg) {
  const { parsed, usage } = await callModel(
    [
      { role: 'system', content: BOX_SYSTEM },
      imageMessage(boxJpeg, 'One ad box follows. Return it as JSON, or {"ad":null}.'),
    ],
    { label: 'extract-box', estimate: 1100 }
  );

  return { ad: parsed && typeof parsed.ad === 'object' ? parsed.ad : null, usage };
}

// The independent reads are nudged apart so they are not literally the same
// computation repeated; identical prompts at temperature 0 repeat their own
// mistakes, which would make agreement meaningless.
const DIGIT_NUDGES = [
  'Transcribe every telephone number printed in this ad box.',
  'Transcribe every telephone number printed in this ad box. Read the box from the bottom upwards.',
  'Transcribe every telephone number printed in this ad box, one digit at a time, left to right.',
];

/**
 * One digits-only reading of a box.
 * @param {Buffer} boxJpeg
 * @param {number} pass index into DIGIT_NUDGES
 */
async function readPhoneDigits(boxJpeg, pass = 0) {
  const { parsed, usage } = await callModel(
    [
      { role: 'system', content: DIGITS_SYSTEM },
      imageMessage(boxJpeg, DIGIT_NUDGES[pass % DIGIT_NUDGES.length]),
    ],
    { label: `digits-${pass}`, estimate: 800 }
  );

  const numbers = Array.isArray(parsed.numbers) ? parsed.numbers : [];
  return {
    numbers: numbers.map((n) => ({
      digits: String(n?.digits || '').replace(/\D/g, ''),
      printedAs: String(n?.printedAs || '').slice(0, 40),
      readable: n?.readable !== false,
    })),
    usage,
  };
}

/** Fallback: every property ad box visible in one page crop. */
async function extractAdsFromTile(tileJpeg) {
  const { parsed, usage } = await callModel(
    [
      { role: 'system', content: TILE_SYSTEM },
      imageMessage(tileJpeg, 'Page crop follows. Extract every property ad box as JSON.'),
    ],
    { label: 'extract-tile', estimate: 2600 }
  );

  return { ads: Array.isArray(parsed.ads) ? parsed.ads : [], usage };
}

/** Fallback: an issue whose PDF carries a real text layer. */
async function extractAdsFromText(text) {
  const { parsed, usage } = await callModel(
    [
      { role: 'system', content: TEXT_SYSTEM },
      { role: 'user', content: `Page text follows.\n\n${String(text).slice(0, 60000)}` },
    ],
    { label: 'extract-text', estimate: 20000 }
  );

  return { ads: Array.isArray(parsed.ads) ? parsed.ads : [], usage };
}

module.exports = {
  triagePage,
  extractAdFromBox,
  readPhoneDigits,
  extractAdsFromTile,
  extractAdsFromText,
  DIGIT_NUDGES,
};
