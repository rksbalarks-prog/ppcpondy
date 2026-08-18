// Orchestrator: endpoints → sheets → workbook → e-mail.

const mailer = require('../DataAddedMail/mailer');
const config = require('./config');
const { fetchAdminDetail } = require('./fetchDetail');
const { buildDetailWorkbook } = require('./buildWorkbook');
const { renderDetailEmail } = require('./reportEmail');

const LOG = '[AdminExcelMail]';

async function sendDetailReport(opts = {}) {
  const to = (opts.to && opts.to.length ? opts.to : config.to).filter(Boolean);

  if (!opts.dryRun && !mailer.isConfigured()) {
    const message = `SMTP not configured — missing ${mailer.missingSettings().join(', ')}`;
    console.warn(`${LOG} skipped: ${message}`);
    return { success: false, skipped: true, message };
  }
  if (!to.length) {
    const message = 'No recipient — set ADMIN_EXCEL_TO';
    console.warn(`${LOG} skipped: ${message}`);
    return { success: false, skipped: true, message };
  }

  try {
    const detail = await fetchAdminDetail();
    const excel = buildDetailWorkbook(detail);
    const { subject, html, text } = renderDetailEmail(detail, { attachmentName: excel.filename });

    if (detail.failures.length) {
      console.warn(`${LOG} ${detail.failures.length} endpoint(s) failed: ${detail.failures.join('; ')}`);
    }

    if (opts.dryRun) {
      console.log(`${LOG} dry run — ${subject} (${excel.buffer.length} byte xlsx)`);
      return {
        success: true, dryRun: true, subject, to,
        date: detail.date, monthLabel: detail.monthLabel,
        failures: detail.failures, summary: detail.summary,
        attachment: { filename: excel.filename, bytes: excel.buffer.length },
      };
    }

    const info = await mailer.sendMail({
      to,
      cc: config.cc.length ? config.cc : undefined,
      subject,
      html,
      text,
      attachments: [{
        filename: excel.filename,
        content: excel.buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }],
    });

    console.log(`${LOG} sent "${subject}" to ${info.accepted.join(', ')}`);

    return {
      success: true, subject, to,
      date: detail.date, monthLabel: detail.monthLabel,
      failures: detail.failures, summary: detail.summary,
      messageId: info.messageId, accepted: info.accepted, rejected: info.rejected,
      attachment: { filename: excel.filename, bytes: excel.buffer.length },
    };
  } catch (error) {
    console.error(`${LOG} failed:`, error.message);
    return { success: false, message: error.message };
  }
}

module.exports = { sendDetailReport };
