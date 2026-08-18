#!/usr/bin/env node
//
// Weekly e-mail of the newest MongoDB backup archive.
//
//   node /path/to/PPC/BackupMail/backupEmail.js
//
// A one-shot script run from root's crontab — deliberately NOT part of the
// express app, because the archives live in a root-owned directory that the
// user owning the pm2 process cannot read.
//
// It never dumps the database itself. A nightly dump script (see
// vps-backup-ppcpondy.sh in this folder) produces a size-checked archive and
// keeps the newest few; this script just picks the most recent one up and posts
// it. That means no second mongodump against the live database, and nothing
// mailed that the backup script has not already validated.
//
// Silence is never treated as success: if the archive is missing, stale or too
// big to attach, an alert e-mail goes out saying so.

const fs = require('fs');
const path = require('path');

// PPC/.env holds the SMTP credentials, shared with the Data Added report.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// One transport definition for the whole backend — see DataAddedMail/mailer.js.
const mailer = require('../DataAddedMail/mailer');

const LOG = '[BackupMail]';

const bool = (v, d) => (v === undefined || v === '' ? d : /^(1|true|yes|on)$/i.test(String(v).trim()));
const list = (v) => String(v || '').split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

const CONFIG = {
  enabled: bool(process.env.BACKUP_MAIL_ENABLED, true),
  to: list(process.env.BACKUP_MAIL_TO || 'madhankumar7673@gmail.com'),
  cc: list(process.env.BACKUP_MAIL_CC),
  dir: String(process.env.BACKUP_MAIL_DIR || '/root/backups').trim(),
  // Only archives carrying this prefix are considered. It matters when this box
  // also holds another site's backups in the same directory — without it the
  // newest file could belong to a different database entirely.
  prefix: String(process.env.BACKUP_MAIL_PREFIX || 'ppcpondy').trim(),
  // Gmail rejects anything over 25 MB; stop short of it so the send never
  // bounces silently. Raise only if you move to a provider with a bigger cap.
  maxMB: Number(process.env.BACKUP_MAIL_MAX_MB) || 20,
  // The nightly dump runs every 24h, so anything older than this means the
  // backup cron has stopped and someone needs to know.
  maxAgeHours: Number(process.env.BACKUP_MAIL_MAX_AGE_HOURS) || 48,
  logFile: String(process.env.BACKUP_MAIL_LOG || '/root/backups/backup-email-ppcpondy.log').trim(),
};

// Escape the prefix so a dot or dash in it cannot widen the match.
const ARCHIVE_RE = new RegExp(
  `^${CONFIG.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-.*\\.archive\\.gz$`
);

// `--dry-run` does every check and builds the message, but sends nothing.
// Used to verify a deploy without putting a database dump in someone's inbox.
const DRY_RUN = process.argv.includes('--dry-run');

// ── helpers ───────────────────────────────────────────────────────────────────

const log = (message) => {
  const line = `${new Date().toISOString()} ${LOG} ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(CONFIG.logFile, `${line}\n`);
  } catch {
    // A missing log file must never stop the mail going out.
  }
};

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

const istStamp = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(date);

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Newest archive in the backup directory, plus the rest for context. */
function findArchives() {
  if (!fs.existsSync(CONFIG.dir)) return [];
  return fs
    .readdirSync(CONFIG.dir)
    .filter((name) => ARCHIVE_RE.test(name))
    .map((name) => {
      const full = path.join(CONFIG.dir, name);
      const stat = fs.statSync(full);
      return { name, full, size: stat.size, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

/** Last few lines of the nightly backup script's own log, for the body. */
function backupLogTail(lines = 4) {
  try {
    const text = fs.readFileSync(path.join(CONFIG.dir, `backup-${CONFIG.prefix}.log`), 'utf8');
    return text.trimEnd().split('\n').slice(-lines).join('\n');
  } catch {
    return '';
  }
}

// ── e-mail bodies ─────────────────────────────────────────────────────────────

const shell = (accent, title, rows, note) => `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f3f6;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
      <tr><td style="padding:18px 24px;border-bottom:1px solid #e5e7eb;border-top:4px solid ${accent};">
        <div style="font-size:18px;font-weight:700;color:#0d6efd;">Pondy Properties | Database Backup</div>
        <div style="font-size:14px;color:#1f2937;padding-top:4px;">${title}</div>
      </td></tr>
      <tr><td style="padding:8px 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:13px;color:#1f2937;">
          ${rows}
        </table>
      </td></tr>
      <tr><td style="padding:12px 24px 20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6;">
        ${note}
      </td></tr>
    </table>
  </td></tr>
</table>`;

const row = (label, value) => `
  <tr>
    <td style="padding:7px 0;border-bottom:1px solid #f0f1f3;color:#6b7280;width:38%;">${esc(label)}</td>
    <td style="padding:7px 0;border-bottom:1px solid #f0f1f3;font-weight:600;">${esc(value)}</td>
  </tr>`;

const RESTORE_NOTE = `
  <strong>To restore:</strong><br>
  <code style="background:#f3f4f6;padding:2px 5px;border-radius:4px;">mongorestore --uri="&lt;MONGO_URI&gt;" --archive=&lt;file&gt;.archive.gz --gzip --drop</code><br>
  <span style="color:#b45309;">--drop replaces existing collections. Restore to a scratch database first if you are not certain.</span><br><br>
  Produced by the nightly dump script and posted by
  <code>PPC/BackupMail/backupEmail.js</code>.`;

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!CONFIG.enabled) {
    log('disabled (BACKUP_MAIL_ENABLED=0) — nothing sent');
    return 0;
  }
  if (!mailer.isConfigured()) {
    log(`ERROR: SMTP not configured — missing ${mailer.missingSettings().join(', ')}`);
    return 1;
  }
  if (!CONFIG.to.length) {
    log('ERROR: no recipient — set BACKUP_MAIL_TO');
    return 1;
  }

  const archives = findArchives();
  const now = new Date();
  const send = async (message) => {
    if (DRY_RUN) {
      const attached = message.attachments?.[0];
      log(`DRY RUN — would send "${message.subject}" to ${CONFIG.to.join(', ')}` +
          (attached ? ` with ${attached.filename}` : ' with no attachment'));
      return { accepted: CONFIG.to, rejected: [], messageId: 'dry-run' };
    }
    return mailer.sendMail({ to: CONFIG.to, cc: CONFIG.cc.length ? CONFIG.cc : undefined, ...message });
  };

  // ── nothing to send ─────────────────────────────────────────────────────────
  if (!archives.length) {
    log(`ALERT: no ${CONFIG.prefix}-*.archive.gz found in ${CONFIG.dir}`);
    await send({
      subject: '⚠ Pondy Properties · NO database backup found',
      html: shell('#dc3545', 'No backup archive could be found', [
        row('Looked in', CONFIG.dir),
        row('Matching', `${CONFIG.prefix}-*.archive.gz`),
        row('Checked at', `${istStamp(now)} IST`),
      ].join(''), 'The nightly backup may have stopped. Check the dump script\'s log and that its cron entry still exists.'),
      text: `No ${CONFIG.prefix}-*.archive.gz found in ${CONFIG.dir} at ${istStamp(now)} IST.`,
    });
    return 1;
  }

  const newest = archives[0];
  const ageHours = (now - newest.mtime) / 3600000;
  const stale = ageHours > CONFIG.maxAgeHours;
  const tooBig = newest.size > CONFIG.maxMB * 1024 * 1024;

  const facts = [
    row('Archive', newest.name),
    row('Size', `${mb(newest.size)} MB`),
    row('Taken', `${istStamp(newest.mtime)} IST`),
    row('Age', `${ageHours < 24 ? `${ageHours.toFixed(1)} hours` : `${(ageHours / 24).toFixed(1)} days`}`),
    row('Archives retained', String(archives.length)),
  ].join('');

  // ── too big to attach ───────────────────────────────────────────────────────
  if (tooBig) {
    log(`ALERT: ${newest.name} is ${mb(newest.size)} MB, over the ${CONFIG.maxMB} MB limit — sent notice without attachment`);
    await send({
      subject: `⚠ Pondy Properties · backup too large to e-mail (${mb(newest.size)} MB)`,
      html: shell('#fd7e14', 'The backup has outgrown the e-mail attachment limit', facts,
        `The archive exceeds the ${CONFIG.maxMB} MB cap (Gmail rejects over 25 MB), so it was <strong>not attached</strong>.
         The file is safe on the server at <code>${esc(newest.full)}</code>.<br><br>
         Fetch it with:<br>
         <code style="background:#f3f4f6;padding:2px 5px;border-radius:4px;">scp &lt;server&gt;:${esc(newest.full)} .</code><br><br>
         Longer term, switch to uploading to cloud storage and mailing a link instead.`),
      text: `Backup ${newest.name} is ${mb(newest.size)} MB, above the ${CONFIG.maxMB} MB limit, so it was not attached.\nIt is on the server at ${newest.full}`,
    });
    return 1;
  }

  // ── normal send (flagged if stale) ──────────────────────────────────────────
  const tail = backupLogTail();
  const info = await send({
    subject: stale
      ? `⚠ Pondy Properties · MongoDB backup is STALE (${(ageHours / 24).toFixed(1)} days old)`
      : `Pondy Properties · MongoDB backup — ${newest.name.replace(new RegExp(`^${CONFIG.prefix}-|\\.archive\\.gz$`, 'g'), '')} (${mb(newest.size)} MB)`,
    html: shell(
      stale ? '#fd7e14' : '#198754',
      stale
        ? `Attached backup is ${(ageHours / 24).toFixed(1)} days old — the nightly dump may have stopped`
        : 'Weekly copy of the live database, attached',
      facts,
      (stale
        ? `<strong style="color:#b45309;">This archive is older than ${CONFIG.maxAgeHours} hours.</strong>
           Check the dump script's log and its cron entry.<br><br>`
        : '') +
        (tail ? `<strong>Backup log:</strong><br><code style="background:#f3f4f6;padding:2px 5px;border-radius:4px;display:inline-block;white-space:pre;">${esc(tail)}</code><br><br>` : '') +
        RESTORE_NOTE
    ),
    text: [
      stale ? `WARNING: this archive is ${(ageHours / 24).toFixed(1)} days old.` : 'Weekly database backup attached.',
      '',
      `Archive : ${newest.name}`,
      `Size    : ${mb(newest.size)} MB`,
      `Taken   : ${istStamp(newest.mtime)} IST`,
      `Retained: ${archives.length} archives`,
      '',
      tail ? `Backup log:\n${tail}\n` : '',
      'Restore with:',
      `  mongorestore --uri="<MONGO_URI>" --archive=${newest.name} --gzip --drop`,
      '  (--drop replaces existing collections)',
    ].join('\n'),
    attachments: [
      // `path` streams the file rather than buffering it into memory.
      { filename: newest.name, path: newest.full, contentType: 'application/gzip' },
    ],
  });

  // Never let the log claim a send that did not happen — a dry run leaves the
  // same line in the file that a real send does, and someone reading the log
  // months later has no other way to tell them apart.
  log(`${DRY_RUN ? 'DRY RUN ok —' : 'sent'} ${newest.name} (${mb(newest.size)} MB)` +
      ` ${DRY_RUN ? 'would go' : 'to'} ${info.accepted.join(', ')}${stale ? ' [STALE]' : ''}`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    log(`ERROR: ${error.message}`);
    process.exit(1);
  });
