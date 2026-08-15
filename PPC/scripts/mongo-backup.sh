#!/usr/bin/env bash
#
# mongo-backup.sh — daily MongoDB backup for PondyProperties (AdminMoon)
# --------------------------------------------------------------------------
# - Dumps the AdminMoon database to a single gzip archive per run.
# - Keeps only the 7 most recent backups; older ones are deleted one by one.
# - Skips deletion / rotation if the dump fails, so a bad run can never wipe
#   your good backups.
#
# Deploy: /home/ppcpondy/scripts/mongo-backup.sh   (chmod +x)
# Cron:   0 2 * * *  /home/ppcpondy/scripts/mongo-backup.sh
# --------------------------------------------------------------------------

set -euo pipefail

# ------------------------- CONFIG (edit if needed) -------------------------
DB_NAME="AdminMoon"
MONGO_HOST="mongodb://localhost:27017"
BACKUP_DIR="/home/ppcpondy/db-backups"     # MUST be outside public_html (not web-served)
RETENTION=7                                # how many backups to keep
LOG_FILE="$BACKUP_DIR/backup.log"
# ---------------------------------------------------------------------------

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUTFILE="$BACKUP_DIR/${DB_NAME}-${STAMP}.gz"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "=== Backup start: DB=$DB_NAME -> $OUTFILE ==="

# --- Ensure the backup tool is available ---
if ! command -v mongodump >/dev/null 2>&1; then
  log "ERROR: mongodump not found. Install it with: sudo yum install -y mongodb-database-tools"
  exit 1
fi

# --- Create the dump (single compressed archive) ---
if mongodump --uri="${MONGO_HOST}/${DB_NAME}" --archive="$OUTFILE" --gzip >>"$LOG_FILE" 2>&1; then
  SIZE="$(du -h "$OUTFILE" | cut -f1)"
  log "SUCCESS: created $(basename "$OUTFILE") ($SIZE)"
else
  log "ERROR: mongodump failed — removing partial file, keeping existing backups untouched"
  rm -f "$OUTFILE"
  exit 1
fi

# --- Retention: keep the newest $RETENTION, delete the rest one by one ---
# `ls -1t` lists newest first; `tail -n +N` skips the newest N and prints the old ones.
OLD_BACKUPS="$(ls -1t "$BACKUP_DIR"/${DB_NAME}-*.gz 2>/dev/null | tail -n +$((RETENTION + 1)) || true)"
if [ -n "$OLD_BACKUPS" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    rm -f "$f" && log "Deleted old backup: $(basename "$f")"
  done <<< "$OLD_BACKUPS"
else
  log "Retention: nothing to delete (<= $RETENTION backups present)"
fi

COUNT="$(ls -1 "$BACKUP_DIR"/${DB_NAME}-*.gz 2>/dev/null | wc -l)"
log "=== Backup done. $COUNT backup(s) retained in $BACKUP_DIR ==="
