// The year summary as a spreadsheet.
//
// Sheet 1 is the month-by-month table with a trailing TOTAL row; sheet 2 is the
// "Added By" breakdown, so the recipient can see who entered what without
// needing a screen to click through.

const XLSX = require('xlsx');

/**
 * @param {object} report  the object returned by buildYearReport()
 * @returns {{ filename: string, buffer: Buffer }}
 */
function buildYearWorkbook(report) {
  const { year, months, total, staffTotal, userTotal, staff } = report;

  const summarySheet = XLSX.utils.json_to_sheet([
    ...months.map((m) => ({
      Month: `${m.label} ${year}`,
      'Total Added': m.count,
      'Staff Added': m.staff,
      'User Added': m.user,
    })),
    {
      Month: `TOTAL ${year}`,
      'Total Added': total,
      'Staff Added': staffTotal,
      'User Added': userTotal,
    },
  ]);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

  const staffSheet = XLSX.utils.json_to_sheet(
    staff.length
      ? staff.map((s, i) => ({ 'S.No': i + 1, 'Added By': s.name, Records: s.count }))
      : [{ 'S.No': '', 'Added By': 'No records in this year', Records: 0 }]
  );
  staffSheet['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 12 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, summarySheet, `Data Added ${year}`);
  XLSX.utils.book_append_sheet(book, staffSheet, 'Added By');

  return {
    filename: `PondyProperties_DataAdded_${year}.xlsx`,
    buffer: XLSX.write(book, { bookType: 'xlsx', type: 'buffer' }),
  };
}

module.exports = { buildYearWorkbook };
