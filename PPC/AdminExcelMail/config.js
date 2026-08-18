// Configuration for the Admin Detail (Excel) e-mail.
//
// A SEPARATE mail from the admin-report PDF — separate recipients, separate
// cadence, separate on/off switch. SMTP itself is shared (DataAddedMail/mailer).

const bool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
};

const list = (value) =>
  String(value || '').split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

module.exports = {
  enabled: bool(process.env.ADMIN_EXCEL_MAIL_ENABLED, true),

  to: list(process.env.ADMIN_EXCEL_TO || 'madhankumar7673@gmail.com'),
  cc: list(process.env.ADMIN_EXCEL_CC),

  // 08:30 IST — after the admin PDF at 08:00, so the two never overlap and a
  // slow run of one cannot delay the other.
  cron: String(process.env.ADMIN_EXCEL_CRON || '30 8 * * *').trim(),
  timezone: String(process.env.ADMIN_EXCEL_TZ || 'Asia/Kolkata').trim(),

  triggerToken: String(
    process.env.ADMIN_EXCEL_TOKEN ||
    process.env.ADMIN_REPORT_TOKEN ||
    process.env.DATA_ADDED_REPORT_TOKEN || ''
  ).trim(),
};
