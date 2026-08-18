// Configuration for the scheduled "Data Added" e-mail report.
//
// Everything is driven from .env so the cadence and the recipient list can be
// changed on the VPS without a redeploy. Nothing here throws: when the SMTP
// credentials are missing the whole feature simply stays asleep (see
// mailer.isConfigured) exactly like the FCM layer does without its key file.

const bool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
};

/** "a@x.com, b@y.com" → ['a@x.com', 'b@y.com']. Blank → []. */
const list = (value) =>
  String(value || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const config = {
  // Master switch. Turn off to stop the cron without removing the config.
  enabled: bool(process.env.DATA_ADDED_REPORT_ENABLED, true),

  // Who gets the report. TO must be non-empty for anything to be sent.
  to: list(process.env.DATA_ADDED_REPORT_TO || 'madhankumar7673@gmail.com'),
  cc: list(process.env.DATA_ADDED_REPORT_CC),
  bcc: list(process.env.DATA_ADDED_REPORT_BCC),

  // Default: 09:00 IST on the 1st of every month, covering the year so far.
  cron: String(process.env.DATA_ADDED_REPORT_CRON || '0 9 1 * *').trim(),
  timezone: String(process.env.DATA_ADDED_REPORT_TZ || 'Asia/Kolkata').trim(),

  // City base the report is built for: ALL (default), PY or CH — the same
  // codes the admin header's city selector sends.
  base: String(process.env.DATA_ADDED_REPORT_BASE || 'ALL').trim().toUpperCase(),

  // Drops soft-deleted rows from the counts. Off by default so the e-mail
  // totals match a plain, unfiltered count of what was added.
  hideDeleted: bool(process.env.DATA_ADDED_REPORT_HIDE_DELETED, false),

  // Shared secret for the manual /data-added-mail/send-now trigger. Blank
  // disables that route entirely (the cron still runs).
  triggerToken: String(process.env.DATA_ADDED_REPORT_TOKEN || '').trim(),

  smtp: {
    host: String(process.env.SMTP_HOST || '').trim(),
    port: Number(process.env.SMTP_PORT) || 587,
    // Port 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: bool(process.env.SMTP_SECURE, Number(process.env.SMTP_PORT) === 465),
    user: String(process.env.SMTP_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || '').trim(),
    // Falls back to the login address so the envelope is always valid.
    from: String(process.env.SMTP_FROM || '').trim(),
  },
};

/** Human-readable label for the city base, used in the subject line. */
config.baseLabel =
  config.base === 'PY' ? 'Pondicherry' : config.base === 'CH' ? 'Chennai' : 'All Cities';

module.exports = config;
