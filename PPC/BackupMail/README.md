# Weekly database backup by e-mail

Mails the newest MongoDB archive to the configured recipients once a week, as a
`.archive.gz` attachment.

It **does not dump the database**. A nightly dump script produces a size-checked
archive and keeps the newest few; this script picks the most recent one up and
posts it — so there is no second dump against the live database, and nothing is
ever mailed that the backup script has not already validated.

> **Prerequisite: the nightly dump must exist.** Rent Pondy already has
> `/root/vps-backup.sh` on its VPS. Pondy Properties needs an equivalent — a
> ready-to-use one ships here as
> [`vps-backup-ppcpondy.sh`](./vps-backup-ppcpondy.sh). Until something is
> writing `ppcpondy-*.archive.gz` into `BACKUP_MAIL_DIR`, this script will
> correctly e-mail a **"NO database backup found"** alert every week rather than
> failing silently.

## Why it is not part of the express app

The archives live in a root-owned directory that the user running the pm2
process cannot read. So this is a one-shot script run from **root's** crontab,
not a `node-cron` job inside `server.js`. It shares only the SMTP transport
(`../DataAddedMail/mailer.js`) and the credentials in `PPC/.env`.

## Setting up the producer

Upload `vps-backup-ppcpondy.sh` to the server as root, edit the two paths at the
top (`ENV_FILE`, `BACKUP_DIR`), then:

```bash
chmod +x /root/vps-backup-ppcpondy.sh
/root/vps-backup-ppcpondy.sh          # run once by hand and check the log
cat /root/backups/backup-ppcpondy.log
```

It reads `MONGO_URI` straight out of `PPC/.env` into `mongodump` without
printing it, writes `ppcpondy-<db>-<timestamp>.archive.gz`, refuses to keep an
archive under 100 KB, and prunes to the newest 7 **only after** a good dump — so
a failed backup can never delete a good one.

## Setting up the mailer

SMTP is already configured for [the Data Added report](../DataAddedMail/README.md).
These keys are optional — the defaults are what the block in `PPC/.env` sets:

```ini
BACKUP_MAIL_ENABLED=1
BACKUP_MAIL_TO=madhankumar7673@gmail.com
BACKUP_MAIL_CC=
BACKUP_MAIL_DIR=/root/backups
BACKUP_MAIL_PREFIX=ppcpondy
BACKUP_MAIL_MAX_MB=20
BACKUP_MAIL_MAX_AGE_HOURS=48
BACKUP_MAIL_LOG=/root/backups/backup-email-ppcpondy.log
```

`BACKUP_MAIL_PREFIX` is what keeps this honest if the box also holds another
site's backups in the same directory — only `ppcpondy-*.archive.gz` is
considered, so the newest file can never turn out to belong to a different
database.

Cron entries, appended to root's crontab (**append only, never rewrite** — the
crontab is Sentora-managed):

```cron
# Pondy Properties nightly DB dump
30 2 * * * /root/vps-backup-ppcpondy.sh >/dev/null 2>&1

# Pondy Properties weekly DB backup by e-mail - runs after the nightly dump
0 3 * * 0 /usr/bin/node /path/to/PPC/BackupMail/backupEmail.js >/dev/null 2>&1
```

## Running it by hand

```bash
# check everything without sending
node /path/to/PPC/BackupMail/backupEmail.js --dry-run

# send now
node /path/to/PPC/BackupMail/backupEmail.js

# send somewhere else, once
BACKUP_MAIL_TO=you@example.com node /path/to/PPC/BackupMail/backupEmail.js
```

Exit code is `0` on a healthy send, `1` on any alert. Every run appends to
`BACKUP_MAIL_LOG`.

## What it sends

| Situation | Result | Exit |
| --- | --- | --- |
| Healthy archive | Archive attached, with size, timestamp and the tail of the dump log | 0 |
| Archive older than `MAX_AGE_HOURS` | Still attached, subject prefixed **STALE** — the nightly dump has probably stopped | 0 |
| Archive over `MAX_MB` | **Not** attached; alert naming the file and an `scp` command to fetch it | 1 |
| No archive at all | Alert saying where it looked and what it looked for | 1 |

Silence is never treated as success — every failure path sends mail.

## Size headroom

Gmail rejects anything over 25 MB, so `BACKUP_MAIL_MAX_MB=20` leaves the guard
tripping well before Gmail does. When it gets close, move to uploading the
archive to cloud storage and mailing a link instead of raising the cap.

## Restoring

```bash
mongorestore --uri="<MONGO_URI>" --archive=ppcpondy-<db>-<date>.archive.gz --gzip --drop
```

`--drop` replaces existing collections. Restore into a scratch database name
first if you are not completely certain.
