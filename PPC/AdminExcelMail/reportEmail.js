// Covering e-mail for the Admin Detail workbook.
//
// The spreadsheet is the deliverable; the body is a contents page so the
// recipient knows what is inside without opening it.

const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const BRAND = '#0d6efd';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const num = (n) => Number(n || 0).toLocaleString('en-IN');

const istStamp = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(date);

function renderDetailEmail(detail, { attachmentName } = {}) {
  const s = detail.summary;
  const subject = `Pondy Properties · Admin Detail ${detail.date} — ${num(s.actions)} actions, ${num(s.logins)} logins (Excel)`;

  const rows = [
    ['Yesterday Actions', s.actions, `every action on ${detail.date}, with phone numbers`],
    ['Yesterday Login', s.logins, `who logged in on ${detail.date}`],
    ['Unreported-Unconverted', s.backlog, `${num(s.unreported)} unreported · ${num(s.unconverted)} conversion pending`],
    ['Payments', s.payments, 'outstanding property + buyer payments'],
    [`Followups ${detail.monthLabel}`, s.followups, `due in ${detail.monthLabel} — monthly, not all-time`],
    [`Bills ${detail.monthLabel}`, s.bills, `raised in ${detail.monthLabel} — net ₹${num(s.billAmountMonth)}`],
  ].map((r, i) => `
    <tr style="background:${i % 2 ? '#fafbfc' : '#ffffff'};">
      <td style="padding:7px 10px;border-bottom:1px solid ${LINE};font-size:12.5px;color:${INK};font-weight:600;">${esc(r[0])}</td>
      <td align="right" style="padding:7px 10px;border-bottom:1px solid ${LINE};font-size:12.5px;color:${INK};">${num(r[1])}</td>
      <td style="padding:7px 10px;border-bottom:1px solid ${LINE};font-size:12px;color:${MUTED};">${esc(r[2])}</td>
    </tr>`).join('');

  const warning = detail.failures.length
    ? `<tr><td style="padding:8px 24px;">
         <div style="background:#fff8e6;border-left:4px solid #fd7e14;padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#7c4a03;">
           <strong>${detail.failures.length} endpoint(s) did not respond</strong> — the affected sheets may be short.<br>
           ${detail.failures.map((f) => esc(f)).join('<br>')}
         </div></td></tr>`
    : '';

  const html = `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f3f6;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="width:640px;max-width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
      <tr><td style="padding:20px 24px;border-bottom:1px solid ${LINE};font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:19px;font-weight:700;color:${BRAND};">Pondy Properties · Admin Detail Report</div>
        <div style="font-size:12px;color:${MUTED};padding-top:5px;">
          Yesterday ${esc(detail.date)} · month ${esc(detail.monthLabel)} · All Cities · generated ${esc(istStamp(detail.generatedAt))} IST
        </div>
      </td></tr>
      ${warning}
      <tr><td style="padding:14px 24px 6px;font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:700;color:${INK};">
        What's in the spreadsheet
      </td></tr>
      <tr><td style="padding:0 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${LINE};border-radius:6px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <th align="left" style="padding:8px 10px;background:#212529;color:#fff;font-size:11px;text-transform:uppercase;">Sheet</th>
            <th align="right" style="padding:8px 10px;background:#212529;color:#fff;font-size:11px;text-transform:uppercase;">Rows</th>
            <th align="left" style="padding:8px 10px;background:#212529;color:#fff;font-size:11px;text-transform:uppercase;">Covers</th>
          </tr>
          ${rows}
        </table>
      </td></tr>
      <tr><td style="padding:12px 24px 20px;border-top:1px solid ${LINE};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};line-height:1.6;">
        ${attachmentName ? `📎 <strong>${esc(attachmentName)}</strong> — every sheet has a frozen header row and filters switched on.<br>` : ''}
        Follow-ups and Bills are <strong>this month only</strong>, by request. The counts-only PDF arrives separately.<br>
        This file contains customer phone numbers — please handle it accordingly.
      </td></tr>
    </table>
  </td></tr>
</table>`;

  const text = [
    'PONDY PROPERTIES — ADMIN DETAIL REPORT',
    `Yesterday ${detail.date} · month ${detail.monthLabel} · All Cities`,
    `Generated ${istStamp(detail.generatedAt)} IST`,
    ...(detail.failures.length ? ['', `WARNING: ${detail.failures.length} endpoint(s) did not respond:`, ...detail.failures.map((f) => `  - ${f}`)] : []),
    '',
    'SHEETS',
    ...[
      ['Yesterday Actions', s.actions],
      ['Yesterday Login', s.logins],
      ['Unreported-Unconverted', s.backlog],
      ['Payments', s.payments],
      [`Followups ${detail.monthLabel}`, s.followups],
      [`Bills ${detail.monthLabel}`, s.bills],
    ].map(([n, c]) => `  ${String(n).padEnd(26)} ${num(c)} rows`),
    '',
    `Bills net total (${detail.monthLabel}): ${num(s.billAmountMonth)}`,
    attachmentName ? `Attached: ${attachmentName}` : '',
    'Contains customer phone numbers — handle accordingly.',
  ].join('\n');

  return { subject, html, text };
}

module.exports = { renderDetailEmail };
