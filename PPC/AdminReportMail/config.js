// Configuration for the daily admin-report e-mail.
//
// SMTP itself is shared with the Data Added report (DataAddedMail/config.js
// reads SMTP_*), so only the recipients and cadence live here.

const bool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
};

const list = (value) =>
  String(value || '').split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

module.exports = {
  enabled: bool(process.env.ADMIN_REPORT_MAIL_ENABLED, true),

  to: list(process.env.ADMIN_REPORT_TO || 'madhankumar7673@gmail.com'),
  cc: list(process.env.ADMIN_REPORT_CC),

  // The page reports on *yesterday*, so it is sent every morning. 08:00 IST is
  // an hour before the Data Added report so the two never collide.
  cron: String(process.env.ADMIN_REPORT_CRON || '0 8 * * *').trim(),
  timezone: String(process.env.ADMIN_REPORT_TZ || 'Asia/Kolkata').trim(),

  // Falls back to the Data Added token so there is one secret to manage unless
  // you deliberately want them separate.
  triggerToken: String(
    process.env.ADMIN_REPORT_TOKEN || process.env.DATA_ADDED_REPORT_TOKEN || ''
  ).trim(),
};
