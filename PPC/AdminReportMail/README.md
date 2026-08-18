# Admin report by e-mail (daily PDF)

Sends the Pondy Properties **Admin Report** — the page at
`/process/dashboard/adminreport` — as a PDF every morning, with the headline
figures repeated in the e-mail body so they are readable on a phone.

All six tabs are included: Yesterday Action, Yesterday's Property, Yesterday
Login, Property Count, Payments and Follow Up.

## How the numbers are obtained

`fetchReport.js` is a server-side port of
`Pondy Properties ADMIN/src/AdminReport.jsx`. It calls the **same 17 endpoints
the screen calls**, over `127.0.0.1`, rather than re-querying Mongo. If someone
changes what a route returns, the PDF changes with the page instead of drifting
from it.

No `base` parameter is sent, which `cityScopePlugin` reads as no restriction —
the All Cities view the screen defaults to.

> **Keep in step:** the tab labels, row order and every derivation in
> `fetchReport.js` mirror `AdminReport.jsx`. Change that screen and change this
> too, or the PDF and the page will disagree.

Failures are collected, not fatal. A `404` is this backend's way of saying "no
rows" (most list routes return 404 on an empty result), so 404s are treated as
zero rather than as an outage; any other status is named in an orange banner in
the e-mail and at the end of the PDF, so a low figure is never mistaken for a
real one.

## Two fields that were wrong on the screen

Until **2026-08-15** `AdminReport.jsx` filtered two rows on a field its endpoint
never returns, so both sat at `0` regardless of the data. Verified against the
live database: not one property carries a top-level `viewedAt`, and not one
contact log carries `createdAt`.

| Row | Screen used to read | Endpoint actually returns |
| --- | --- | --- |
| VIEWED PROPERTIES | `viewedAt` on the property | `viewers[].viewedAt`, nested per viewer |
| CALLED LIST | `createdAt` | `contactedAt` |

The screen was fixed at the same time this was written, so **page and mail now
agree**. Keep them that way: `fetchReport.js` counts the nested viewer entries
and reads `contactedAt`. `filterByYesterday` on the screen also gained a
truthiness guard, so a missing date can no longer be coerced by `moment()` into
"now".

One quirk is **mirrored rather than corrected**, because it is a definition
rather than a bug: `/fetch-active-users-datas-all` returns `planName: 'N/A'`
when no plan matched, so the screen's "not free ⇒ paid" test counts unplanned
properties as **PAID PROPERTY**. The PDF keeps that total and adds an indented
`of which no plan matched (N/A)` row beneath it, so the number can be read
honestly without changing what staff see on the page.

`report.notes` still renders under the tables and is the channel for explaining
any future divergence; it is empty today.

## Why PDFKit and not a headless browser

Screenshotting the real page would be pixel-perfect, but it needs Chromium
(~300 MB, plus native libraries) on the VPS and an authenticated admin session.
PDFKit is pure JavaScript with nothing to compile. The trade-off: tables are
drawn by hand in `reportPdf.js`, so the layout *mirrors* the screen — dark
header row, striped body, grey section bands — rather than being an exact copy.

## Files

| File | Role |
| --- | --- |
| `config.js` | Recipients and cadence from `.env` |
| `fetchReport.js` | Calls the 17 endpoints, builds the six sections |
| `reportPdf.js` | Draws the PDF |
| `reportEmail.js` | Subject, HTML body, plain-text alternative |
| `sendAdminReport.js` | Orchestrates fetch → PDF → e-mail |
| `state.js` | In-memory record of the last run |
| `AdminReportMailRouter.js` | `/admin-report-mail/status`, `/send-now` |
| `index.js` | Arms the cron; exports the router |

SMTP is shared with [the Data Added report](../DataAddedMail/README.md) —
`DataAddedMail/mailer.js` is the single transport for the backend.

## Settings

All optional; the defaults are what production runs.

```ini
ADMIN_REPORT_MAIL_ENABLED=1
ADMIN_REPORT_TO=madhankumar7673@gmail.com
ADMIN_REPORT_CC=
ADMIN_REPORT_CRON=0 8 * * *
ADMIN_REPORT_TZ=Asia/Kolkata
ADMIN_REPORT_TOKEN=            # falls back to DATA_ADDED_REPORT_TOKEN
ADMIN_REPORT_API_BASE=http://127.0.0.1:5006/PPC
ADMIN_REPORT_TIMEOUT_MS=120000
```

The page reports on *yesterday*, so it is sent daily at 08:00 IST — half an
hour before the Admin Detail spreadsheet, so the two never overlap.

## Routes

```bash
# status
curl https://ppcpondy.com/PPC/PPC/admin-report-mail/status

# build everything, send nothing
curl -X POST "https://ppcpondy.com/PPC/PPC/admin-report-mail/send-now?dryRun=1" \
     -H "x-report-token: <token>"

# real send
curl -X POST "https://ppcpondy.com/PPC/PPC/admin-report-mail/send-now" \
     -H "x-report-token: <token>"
```

The prefix appears twice publicly — the admin app's `REACT_APP_API_URL` is
already `https://ppcpondy.com/PPC/PPC`, for the same reason. On the VPS itself
use a single prefix against `127.0.0.1:5006`.

A dry run returns the full `figures` object, which is the quickest way to check
the PDF against the live screen without sending anything.
