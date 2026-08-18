# Admin Detail report (daily Excel)

A **separate** e-mail from [the admin-report PDF](../AdminReportMail/README.md).
That one carries counts; this one carries the **rows behind those counts**, with
phone numbers, as a multi-sheet `.xlsx`.

Sent daily at **08:30 IST** — half an hour after the PDF, so the two never
overlap and a slow run of one cannot delay the other.

## Sheets

| Sheet | Scope | Key columns |
| --- | --- | --- |
| Summary | — | row counts + what each sheet covers, warnings |
| Yesterday Actions | yesterday | action, date/time, **user phone**, **owner phone**, ppc/ba id |
| Yesterday Login | yesterday | phone, login date, mode, OTP, status, remarks role, conversion |
| Unreported-Unconverted | all time | phone, category, last login, role, conversion |
| Payments | outstanding | bucket, phone, amount, plan, PayU status, txn id |
| Followups `MON YYYY` | **this month only** | type, phone, id, follow-up date, status, admin |
| Bills `MON YYYY` | **this month only** | type, bill no, date, owner phone, amounts, admin |

Follow-ups and Bills are deliberately **monthly, never all-time** — that was the
requirement. Every sheet has a frozen header row and autofilter switched on.

## Reconciliation

`fetchDetail.js` calls the same endpoints as the screen and applies the **same
filters** as `AdminReport.jsx`, so the row counts here reconcile with the PDF's
figures. It reads the same two easy-to-get-wrong fields the PDF does —
`viewers[].viewedAt` and `contactedAt` — which is what keeps the spreadsheet,
the PDF and the (since-fixed) screen all agreeing. See
[the PDF README](../AdminReportMail/README.md#two-fields-that-were-wrong-on-the-screen).

Run them minutes apart and small differences appear — that is live data moving,
not a bug. Bills and follow-ups are created throughout the day.

### One row per phone, not per login

`Unreported-Unconverted` is a call list, so it carries **one row per phone** —
the same person logging in ten times is still one person to chase. The
`unreported` / `conversion pending` counts quoted on the Summary sheet and in
the e-mail are distinct-phone counts for the same reason, so they add up to the
rows actually in the sheet. The raw login-record counts are higher and are not
reported anywhere, because they would overstate the workload.

### Bills are bucketed by `createdAt`, not `billDate`

`billDate` is a free-text `String` on both `Bill` and `BuyerBill`. Bucketing the
month by it would silently drop any row saved in a format `moment` cannot parse,
so the month comes from `createdAt` (a real `Date`) and `billDate` is carried
through to its own column exactly as written.

## Settings

```ini
ADMIN_EXCEL_MAIL_ENABLED=1
ADMIN_EXCEL_TO=madhankumar7673@gmail.com
ADMIN_EXCEL_CC=
ADMIN_EXCEL_CRON=30 8 * * *
ADMIN_EXCEL_TZ=Asia/Kolkata
ADMIN_EXCEL_TOKEN=            # falls back to ADMIN_REPORT_TOKEN / DATA_ADDED_REPORT_TOKEN
ADMIN_EXCEL_API_BASE=http://127.0.0.1:5006/PPC
```

## Routes

```bash
curl https://ppcpondy.com/PPC/PPC/admin-excel-mail/status

# build everything, send nothing — returns the row counts
curl -X POST "https://ppcpondy.com/PPC/PPC/admin-excel-mail/send-now?dryRun=1" \
     -H "x-report-token: <token>"

# real send (optionally ?to=someone@else.com)
curl -X POST "https://ppcpondy.com/PPC/PPC/admin-excel-mail/send-now" \
     -H "x-report-token: <token>"
```

## Note on the contents

The workbook contains **customer phone numbers** for every action, login and
bill. On a mid-2026 snapshot it was ~0.6 MB, dominated by the ~1,400-row backlog
sheet. If it ever approaches Gmail's 25 MB limit the backlog sheet is the one to
cap first.
