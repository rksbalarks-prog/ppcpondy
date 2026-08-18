// Orchestrator: endpoints → figures → PDF → e-mail.
//
// Shared by the daily cron and the manual /admin-report-mail/send-now trigger,
// so a test send is exactly what the schedule delivers.

const mailer = require('../DataAddedMail/mailer');
const config = require('./config');
const { fetchAdminReport } = require('./fetchReport');
const { buildReportPdf } = require('./reportPdf');
const { renderAdminReportEmail } = require('./reportEmail');

const LOG = '[AdminReportMail]';

/**
 * @param {object}   [opts]
 * @param {string[]} [opts.to]     overrides ADMIN_REPORT_TO
 * @param {boolean}  [opts.dryRun] build everything, skip the SMTP send
 */
async function sendAdminReport(opts = {}) {
  const to = (opts.to && opts.to.length ? opts.to : config.to).filter(Boolean);

  if (!opts.dryRun && !mailer.isConfigured()) {
    const message = `SMTP not configured — missing ${mailer.missingSettings().join(', ')}`;
    console.warn(`${LOG} skipped: ${message}`);
    return { success: false, skipped: true, message };
  }
  if (!to.length) {
    const message = 'No recipient — set ADMIN_REPORT_TO';
    console.warn(`${LOG} skipped: ${message}`);
    return { success: false, skipped: true, message };
  }

  try {
    const report = await fetchAdminReport();
    const pdf = await buildReportPdf(report);
    const filename = `PondyProperties_Admin_Report_${report.date.replace(/-/g, '')}.pdf`;
    const { subject, html, text } = renderAdminReportEmail(report, { attachmentName: filename });

    if (report.failures.length) {
      console.warn(`${LOG} ${report.failures.length} endpoint(s) failed: ${report.failures.join('; ')}`);
    }

    if (opts.dryRun) {
      console.log(`${LOG} dry run — ${subject} (${pdf.length} byte PDF)`);
      return {
        success: true, dryRun: true, subject, to, date: report.date,
        failures: report.failures,
        notes: report.notes,
        attachment: { filename, bytes: pdf.length },
        figures: report.raw,
      };
    }

    const info = await mailer.sendMail({
      to,
      cc: config.cc.length ? config.cc : undefined,
      subject,
      html,
      text,
      attachments: [{ filename, content: pdf, contentType: 'application/pdf' }],
    });

    console.log(`${LOG} sent "${subject}" to ${info.accepted.join(', ')}`);

    return {
      success: true, subject, to, date: report.date,
      failures: report.failures,
      notes: report.notes,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      attachment: { filename, bytes: pdf.length },
      figures: report.raw,
    };
  } catch (error) {
    // A failed report must never take the API process down with it.
    console.error(`${LOG} failed:`, error.message);
    return { success: false, message: error.message };
  }
}

module.exports = { sendAdminReport };
