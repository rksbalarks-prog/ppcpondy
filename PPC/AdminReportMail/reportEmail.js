// Covering e-mail for the admin report PDF.
//
// The PDF is the deliverable; the body is a readable summary so the headline
// figures are visible on a phone without opening the attachment. Table-based
// inline-styled HTML, same constraints as DataAddedMail/reportEmail.js.

const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const BRAND = '#0d6efd';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Counts arrive as plain numbers; accept a pre-grouped string too rather than
// turning "1,23,456" into NaN.
const num = (n) => {
  if (typeof n === 'number') return n.toLocaleString('en-IN');
  const parsed = Number(String(n ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-IN') : String(n ?? '');
};

const istStamp = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(date);

/**
 * Every non-header row of a section as {label, values[]}. Sections carry one
 * value column today, but values is kept as an array so an amount column can
 * be added without touching the renderer.
 */
const dataRows = (section) =>
  section.rows.flatMap((r) => {
    if (Array.isArray(r)) return [{ label: r[1], values: r.slice(2), total: false }];
    if (r.total) return [{ label: r.total[0], values: r.total.slice(1), total: true }];
    return [];
  });

const sectionBlock = (section) => {
  const rows = dataRows(section);
  const cells = rows.map((r, i) => {
    const bg = r.total ? '#fff3cd' : i % 2 ? '#fafbfc' : '#ffffff';
    const weight = r.total ? '700' : '400';
    const values = r.values.map((v) => `
      <td align="right" style="padding:6px 10px;border-bottom:1px solid ${LINE};font-size:12.5px;font-weight:${r.total ? '700' : '600'};color:${INK};white-space:nowrap;">
        ${esc(num(v))}
      </td>`).join('');
    return `
    <tr style="background:${bg};">
      <td style="padding:6px 10px;border-bottom:1px solid ${LINE};font-size:12.5px;color:${INK};font-weight:${weight};">${esc(r.label)}</td>
      ${values}
    </tr>`;
  }).join('');

  return `
  <tr><td style="padding:12px 24px 4px;font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:700;color:${INK};">
    ${esc(section.title)}
    <span style="font-weight:400;color:${MUTED};font-size:11.5px;"> — ${esc(section.subtitle)}</span>
  </td></tr>
  <tr><td style="padding:0 24px 6px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${LINE};border-radius:6px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
      ${cells}
    </table>
  </td></tr>`;
};

/**
 * @param {object} report  from fetchAdminReport()
 * @param {object} [opts]  { attachmentName }
 * @returns {{subject: string, html: string, text: string}}
 */
function renderAdminReportEmail(report, { attachmentName } = {}) {
  const actions = report.raw.actions;
  const totalActions = Object.values(actions).reduce((s, v) => s + v, 0);

  const subject = `Pondy Properties · Admin Report ${report.date} — ${num(report.raw.login.totalLogin)} logins, ${num(totalActions)} actions`;

  const warning = report.failures.length
    ? `<tr><td style="padding:8px 24px;">
         <div style="background:#fff8e6;border-left:4px solid #fd7e14;padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7c4a03;">
           <strong>${report.failures.length} endpoint(s) did not respond</strong> — some figures below may read low.<br>
           ${report.failures.map((f) => esc(f)).join('<br>')}
         </div></td></tr>`
    : '';

  const notes = report.notes && report.notes.length
    ? `<tr><td style="padding:4px 24px 8px;">
         <div style="background:#f8f9fa;border-left:4px solid #adb5bd;padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:${MUTED};line-height:1.55;">
           ${report.notes.map((n) => `• ${esc(n)}`).join('<br>')}
         </div></td></tr>`
    : '';

  const html = `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f3f6;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="width:640px;max-width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
      <tr><td style="padding:20px 24px;border-bottom:1px solid ${LINE};font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:19px;font-weight:700;color:${BRAND};">Pondy Properties | Admin Report</div>
        <div style="font-size:12px;color:${MUTED};padding-top:5px;">
          Data for ${esc(report.date)} · All Cities · generated ${esc(istStamp(report.generatedAt))} IST
        </div>
      </td></tr>
      ${warning}
      ${report.sections.map(sectionBlock).join('')}
      ${notes}
      <tr><td style="padding:14px 24px 20px;border-top:1px solid ${LINE};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};line-height:1.6;">
        ${attachmentName ? `📎 The full report is attached as <strong>${esc(attachmentName)}</strong>.<br>` : ''}
        Automated from the admin panel — live view at
        <a href="https://ppcpondy.com/process/dashboard/adminreport" style="color:${BRAND};">ppcpondy.com/process/dashboard/adminreport</a>.
      </td></tr>
    </table>
  </td></tr>
</table>`;

  const text = [
    'PONDY PROPERTIES | ADMIN REPORT',
    `Data for ${report.date} · All Cities · generated ${istStamp(report.generatedAt)} IST`,
    ...(report.failures.length
      ? ['', `WARNING: ${report.failures.length} endpoint(s) did not respond:`, ...report.failures.map((f) => `  - ${f}`)]
      : []),
    '',
    ...report.sections.flatMap((section) => [
      section.title.toUpperCase(),
      ...dataRows(section).map(
        (r) => `  ${String(r.label).padEnd(38)} ${r.values.map((v) => num(v)).join('   ')}`
      ),
      '',
    ]),
    ...(report.notes && report.notes.length ? ['NOTES', ...report.notes.map((n) => `  - ${n}`), ''] : []),
    attachmentName ? `Attached: ${attachmentName}` : '',
    'https://ppcpondy.com/process/dashboard/adminreport',
  ].join('\n');

  return { subject, html, text };
}

module.exports = { renderAdminReportEmail };
