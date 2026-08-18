#!/bin/bash
#
# Nightly MongoDB dump for Pondy Properties.
#
# This is the PRODUCER that BackupMail/backupEmail.js consumes: it writes a
# gzipped archive into $BACKUP_DIR, and the mailer picks up the newest one.
# Without this (or an equivalent) running, the weekly backup e-mail has nothing
# to attach and will send a "NO database backup found" alert instead.
#
# It is a reference copy kept with the code. To use it, upload to the server as
# root, adjust the two paths below, make it executable and add the cron entry:
#
#     chmod +x /root/vps-backup-ppcpondy.sh
#     crontab -e        # APPEND only — the crontab is Sentora-managed
#     30 2 * * * /root/vps-backup-ppcpondy.sh >/dev/null 2>&1
#
# Read-only against the database: mongodump takes a consistent snapshot and
# writes elsewhere. It never modifies, drops or moves anything in Mongo.

set -uo pipefail

# ── adjust these two for the server ───────────────────────────────────────────
ENV_FILE="/home/ppcpondy/public_html/PPC/.env"
BACKUP_DIR="/root/backups"
# ──────────────────────────────────────────────────────────────────────────────

PREFIX="ppcpondy"
KEEP=7
MIN_BYTES=102400          # 100 KB — below this the dump is assumed to have failed
MONGODUMP="/usr/bin/mongodump"
LOG="$BACKUP_DIR/backup-$PREFIX.log"

mkdir -p "$BACKUP_DIR"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }

if [ ! -f "$ENV_FILE" ]; then
  log "ERROR: env file not found at $ENV_FILE"
  exit 1
fi

# Read MONGO_URI without echoing it anywhere. Strips an optional quote pair and
# any trailing CR from a Windows-edited .env.
MONGO_URI="$(grep -m1 '^MONGO_URI=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e "s/^'//" -e 's/"$//' -e "s/'$//")"

if [ -z "$MONGO_URI" ]; then
  log "ERROR: MONGO_URI missing from $ENV_FILE"
  exit 1
fi

# Database name = last path segment of the URI, minus any ?query string.
DB_NAME="$(echo "$MONGO_URI" | sed -e 's#.*/##' -e 's#?.*##')"
STAMP="$(date '+%Y%m%d-%H%M%S')"
ARCHIVE="$BACKUP_DIR/$PREFIX-$DB_NAME-$STAMP.archive.gz"

if ! "$MONGODUMP" --uri="$MONGO_URI" --archive="$ARCHIVE" --gzip --quiet; then
  log "ERROR: mongodump failed — keeping previous archives untouched"
  rm -f "$ARCHIVE"
  exit 1
fi

SIZE="$(stat -c%s "$ARCHIVE" 2>/dev/null || echo 0)"
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  log "ERROR: archive is only $SIZE bytes (< $MIN_BYTES) — discarded, previous archives kept"
  rm -f "$ARCHIVE"
  exit 1
fi

log "OK: $(basename "$ARCHIVE") ($((SIZE / 1024)) KB)"

# Prune ONLY after a verified-good dump, and only files this script produces.
# A failed backup can therefore never delete a good one.
cd "$BACKUP_DIR" || exit 0
ls -1t "$PREFIX"-*.archive.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f -- "$old" && log "pruned $old"
done

exit 0
