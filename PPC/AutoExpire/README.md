# Auto-expire (Pondy Properties)

Every night at 03:00 IST, stale listings are marked **expired**. They are never deleted.

| What | Rule |
|---|---|
| Properties imported from Adexpress | 90 days |
| All other properties (user / admin / Excel bulk) | 180 days |
| Buyer Assistance | 180 days |

**The clock** starts at the latest of these dates:
- the upload date
- the newest bill for the record
- the newest paid PayU payment for the record
- an admin restore

**Never expired** while a paid plan is still running:
- a paid bill (any amount) within its validity
- a paid PayU plan within its duration
- the same owner phone holding a running paid bill or plan
- a featured listing (`AUTO_EXPIRE_PROTECT_FEATURED=false` turns this off)

**Live statuses scanned:**
- properties: `active`, `complete`, `incomplete`
- Buyer Assistance: `baActive`, `baPending`, `buyer-assistance-interest`, `buyer-interest-tried`

`pending` is left out on purpose: nothing sets it, and `AddModel.previousStatus` can't hold it.

Direct customer payments (`productinfo: 'Pondy Properties Payment'`) are ignored: they aren't Buyer Assistance plans.

Soft-deleted rows are skipped.

## What "expire" writes

**Property:**
- `status: 'expired'`
- `previousStatus`: the old status (only values its enum accepts)
- `reason: "Auto Expire <date>: …"`
- `updatedAt`

It appears on the existing **Expired Property** page, and that page's restore works on it.

**Buyer Assistance:** the same writes as the admin's Mark as Expired:
- `ba_status: 'baExpired'`, `baExpiredAt`, `baExpiredBy: 'Auto Expire'`
- a paid PayU record flips to `expiredPlan`

It appears on the Expired Assistant screen under "Manually Expired" with a working Undo.

**Restores:** when an admin restores a record, the job notices it the next night (`auto_expire_log.restoredSeenAt`). From then on the restore counts as a fresh start, so the record is not re-expired. Several existing routes also flip a listing back to `active` (`POST /contact`, pay-now, report/sold-out undo); the job treats those as a restore too.

## Modes

The job starts in **dry-run**, which only reports.

| Mode | Behaviour |
|---|---|
| `dry-run` (default) | Nightly run records what *would* expire in `auto_expire_runs`; changes nothing. |
| `live` | Nightly run expires (at most `AUTO_EXPIRE_MAX_PER_RUN`, default 1000 per kind, oldest first). |
| `off` | Nightly run does nothing. |

You can set the mode in either of two ways:
- `AUTO_EXPIRE_MODE` in `.env`, which needs a restart
- `POST /auto-expire/mode`, which is saved in `auto_expire_settings` and wins over `.env`

## Endpoints

The public base is `https://ppcpondy.com/PPC/PPC`.

| Call | |
|---|---|
| `GET /auto-expire/status` | mode, rules, schedule, last 10 runs |
| `GET /auto-expire/preview[?items=1]` | dry run now; ppcIds / ba_ids and dates only, no phone numbers |
| `POST /auto-expire/run-now[?dryRun=1]` | header `x-auto-expire-token` |
| `POST /auto-expire/mode` `{"mode":"live"}` | header `x-auto-expire-token` |

The token is `AUTO_EXPIRE_TOKEN` in `.env`. Without it, the two POST routes return 503.

**CLI**, from the `PPC` directory:

```
node AutoExpire/cli.js [--items]   # dry run
node AutoExpire/cli.js --live      # really expire
```

## Settings (`.env`, all optional)

| Variable | Default |
|---|---|
| `AUTO_EXPIRE_MODE` | `dry-run` |
| `AUTO_EXPIRE_CRON` | `0 3 * * *` |
| `AUTO_EXPIRE_TZ` | `Asia/Kolkata` |
| `AUTO_EXPIRE_GENERAL_DAYS` | `180` |
| `AUTO_EXPIRE_ADEX_DAYS` | `90` |
| `AUTO_EXPIRE_ASSIST_DAYS` | `180` |
| `AUTO_EXPIRE_PROPERTY_STATUSES` | see above |
| `AUTO_EXPIRE_ASSIST_STATUSES` | see above |
| `AUTO_EXPIRE_PROTECT_FEATURED` | `true` |
| `AUTO_EXPIRE_MAX_PER_RUN` | `1000` |
| `AUTO_EXPIRE_ACTOR` | `Auto Expire` |
| `AUTO_EXPIRE_TOKEN` | *(none)* |

## Files

| File | Purpose |
|---|---|
| `engine.js` | the pure decision |
| `sources.js` | the Pondy Properties collections and writes |
| `runner.js` | the run loop |
| `index.js` | cron + wiring |
| `test/autoExpire.test.js` | runs against a throwaway local DB |

To run the tests:

```
node --test AutoExpire/test/autoExpire.test.js
```

The only existing file touched is `server.js`: one `require`, one `app.use` (before `SingleSendRouter`, whose catch-all would swallow it), one `start()`.
