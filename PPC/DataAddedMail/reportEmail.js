// Renders the report as an e-mail: subject, HTML body and a plain-text twin.
//
// Mail clients (Gmail in particular) strip <style> blocks, flexbox and grid, so
// the layout here is deliberately old-school: nested tables, inline styles,
// 640px max width. Four KPI tiles with coloured left edges, then the month grid.

const IST = 'Asia/Kolkata';

const PALETTE = {
  ink: '#1f2937',
  muted: '#6b7280',
  line: '#e5e7eb',
  page: '#f1f3f6',
  brand: '#0d6efd',
  purple: '#6f42c1',
  green: '#198754',
  blue: '#0aa2c0',
  orange: '#fd7e14',
};

const num = (n) => Number(n || 0).toLocaleString('en-IN');

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** "12 Aug 2026, 09:00 AM" in IST, whatever the server clock is set to. */
const istStamp = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

/** The IST month (1-12) and year at the given instant. */
const istMonthYear = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { month: get('month'), year: get('year') };
};

// ── Building blocks ───────────────────────────────────────────────────────────

const kpiTile = (label, value, sub, colour) => `
  <td width="50%" style="padding:6px;" valign="top">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="border:1px solid ${PALETTE.line};border-left:4px solid ${colour};border-radius:8px;background:#ffffff;">
      <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:${PALETTE.muted};">${esc(label)}</div>
        <div style="font-size:26px;font-weight:700;color:${PALETTE.ink};padding:2px 0 1px;">${esc(value)}</div>
        <div style="font-size:12px;color:${PALETTE.muted};">${esc(sub)}</div>
      </td></tr>
    </table>
  </td>`;

const monthRow = (m, year, highlight) => {
  const bg = highlight ? '#fff8e6' : m.month % 2 ? '#ffffff' : '#fafbfc';
  const weight = highlight ? '700' : '400';
  const cell = `padding:9px 12px;border-bottom:1px solid ${PALETTE.line};font-size:13px;color:${PALETTE.ink};font-weight:${weight};`;
  return `
    <tr style="background:${bg};">
      <td style="${cell}">${esc(m.label)} ${year}${highlight ? ' <span style="color:' + PALETTE.orange + ';font-size:11px;">◀ last month</span>' : ''}</td>
      <td align="right" style="${cell}">${num(m.count)}</td>
      <td align="right" style="${cell}color:${PALETTE.green};">${num(m.staff)}</td>
      <td align="right" style="${cell}color:${PALETTE.brand};">${num(m.user)}</td>
    </tr>`;
};

const staffRow = (s, i) => {
  const cell = `padding:8px 12px;border-bottom:1px solid ${PALETTE.line};font-size:13px;color:${PALETTE.ink};`;
  return `
    <tr style="background:${i % 2 ? '#fafbfc' : '#ffffff'};">
      <td style="${cell}">${esc(s.name)}</td>
      <td align="right" style="${cell}font-weight:600;">${num(s.count)}</td>
    </tr>`;
};

const headCell = (text, align = 'left') =>
  `<th align="${align}" style="padding:9px 12px;background:${PALETTE.ink};color:#ffffff;font-size:11px;letter-spacing:.5px;text-transform:uppercase;font-weight:600;">${esc(text)}</th>`;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @param {object} report      from buildYearReport()
 * @param {object} [opts]
 * @param {string} [opts.baseLabel]   'All Cities' | 'Pondicherry' | 'Chennai'
 * @param {Date}   [opts.now]         send instant (injectable for tests)
 * @param {string} [opts.attachmentName]
 * @returns {{ subject: string, html: string, text: string }}
 */
function renderReportEmail(report, { baseLabel = 'All Cities', now = new Date(), attachmentName } = {}) {
  const { year, months, total, staffTotal, userTotal, best, staff } = report;

  // Sent on the 1st, the interesting number is the month that just closed.
  // Highlight it only when it actually falls inside the reported year.
  const here = istMonthYear(now);
  const prevMonth = here.month === 1 ? 12 : here.month - 1;
  const prevYear = here.month === 1 ? here.year - 1 : here.year;
  const focus = prevYear === year ? months.find((m) => m.month === prevMonth) : null;

  const stamp = istStamp(now);
  const subject = `Pondy Properties · Data Added ${year} — ${num(total)} records${focus ? ` (${focus.label}: ${num(focus.count)})` : ''}`;

  // Only months that have data are worth printing; an empty year still shows
  // the table header rather than a blank panel.
  const shown = months.filter((m) => m.count > 0);
  const rows = (shown.length ? shown : months.slice(0, here.month))
    .map((m) => monthRow(m, year, focus && m.month === focus.month))
    .join('');

  const html = `<!-- Data Added report -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PALETTE.page};margin:0;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="width:640px;max-width:100%;background:#ffffff;border:1px solid ${PALETTE.line};border-radius:12px;overflow:hidden;">

      <tr><td style="padding:20px 24px;border-bottom:1px solid ${PALETTE.line};font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:19px;font-weight:700;color:${PALETTE.brand};">Pondy Properties | Admin Panel</div>
        <div style="font-size:14px;color:${PALETTE.ink};padding-top:4px;">📅 <strong>Data Added</strong> — year summary ${esc(String(year))}</div>
        <div style="font-size:12px;color:${PALETTE.muted};padding-top:4px;">${esc(baseLabel)} · generated ${esc(stamp)} IST</div>
      </td></tr>

      <tr><td style="padding:12px 18px 4px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            ${kpiTile(`Total added in ${year}`, num(total), baseLabel, PALETTE.purple)}
            ${kpiTile('Added by staff', num(staffTotal), 'has an "Added By" name', PALETTE.green)}
          </tr>
          <tr>
            ${kpiTile('Added by user', num(userTotal), 'posted from the user app', PALETTE.blue)}
            ${kpiTile('Best month', best ? best.label : '—', best ? `${num(best.count)} records` : 'no data yet', PALETTE.orange)}
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:14px 24px 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${PALETTE.ink};">
        Month by month
      </td></tr>
      <tr><td style="padding:0 24px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${PALETTE.line};border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>${headCell('Month')}${headCell('Total', 'right')}${headCell('Staff', 'right')}${headCell('User', 'right')}</tr>
          ${rows}
          <tr style="background:#f3f4f6;">
            <td style="padding:10px 12px;font-size:13px;font-weight:700;color:${PALETTE.ink};">TOTAL ${esc(String(year))}</td>
            <td align="right" style="padding:10px 12px;font-size:13px;font-weight:700;color:${PALETTE.ink};">${num(total)}</td>
            <td align="right" style="padding:10px 12px;font-size:13px;font-weight:700;color:${PALETTE.green};">${num(staffTotal)}</td>
            <td align="right" style="padding:10px 12px;font-size:13px;font-weight:700;color:${PALETTE.brand};">${num(userTotal)}</td>
          </tr>
        </table>
      </td></tr>

      ${
        staff.length
          ? `<tr><td style="padding:2px 24px 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${PALETTE.ink};">Added by</td></tr>
      <tr><td style="padding:0 24px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${PALETTE.line};border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>${headCell('Name')}${headCell('Records', 'right')}</tr>
          ${staff.map(staffRow).join('')}
        </table>
      </td></tr>`
          : ''
      }

      <tr><td style="padding:14px 24px 20px;border-top:1px solid ${PALETTE.line};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${PALETTE.muted};line-height:1.6;">
        ${attachmentName ? `📎 The full year summary is attached as <strong>${esc(attachmentName)}</strong>.<br>` : ''}
        Automated report from the Pondy Properties admin panel —
        <a href="https://ppcpondy.com/process/dashboard" style="color:${PALETTE.brand};">ppcpondy.com/process/dashboard</a>.
      </td></tr>

    </table>
  </td></tr>
</table>`;

  const textRows = (shown.length ? shown : []).map(
    (m) => `  ${(m.label + ' ' + year).padEnd(18)} total ${String(m.count).padStart(5)}   staff ${String(m.staff).padStart(5)}   user ${String(m.user).padStart(5)}`
  );

  const text = [
    `PONDY PROPERTIES — DATA ADDED ${year} (${baseLabel})`,
    `Generated ${stamp} IST`,
    '',
    `Total added in ${year} : ${num(total)}`,
    `Added by staff       : ${num(staffTotal)}`,
    `Added by user        : ${num(userTotal)}`,
    `Best month           : ${best ? `${best.label} (${num(best.count)})` : '—'}`,
    '',
    'MONTH BY MONTH',
    ...(textRows.length ? textRows : ['  (no records yet)']),
    `  ${('TOTAL ' + year).padEnd(18)} total ${String(total).padStart(5)}   staff ${String(staffTotal).padStart(5)}   user ${String(userTotal).padStart(5)}`,
    '',
    ...(staff.length ? ['ADDED BY', ...staff.map((s) => `  ${s.name} — ${num(s.count)}`), ''] : []),
    attachmentName ? `Attached: ${attachmentName}` : '',
    'https://ppcpondy.com/process/dashboard',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  return { subject, html, text };
}

module.exports = { renderReportEmail };
