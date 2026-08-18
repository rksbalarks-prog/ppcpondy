// Orchestrator: numbers → workbook → e-mail → SMTP.
//
// Shared by the cron tick and the manual /data-added-mail/send-now trigger so
// a test send is exactly the mail the schedule will deliver.

const config = require('./config');
const mailer = require('./mailer');
const { buildYearReport } = require('./reportData');
const { buildYearWorkbook } = require('./reportExcel');
const { renderReportEmail } = require('./reportEmail');

const LOG = '[DataAddedMail]';

/**
 * Build and send one report.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.year]     defaults to the current IST year
 * @param {string}  [opts.base]     overrides DATA_ADDED_REPORT_BASE
 * @param {string[]}[opts.to]       overrides DATA_ADDED_REPORT_TO
 * @param {boolean} [opts.dryRun]   build everything, skip the SMTP send
 * @returns {Promise<object>} a small result summary (never throws for a
 *          configuration problem — check `success`)
 */
async function sendDataAddedReport(opts = {}) {
  const startedAt = new Date();
  const year = Number(opts.year) || startedAt.getFullYear();
  const base = String(opts.base || config.base).toUpperCase();
  const baseLabel =
    base === 'PY' ? 'Pondicherry' : base === 'CH' ? 'Chennai' : 'All Cities';
  const to = (opts.to && opts.to.length ? opts.to : config.to).filter(Boolean);

  if (!opts.dryRun && !mailer.isConfigured()) {
    const message = `SMTP not configured — missing ${mailer.missingSettings().join(', ')}`;
    console.warn(`${LOG} skipped: ${message}`);
    return { success: false, skipped: true, message };
  }
  if (!to.length) {
    const message = 'No recipient — set DATA_ADDED_REPORT_TO';
    console.warn(`${LOG} skipped: ${message}`);
    return { success: false, skipped: true, message };
  }

  try {
    const report = await buildYearReport({ year, base, hideDeleted: config.hideDeleted });
    const excel = buildYearWorkbook(report);
    const { subject, html, text } = renderReportEmail(report, {
      baseLabel,
      now: startedAt,
      attachmentName: excel.filename,
    });

    if (opts.dryRun) {
      console.log(`${LOG} dry run — ${subject} (${excel.buffer.length} byte attachment)`);
      return {
        success: true,
        dryRun: true,
        subject,
        to,
        year,
        base,
        total: report.total,
        staffTotal: report.staffTotal,
        userTotal: report.userTotal,
        attachment: { filename: excel.filename, bytes: excel.buffer.length },
      };
    }

    const info = await mailer.sendMail({
      to,
      cc: config.cc.length ? config.cc : undefined,
      bcc: config.bcc.length ? config.bcc : undefined,
      subject,
      html,
      text,
      attachments: [
        {
          filename: excel.filename,
          content: excel.buffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });

    console.log(
      `${LOG} sent "${subject}" to ${info.accepted.join(', ') || to.join(', ')}` +
        (info.rejected.length ? ` (rejected: ${info.rejected.join(', ')})` : '')
    );

    return {
      success: true,
      subject,
      to,
      year,
      base,
      total: report.total,
      staffTotal: report.staffTotal,
      userTotal: report.userTotal,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      attachment: { filename: excel.filename, bytes: excel.buffer.length },
    };
  } catch (error) {
    // A failed report must never take the API process down with it.
    console.error(`${LOG} failed:`, error.message);
    return { success: false, message: error.message };
  }
}

module.exports = { sendDataAddedReport };
