# Data Added — scheduled e-mail report

Mails a **year summary of properties added** — month by month, split staff-added
vs user-added, plus an "Added By" breakdown — to a fixed recipient list on a
cron schedule, with the same figures attached as a spreadsheet.

Additive layer: new folder, two new routes, no new collection, no change to any
existing router or screen. Three lines were added to `server.js` (require,
`app.use`, `start()` inside `app.listen`).

> **No matching admin screen.** Rent Pondy has a Data Added page at
> `/process/dashboard/data-added` that this mirrors; the Pondy Properties admin
> panel has none. `reportData.js` is therefore the **only** definition of these
> figures here — there is no screen to keep in step with, and equally no screen
> to cross-check the mail against. If a Data Added page is added later, point it
> at the same `$match` / `$group` shapes.

## What counts as what

A property counts as **staff added** when it carries a non-empty `addedBy` name;
everything else was posted by the owner from the user app. Months are bucketed
in IST (`+05:30`, no DST) so a record created at 01:00 IST lands in the right
month rather than the previous UTC day.

## Files

| File | Role |
| --- | --- |
| `config.js` | Reads every setting from `.env`, with defaults |
| `reportData.js` | The aggregation over `AddModel` |
| `reportExcel.js` | Year-summary + Added By workbook |
| `reportEmail.js` | Subject + HTML body + plain-text alternative |
| `mailer.js` | nodemailer transport, created lazily — **shared by all four report layers** |
| `sendReport.js` | Orchestrates data → workbook → e-mail → SMTP |
| `state.js` | In-memory record of the last run |
| `DataAddedMailRouter.js` | `/data-added-mail/status`, `/data-added-mail/send-now` |
| `index.js` | Arms the cron; exports the router |

## Setup

The feature stays **asleep** until the SMTP settings exist — the server logs one
line at boot and carries on:

```
[DataAddedMail] asleep — missing SMTP_HOST, SMTP_USER, SMTP_PASS. Fill these in .env and restart to arm the schedule.
```

The settings block is already present in `PPC/.env` with blank credentials. Fill
in the three SMTP values and restart (`pm2 restart <process>`); the boot log
should then read

```
[DataAddedMail] armed — "0 9 1 * *" Asia/Kolkata, 1 recipient(s), base ALL
```

Local and VPS `.env` files are separate — never upload the local one over the
production one, or you will wipe the live secrets.

```ini
DATA_ADDED_REPORT_ENABLED=1
DATA_ADDED_REPORT_TO=madhankumar7673@gmail.com
DATA_ADDED_REPORT_CC=
DATA_ADDED_REPORT_CRON=0 9 1 * *
DATA_ADDED_REPORT_TZ=Asia/Kolkata
DATA_ADDED_REPORT_BASE=ALL
DATA_ADDED_REPORT_HIDE_DELETED=0
DATA_ADDED_REPORT_TOKEN=pick-a-long-random-string

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=                     # blank ⇒ sends as SMTP_USER
```

### Gmail credentials

`SMTP_PASS` is **not** the account password — Gmail rejects those. Turn on
2-Step Verification, then generate an
[App Password](https://myaccount.google.com/apppasswords) and paste the 16
characters with the spaces removed.

Check the credentials before trusting the schedule:

```bash
node -e "require('dotenv').config();require('./DataAddedMail/mailer.js').verify().then(()=>console.log('SMTP OK')).catch(e=>console.error('SMTP FAILED:',e.message))"
```

Any other provider works too: Zoho `smtp.zoho.in:465`, Brevo
`smtp-relay.brevo.com:587`, or the VPS's own MTA on `localhost:25`.

Deliverability note: mail sent as `@ppcpondy.com` from a Gmail relay will land
in spam unless SPF/DKIM say it may. Leaving `SMTP_FROM` blank sends **from** the
Gmail account itself, which avoids that entirely.

## Cadence

`DATA_ADDED_REPORT_CRON` is a standard 5-field expression, evaluated in
`DATA_ADDED_REPORT_TZ` (IST by default).

| Expression | Meaning |
| --- | --- |
| `0 9 1 * *` | 09:00 on the 1st of each month *(default)* |
| `0 9 * * 1` | 09:00 every Monday |
| `0 21 * * *` | 21:00 every day |
| `0 9 1 1 *` | 09:00 on 1 January only |

The mail always covers the **current calendar year to date**. Sent on the 1st,
the month that just closed is highlighted in the table and named in the subject.

## Routes

```
GET  /PPC/data-added-mail/status
```
Reports whether the schedule is armed, the cadence, masked recipients and the
last run's outcome. Never echoes credentials.

```
POST /PPC/data-added-mail/send-now
```
Sends immediately. Requires `DATA_ADDED_REPORT_TOKEN`, passed as the
`x-report-token` header or `?token=`. Optional: `?year=2025`, `?base=PY`,
`?to=someone@else.com`, `?dryRun=1` (builds everything, sends nothing).

Publicly the prefix appears **twice** — the admin app's `REACT_APP_API_URL` is
`https://ppcpondy.com/PPC/PPC` for the same reason.

```bash
# prove the pipeline without sending
curl -X POST "https://ppcpondy.com/PPC/PPC/data-added-mail/send-now?dryRun=1" \
     -H "x-report-token: <token>"

# on the VPS itself, straight to node (single prefix)
curl -X POST "http://127.0.0.1:5006/PPC/data-added-mail/send-now" \
     -H "x-report-token: <token>"
```

Leaving `DATA_ADDED_REPORT_TOKEN` blank disables `/send-now` entirely; the cron
still runs.

## City scope

City scope comes from `cityScopePlugin` via `runWithBase()`, so
`DATA_ADDED_REPORT_BASE=PY` produces exactly what the admin header's
Pondicherry selection would show; `ALL` leaves the query unscoped.
