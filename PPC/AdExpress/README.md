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

Admin screen: **RENT Property → Adexpress Import** (`/dashboard/adexpress-import`,
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
 vision.triagePage   one look per page: does it carry property ads?
      ▼  (about 40% of an issue is employment ads — those pages are skipped)
 boxes.js       finds the ad boxes from the printed rules — no model involved
      ▼
 vision.extractAdFromBox    reads ONE ad: rent/sale, rent, BHK, area, phone
 vision.readPhoneDigits ×3  independent digits-only re-reads of the same box
      ▼
 normalize.resolvePhones    unanimous or nothing
      ▼
 crops.js       saves a picture of that exact ad
      ▼
 adexpress_ads  staged  →  a person confirms the number against the picture
      ▼
 POST /PPC/bulk-upload-properties   ← the app's own existing publish path
```

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

## The nightly job

`schedule.js` arms a cron at boot (`ADEXPRESS_CRON`, default **02:40 IST**):

1. ask the site for the latest issues;
2. take the newest one with a public PDF that has not been read;
3. run it through the reader;
4. publish the rent ads whose independent readings all agreed.

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
two new collections (`adexpress_issues`, `adexpress_ads`), one new admin screen.
The only contact with the live app is the Import button, which posts rows to the
**existing** `POST /PPC/bulk-upload-properties` — the same endpoint the admin's
Excel bulk upload already uses. So imported rows get their Rent-IDs, their
complete/incomplete routing and their PreApproved/Pending placement from the
same code as every other upload, and the whole batch can be reverted from the
Bulk Upload screen.

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
| GET | `/PPC/adexpress/cron/status` | what the nightly job has been doing |
| POST | `/PPC/adexpress/cron/run-now` | run the nightly cycle now |
| GET | `/PPC/adexpress/export` | the filtered ads as an .xlsx |

Only one issue is read at a time process-wide: a decoded page is ~200 MB of
pixels and the VPS has no room for two.

## Environment

Everything has a working default; the only variable that must exist is the
OpenAI key, which the AI assistant already needs.

| Variable | Default | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | required; shared with the assistant |
| `ADEXPRESS_ENABLED` | `true` | `false` makes every route answer 503 |
| `ADEXPRESS_CRON_ENABLED` | `true` | arm the nightly pickup |
| `ADEXPRESS_CRON` | `40 2 * * *` | when it runs |
| `ADEXPRESS_CRON_TZ` | `Asia/Kolkata` | schedule timezone |
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

## Cost, and why it is slow

Measured on the 8 Aug 2026 Pondicherry issue, one property page (66 ad boxes):
**84k tokens, about 3 minutes**. A typical issue has 4–6 property pages, so
roughly 350–500k tokens and 12–18 minutes.

The clock, not the money, is the constraint: the OpenAI account this runs
against is capped at **30,000 tokens per minute**, so 84k tokens cannot take less
than three minutes no matter how much is run in parallel. `vision.js` keeps a
rolling one-minute budget and paces itself under `ADEXPRESS_TPM`; before that
existed, bursts blew the limit and silently lost half a page of ads. Raising the
account's rate tier and `ADEXPRESS_TPM` together is the one change that makes
this materially faster.

Reading is a background job — start it and come back.

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
  mandatory fields a newspaper ad never states (rent type, posted by, available
  date, floor, area) — usually the right place for a lead that still needs a call.
* The pipeline only understands page scans and, as a fallback, PDFs with a real
  text layer. It does not accept loose photos of a page.

## Politeness

`source.js` identifies the importer honestly in its User-Agent, sends one
request at a time with a delay between them, and only ever reads the publisher's
public REST API and the PDFs they link openly. The site's `robots.txt` allows
general crawling and signals `ai-train=no`; nothing here trains on the content.
