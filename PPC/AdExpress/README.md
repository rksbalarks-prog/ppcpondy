# Adexpress import

Reads the **Pondicherry** edition of the *Adexpress* classified weekly and turns
its **"for sale"** boxes into reviewable leads inside the admin panel.

> This is the **Pondy Properties** copy. It is the same pipeline as Rent Pondy's,
> pointed at the other half of the paper. Differences, all of them small:
>
> | | Rent Pondy | Pondy Properties |
> | --- | --- | --- |
> | ads taken | `dealType: rent` | `dealType: sale` (`ADEXPRESS_DEAL`) |
> | listing id | `rentId` | `ppcId` |
> | money field | `rentalAmount` (+ deposit) | `price` |
> | mandatory gate | 14 fields | 7: mode, type, price, area, unit, salesType, postedBy |
> | filled defaults | rentType, availableDate, floor, bedrooms | salesType, postedBy, area |
> | `base` in bulk upload | PY unless CH | **CH unless explicitly PY** — so PY is always passed |
> | backend style | ES modules | CommonJS |
> | card money row | `Rent: …/month` | `Price: …` |

The publisher also runs a Cuddalore edition. This importer deliberately does not
read it — this app serves Pondicherry, and Cuddalore ads are leads for a market
the app does not cover. Discovery, upload and import all refuse any other edition
rather than quietly staging ads nobody wants; `ADEXPRESS_EDITIONS` is the single
switch if that ever changes.

Admin screen: **PPC Property → Adexpress Import** (`/dashboard/adexpress-import`,
permission key `Adexpress Import`).

## The phone number is the whole problem

A lead is a phone number. A wrong phone number is worse than no lead — someone
gets called who never advertised anything. Everything below is shaped by that.

What was measured on a real page, reading a crop that held six ads at a time:

| printed | model read (3 tries) |
| --- | --- |
| 87548 44856 | `8754000000`, `8754444844`, `8754006789` |
| 99941 14660 | `9994141660` (2 votes), `9994146600` (1 vote) |
| 73732 55844 | `7373255555`, `7373752525`, `7373725252` |

Two lessons. First, the model fabricates confident, plausible digits — asked for
an ad's position *and* its phone number in one call, it invented both. Second,
**majority voting is not safe**: `9994141660` won two votes out of three and was
still wrong.

Reading the *same ads one box at a time*, three independent passes returned the
printed number exactly, every time. So the pipeline reads one ad per call, votes
on unanimity only, and still refuses to publish anything until a person has
confirmed the number against a picture of the printed ad.

## How it works

```
adexpressonline.in (WordPress REST API)   or   an admin's PDF upload
      │
      ▼  issue post  →  scanned PDF (10 A4 pages, no text layer)
 pdfImages.js   lifts each page out of the PDF as its stored JPEG
      ▼
 reader.triagePage   one look per page: does it carry property ads?
      ▼  (about 40% of an issue is employment ads — those pages are skipped)
 boxes.js       finds the ad boxes from the printed rules — no model involved
      ▼
 reader.extractAdFromBox    reads ONE ad: rent/sale, price, BHK, area, phone
 reader.readPhoneDigits ×3  independent digits-only re-reads of the same box
      ▼
 normalize.resolvePhones    unanimous or nothing
      ▼
 crops.js       saves a picture of that exact ad
      ▼
 adexpress_ads  staged  →  a person confirms the number against the picture
      ▼
 locality.js / geocode.js   printed nagar + landmark → real area + pincode
      ▼
 POST /PPC/bulk-upload-properties   ← the app's own existing publish path
      ▼
 approve.js     follow-up + bill → Approved (live in the app)
```

**`reader` is one of two interchangeable modules.** `ocr.js` (default) runs
Tesseract locally: no API key, no tokens, no per-minute ceiling, and a page of
66 boxes in about half a minute. `vision.js` is the original OpenAI vision path,
kept as a fallback behind `ADEXPRESS_READER=openai`. Both export the same five
functions with the same shapes, so nothing downstream knows which is in use.

`boxes.js` is plain image processing: threshold the page, find the horizontal
and vertical rule segments, and take pairs of horizontal rules joined at both
ends by verticals. It follows each rule with a one-pixel tolerance, because scan
skew drifts a "vertical" line sideways over the height of an ad — without that
it found 22 boxes on a page, with it, 66. ~90 ms per page.

## The gate

`phoneStatus` on every staged ad:

| status | meaning | importable |
| --- | --- | --- |
| `confirmed` | a person read it off the picture and vouched for it | **yes** |
| `verified` | every independent pass agreed, digit for digit | only if `ADEXPRESS_REQUIRE_CONFIRM=false` |
| `disputed` | the passes disagreed — candidates kept, nothing accepted | no |
| `unreadable` | no number could be read from the ad | no |
| `unverified` | read once only (tile/text fallback), never double-checked | no |

`POST /adexpress/import` refuses unconfirmed ads outright rather than quietly
skipping them, and the number stored is the one the reviewer typed — not what
OCR guessed. Confirming is one click: the screen shows the ad picture, the
candidate numbers as buttons, and a "Confirm & next" button that walks the queue.

Measured on the 8 Aug 2026 Pondicherry issue, page 3: 13 rent ads found, 11
unanimous and each exactly matching the printed number, 2 flagged as disputed
rather than guessed. Zero wrong numbers presented as trustworthy.

## The weekly job

`schedule.js` arms a cron at boot (`ADEXPRESS_CRON`, default **Saturday 16:30 IST**, after the paper is out):

1. ask the site for the latest issues;
2. take THE NEWEST one and only that one — if it has already been read the run stops, rather than working backwards into an older paper (`ADEXPRESS_CRON_LATEST_ONLY`);
3. run it through the reader;
4. publish the sale ads whose independent readings all agreed, resolving each one's area + pincode on the way;
5. raise a follow-up and a bill for each, taking it PreApproved → Approved.

Step 4 is a deliberate compromise. The admin screen refuses to import a number
until a person has confirmed it against the printed ad — a cron has nobody to
ask. So it publishes only unanimous readings, and everything doubtful
(disagreements, unreadable numbers) stays in the review queue. Those rows land
in **PreApproved**, which is itself a staffed step before a listing goes live,
so a person still lays eyes on every one. `ADEXPRESS_CRON_MIN_PHONE=confirmed`
makes the cron publish nothing until someone has confirmed it by hand;
`ADEXPRESS_CRON_AUTO_IMPORT=false` makes it read and stage only.

"Run now" on the admin screen runs the same cycle on demand.

## Landing in PreApproved

`/bulk-upload-properties` sends a row to PreApproved only when every mandatory
field is present, and a classified ad routinely prints none of: posted by, sales
type, area. `publish.js` fills those so the row
clears the gate — as **placeholders, not guesses**:

| field | filled with |
| --- | --- |
| postedBy | `ADEXPRESS_POSTED_BY` (default `Owner`) |
| salesType | `ADEXPRESS_SALES_TYPE` (default `Direct`) |
| totalArea | `0`, with areaUnit `Sq.ft` |

The drawn card says "Not stated" for the same fields and the whole ad text goes
into the description, so nothing pretends to know what the paper did not print.
Set `ADEXPRESS_FORCE_PREAPPROVED=false` to let incomplete rows fall to Pending
instead, which is the more conservative choice.

## The property picture

A classified ad has no photograph, so `cardImage.js` draws one: a ruled card in
the style of the printed ad box carrying **BHK**, **Floor** and **Area** (plus
the price and locality when the ad gave them). A row the advertisement did not
print is left out rather than shown as "not stated", and with no price the money
row reads **Call Owner**. It is attached as the property's
only photo.

It is drawn, not photographed — and pointedly **not** the crop of the real
newspaper ad, because that crop shows the owner's phone number and the app
charges points to reveal a contact. The crop stays inside the review screen.

There is no font renderer in this backend (no canvas, no sharp), so the text is
stamped from a 5x7 bitmap font scaled up and encoded with jpeg-js — about 120 KB
per card, written into `uploads/` like every other property photo.

## Additive by design

Nothing existing is modified. New files, new routes under `/PPC/adexpress/*`,
three new collections (`adexpress_issues`, `adexpress_ads`,
`adexpress_localities`), one new admin screen. The only contact with the live
app is through endpoints it already has: the Import button posts rows to the
**existing** `POST /PPC/bulk-upload-properties` — the same endpoint the admin's
Excel bulk upload already uses — and, when auto-approve is switched on,
`approve.js` posts to the existing `/followup-bulk-create` and
`/create-bill-bulk`. So imported rows get their PPC-IDs, their
complete/incomplete routing and their PreApproved/Pending placement from the
same code as every other upload, and the whole batch can be reverted from the
Bulk Upload screen.

The one direct database write is `publish.js` attaching a drawn card to the rows
its own batch just created, keyed by `bulkUploadId` and checked against the
phone number first — the bulk endpoint has no photo field, and pushing a partial
payload through the big edit route risks side effects on fields it also owns.
`locality.js` additionally *reads* existing listings' `area`/`pinCode` pairs to
learn this office's own vocabulary; it never writes to them.

Changes to existing files: three `require`/mount/start lines in `server.js`, two
in `Dashboard.jsx`, three in `Sidebar.jsx`, one permission key in
`UserRolls.jsx` — six edits in all, everything else is new files.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/PPC/adexpress/status` | configured? what is running right now |
| GET | `/PPC/adexpress/stats` | counters for the header cards |
| GET | `/PPC/adexpress/issues` | staged issues (+ live job progress) |
| GET | `/PPC/adexpress/issues/:id` | one issue |
| POST | `/PPC/adexpress/discover` | list recent issues from the publisher's site |
| POST | `/PPC/adexpress/upload` | upload an issue PDF (multipart, field `pdf`) |
| POST | `/PPC/adexpress/issues/:id/process` | read an issue (202, poll for progress) |
| DELETE | `/PPC/adexpress/issues/:id` | drop a staged issue, its ads and their pictures |
| GET | `/PPC/adexpress/ads` | staged ads, filtered / paged |
| GET | `/PPC/adexpress/ads/:id/crop` | the picture of that printed ad |
| PATCH | `/PPC/adexpress/ads/:id` | correct a field, set status or note |
| POST | `/PPC/adexpress/ads/:id/confirm` | a person vouches for the number |
| POST | `/PPC/adexpress/ads/status` | shortlist / ignore many at once |
| POST | `/PPC/adexpress/import` | publish confirmed ads via the bulk-upload path |
| GET | `/PPC/adexpress/cron/status` | what the weekly job has been doing |
| POST | `/PPC/adexpress/cron/run-now` | run the weekly cycle now |
| GET | `/PPC/adexpress/export` | the filtered ads as an .xlsx |

Only one issue is read at a time process-wide: a decoded page is ~200 MB of
pixels and the VPS has no room for two.

## Environment

Everything has a working default; the only variable that must exist is the
OpenAI key, which the AI assistant already needs.

| Variable | Default | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | only needed when `ADEXPRESS_READER=openai`; shared with the assistant |
| `ADEXPRESS_READER` | `local` | `local` = Tesseract on this box (no tokens); `openai` = vision calls |
| `ADEXPRESS_OCR_WORKERS` | `2` | Tesseract workers held per profile |
| `ADEXPRESS_OCR_MIN_CONFIDENCE` | `30` | below this a digits pass cannot carry a number to unanimity |
| `ADEXPRESS_ENABLED` | `true` | `false` makes every route answer 503 |
| `ADEXPRESS_CRON_ENABLED` | `true` | arm the weekly pickup |
| `ADEXPRESS_CRON` | `30 16 * * 6` | Saturday afternoon, after the paper is out |
| `ADEXPRESS_CRON_TZ` | `Asia/Kolkata` | schedule timezone |
| `ADEXPRESS_CRON_LATEST_ONLY` | `true` | read only the newest issue; never work backwards into old papers |
| `ADEXPRESS_CRON_AUTO_IMPORT` | `true` | `false` = read and stage only |
| `ADEXPRESS_CRON_MIN_PHONE` | `verified` | `confirmed` = publish nothing unattended |
| `ADEXPRESS_FORCE_PREAPPROVED` | `true` | fill the gaps so rows reach PreApproved |
| `ADEXPRESS_POSTED_BY` / `_SALES_TYPE` / `_AREA_UNIT` | `Owner` / `Direct` / `Sq.ft` | the placeholder values |
| `ADEXPRESS_CARD_BRAND` | `Pondy Properties` | printed on the drawn card |
| `ADEXPRESS_EDITIONS` | `Pondicherry` | editions read at all; anything else is refused |
| `ADEXPRESS_VISION_MODEL` | `gpt-4o` | reads the mixed English/Tamil boxes well |
| `ADEXPRESS_REQUIRE_CONFIRM` | `true` | **the gate.** `false` lets unanimous numbers import unattended |
| `ADEXPRESS_PHONE_READS` | `3` | independent digits-only passes that must agree |
| `ADEXPRESS_DEAL` | `sale` | which side of the paper this app publishes |
| `ADEXPRESS_VERIFY_DEALS` | `sale` | which ads get those extra passes (`all` for everything) |
| `ADEXPRESS_TPM` | `28000` | account tokens-per-minute ceiling — see below |
| `ADEXPRESS_USE_BOXES` | `true` | `false` falls back to reading page crops (unverified) |
| `ADEXPRESS_MIN_BOXES` | `6` | fewer boxes than this on a page ⇒ fall back to crops |
| `ADEXPRESS_CONCURRENCY` | `2` | calls in flight within a page |
| `ADEXPRESS_OCR_ALL_PAGES` | `false` | skip triage and read every page |
| `ADEXPRESS_STORAGE_DIR` | `uploads/adexpress` | issue PDFs and ad pictures (git-ignored) |
| `ADEXPRESS_KEEP_PDF` | `true` | `false` deletes the PDF after reading |
| `ADEXPRESS_DEFAULT_BASE` | `PY` | city section imported rows land in |
| `ADEXPRESS_GEOCODE` | `true` | ask India Post / OSM for localities the gazetteer cannot place |
| `ADEXPRESS_AUTO_APPROVE` | `true` | follow up + bill each import, taking it PreApproved → Approved |
| `ADEXPRESS_BILL_PLAN` / `_PAYMENT_TYPE` / `_OFFICE` | `Free` / `Free` / `AUROBINDO` | what 233 of this office's 296 bills record — see below |
| `ADEXPRESS_FOLLOWUP_STATUS` / `_TYPE` | `Not Decided` / `Data Followup` | both are real `FollowUp` enum values |

### Straight through to Approved

`approve.js` takes an import the rest of the way — one follow-up and one bill
per property, through the same `/followup-bulk-create` and `/create-bill-bulk`
routes the admin screen's Bulk buttons post to. The bill is what flips a listing
to `active`, so this is what turns a scraped ad into something buyers can see,
and it is what the office otherwise does by hand each week.

The values were taken from **this office's own 296 bills** (30 May 2026 backup),
not carried over from the other app:

| setting | default | why |
| --- | --- | --- |
| `ADEXPRESS_BILL_PLAN` | `Free` | 233 of 296 bills (`Free` 121 + `free` 112); the rest Silver 57, GOLD PLUS 6 |
| `ADEXPRESS_BILL_PAYMENT_TYPE` | `Free` | 271 of 296, and a real `paymenttypes` row |
| `ADEXPRESS_BILL_OFFICE` | `AUROBINDO` | 296 of 296 — the only office in use |
| `ADEXPRESS_FOLLOWUP_STATUS` | `Not Decided` | a `FollowUpModel` enum member |
| `ADEXPRESS_FOLLOWUP_TYPE` | `Data Followup` | a `FollowUpModel` enum member |

One quirk worth knowing before changing them. `/create-bill-bulk` accepts **any**
non-empty `planName`, `paymentType` and `adminOffice` — it checks presence and
nothing more. The plan and payment-type lists are database rows served by
`GET /PPC/fetch`, not a fixed enum, so an invented value is written onto real
bills that reconcile against nothing. `Free` in particular is *not* a
`pricingplans` row (that list holds only Silver, GOLD PLUS and Platinum) yet it
is overwhelmingly what the bills record — so take any replacement from the
bills or the `paymenttypes` list, not from the plan list alone.

`ADEXPRESS_AUTO_APPROVE=false` stops at PreApproved for a person to bill.

## Two readers

A "reader" turns a scanned ad box into fields. There are two, they export the
same five functions with the same shapes, and `ADEXPRESS_READER` picks one:

| | `local` (default) | `openai` |
|---|---|---|
| module | `ocr.js` + `ocrEngine.js` + `fields.js` | `vision.js` |
| engine | Tesseract on this machine | gpt-4o vision |
| cost per issue | nothing | 350–500k tokens |
| time per page | ~30 s | ~3 min |
| needs a key | no | `OPENAI_API_KEY` |
| rate limited | no | 30k tokens/min |

`processor.js` picks one at require time and nothing downstream knows which it
got. Set `ADEXPRESS_READER=openai` to go back.

### How the local reader keeps the numbers honest

The safety rule does not change: **a number is published only when every
independent reading agrees**, decided by `resolvePhones` exactly as before.
What changes is where the independence comes from. The model version made the
three readings different by nudging the prompt. An OCR engine ignores prompts,
so the three passes differ in the *pixels* instead — `ocrEngine.PROFILES`
gives each one a different scale and threshold (as printed; 2× with a hard
threshold; 3× with sparse-text segmentation).

The **price** gets the same treatment for the same reason, and it matters more
on this side of the paper than rent does on the other: it is read once from the
`text` profile and confirmed against a second, independently preprocessed
`text2` reading. Disagreement drops the figure rather than publishing it.

Three things learned the hard way, easy to undo by accident:

* **Do not grab any ten digits in a row.** One character of noise read as a
  digit slides the window: a printed `70942 20892` came back as `6709422089`.
  `fields.detectPhones` anchors on the printed 5+5 grouping instead.
* **Do not gate a reading on Tesseract's mean confidence.** A digits-only pass
  throws away most of the box, so its page mean sits at 20–40 even when the
  number is read perfectly; gating on it marked correct readings unreadable and
  `resolvePhones` then refused numbers all three passes agreed on.
  `ocrEngine.digitConfidence` scores only the words containing digits.
* **Do not multiply a per-sq.ft rate by the area to get a price.** See
  `fields.detectPrice` and the Known limits below — an ad that prints only a
  rate has not stated what the property costs, and saying so is correct.

Tamil is read with the `tam` traineddata, which is what decides rent from sale
on about a fifth of the boxes — so on this app it is what keeps rental boxes out
of the sale queue, not an optional extra.

`tesseract.js` **must stay in `PPC/package.json`** (pinned to exact `5.1.1`; npm
rewrites it to `^5.1.1` on install, change it back). A package present in
`node_modules` but absent from `package.json` is pruned by the next
`npm install <anything>`, which is exactly how the Rent Pondy server lost
`sharp` and `tesseract.js` once before and returned 502 on every route.
Installing it here needs `--legacy-peer-deps` because of the `openai` peer
conflict this backend already has.

### Measured

These figures come from the **Rent Pondy** pipeline, against the 49 saved ad
crops of the 8 Aug 2026 issue — same code, same paper, same typefaces, so they
describe the reading engine this app now uses. They are **not** a measurement of
this copy: it has been verified module-by-module and on a synthetic card, but
has not yet been run against a real issue PDF. Do that once by hand before
arming the cron.

* **7/7** phone numbers exactly correct on the hand-verified sample, **7/7**
  deal types correct, **0** cases of the passes agreeing on a wrong number.
* **38/46** boxes reached `verified`; the other 8 went to the review queue,
  which is where they belong.
* **1.7 s per ad** for all four passes — 49 crops in 83 s, against roughly
  3 minutes per 66-box page for the model.
* On the one number that forced the unanimity rule in the first place, the
  printed `9994114660` that majority voting once read as `9994141660`, the
  local reader returns the printed digits.

One caveat specific to this app: the rent side of that pipeline needed a
second-pass check after **9 bad rent values went live** on the first full run.
The equivalent check is in place here from the start (`detectPrice` plus the
`text2` confirmation plus the sub-₹50,000 issue flag), but the first real issue
still deserves a look down the price column before anything is billed.

## Cost

With the default local reader: **nothing**. No API key is used, no tokens are
spent, and the `usage` counters the job and the admin screen display come back
as zeros — which is why an issue's run history can honestly show a cost of 0.
A page of 66 boxes reads in roughly half a minute, so a whole issue is a few
minutes. Reading is still a background job — start it and come back.

The first read ever performed downloads Tesseract's English and Tamil
traineddata (~15 MB) into `uploads/adexpress/tessdata` and reuses it forever.
On a server with no outbound access to the CDN, copy that folder in by hand.

### If you switch back to `ADEXPRESS_READER=openai`

Measured on the 8 Aug 2026 Pondicherry issue, one property page (66 ad boxes):
**84k tokens, about 3 minutes**. A typical issue has 4–6 property pages, so
roughly 350–500k tokens and 12–18 minutes.

The clock, not the money, is the constraint there: the OpenAI account is capped
at **30,000 tokens per minute**, so 84k tokens cannot take less than three
minutes no matter how much is run in parallel. `vision.js` keeps a rolling
one-minute budget and paces itself under `ADEXPRESS_TPM`; before that existed,
bursts blew the limit and silently lost half a page of ads.

## Known limits

* **Older Pondicherry issues are subscriber-only.** Checked 22 Aug 2026: the
  Pondicherry edition publishes its latest 2-3 issues openly and paywalls the
  rest, so auto-fetch keeps up week to week but cannot reach back through the
  archive. Nothing here tries to get around that — a paywalled issue is listed
  as "subscriber only" and the admin uploads the PDF they legitimately have.
  (The Cuddalore edition publishes its whole run openly, but this importer does
  not read it.)
* **The pipeline never claims a number is certain.** Unanimity across three
  passes is strong evidence, not proof, which is why the confirm step exists and
  is on by default. Turning `ADEXPRESS_REQUIRE_CONFIRM` off trades that
  guarantee for speed.
* Pages whose boxes cannot be found fall back to reading overlapping crops.
  Those ads get no picture and no second reading, so they are marked
  `unverified` and can only be imported after someone types the number in.
* Imported rows land in **Pending** unless the importer's defaults fill the
  mandatory fields a newspaper ad never states (sales type, posted by, area
  unit, area) — usually the right place for a lead that still needs a call.
* **`puducherryAreas.js` is not the source of truth for pincodes.** The admin
  form's area list disagrees with `locality.js` on about a dozen entries. Those
  were settled against this office's own 1,350 property rows and the live data
  sided with `locality.js` 8 times out of the 9 testable — Ariyankuppam is
  605007 not 605005, Reddiarpalayam 605010 not 605004, Saram 605013 not 605002,
  and so on. So the **form list has the errors**, and an area resolved from it
  would sort away from every listing staff entered by hand. Worth correcting in
  the form itself; this importer deliberately does not use it.
* **A price is only published when the paper actually printed a total.** Sale
  boxes quote money two ways — `Price : Rs. 45 Lakhs` (what the property costs)
  and `2400 Sq.ft, Rate Rs. 7000 per Sq.ft` (what a square foot costs) — and
  both sit right after a price word. `fields.detectPrice` rejects the per-unit
  form rather than multiplying it out, because multiplying an OCR'd rate by an
  OCR'd area compounds two uncertain readings into a confident-looking wrong
  number in the field buyers sort by. Every figure is also confirmed against a
  second, independently preprocessed reading of the same box; if the two
  disagree the price is dropped. A dropped price shows as **Call Owner**, which
  is the honest answer when the ad never printed one.
* The pipeline only understands page scans and, as a fallback, PDFs with a real
  text layer. It does not accept loose photos of a page.

## Politeness

`source.js` identifies the importer honestly in its User-Agent, sends one
request at a time with a delay between them, and only ever reads the publisher's
public REST API and the PDFs they link openly. The site's `robots.txt` allows
general crawling and signals `ai-train=no`; nothing here trains on the content.
