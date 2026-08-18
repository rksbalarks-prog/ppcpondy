// Turns the fetched sheets into an .xlsx workbook.
//
// Sheet 1 is a Summary so the recipient can see the shape of the file before
// opening six tabs; the rest are the raw rows, one tab each.

const XLSX = require('xlsx');

// Excel rejects sheet names over 31 chars or containing : \ / ? * [ ]
const safeName = (name) => String(name).replace(/[:\\/?*[\]]/g, '-').slice(0, 31);

/** Column widths sized to the header plus a sample of the data. */
function widths(columns, rows) {
  return columns.map((col, i) => {
    const longest = rows.slice(0, 500).reduce(
      (max, r) => Math.max(max, String(r[i] ?? '').length),
      String(col).length
    );
    return { wch: Math.min(Math.max(longest + 2, 10), 42) };
  });
}

/**
 * @param {object} detail  from fetchAdminDetail()
 * @returns {{filename: string, buffer: Buffer}}
 */
function buildDetailWorkbook(detail) {
  const book = XLSX.utils.book_new();

  // ── Summary ───────────────────────────────────────────────────────────────
  const summaryRows = [
    ['Pondy Properties — Admin Detail Report'],
    [],
    ['Yesterday', detail.date],
    ['Month', detail.monthLabel],
    ['Generated', new Date(detail.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
    ['City base', 'All Cities'],
    [],
    ['SHEET', 'ROWS', 'WHAT IT COVERS'],
    ['Yesterday Actions', detail.summary.actions, `Every action on ${detail.date}, with the phone that did it`],
    ['Yesterday Login', detail.summary.logins, `Users who logged in on ${detail.date}`],
    ['Unreported-Unconverted', detail.summary.backlog,
      `${detail.summary.unreported} unreported · ${detail.summary.unconverted} conversion pending (all time)`],
    ['Payments', detail.summary.payments, 'Outstanding property + buyer payments'],
    [`Followups ${detail.monthLabel}`, detail.summary.followups, `Follow-ups DUE in ${detail.monthLabel} (not all time)`],
    [`Bills ${detail.monthLabel}`, detail.summary.bills,
      `Bills raised in ${detail.monthLabel} — net total ${detail.summary.billAmountMonth.toLocaleString('en-IN')}`],
  ];
  if (detail.failures.length) {
    summaryRows.push([], ['WARNING', `${detail.failures.length} endpoint(s) did not respond — those sheets may be short:`]);
    detail.failures.forEach((f) => summaryRows.push(['', f]));
  }

  const summary = XLSX.utils.aoa_to_sheet(summaryRows);
  summary['!cols'] = [{ wch: 26 }, { wch: 14 }, { wch: 72 }];
  XLSX.utils.book_append_sheet(book, summary, 'Summary');

  // ── One tab per data sheet ────────────────────────────────────────────────
  detail.sheets.forEach((sheet) => {
    const aoa = [
      [sheet.title],
      [],
      sheet.columns,
      ...(sheet.rows.length ? sheet.rows : [['(no rows)']]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = widths(sheet.columns, sheet.rows);
    // Freeze the header row so long sheets stay readable while scrolling.
    ws['!freeze'] = { xSplit: 0, ySplit: 3 };
    if (sheet.rows.length) {
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range(
          { r: 2, c: 0 },
          { r: 2 + sheet.rows.length, c: sheet.columns.length - 1 }
        ),
      };
    }
    XLSX.utils.book_append_sheet(book, ws, safeName(sheet.name));
  });

  const stamp = detail.date.replace(/-/g, '');
  return {
    filename: `PondyProperties_Admin_Detail_${stamp}.xlsx`,
    buffer: XLSX.write(book, { bookType: 'xlsx', type: 'buffer' }),
  };
}

module.exports = { buildDetailWorkbook };
