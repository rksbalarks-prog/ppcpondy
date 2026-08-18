// Builds the numbers behind the e-mailed "Data Added" report.
//
// Per-month property totals for one calendar year, split staff-added vs
// user-added, plus the year KPIs and an "Added By" breakdown.
//
// Unlike Rent Pondy — where this mirrors an admin screen at
// /process/dashboard/data-added — the Pondy Properties admin panel has no
// Data Added page. This file is therefore the ONLY definition of these
// figures: there is no screen to keep in step with, and equally no screen to
// cross-check the mail against. If a Data Added page is added later, point it
// at these same $match / $group shapes.

const AddModel = require('../AddModel');
const { runWithBase } = require('../utils/baseScope');

// India has no DST, so a fixed offset keeps the range query index-friendly.
const TZ = '+05:30';
const TZ_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** UTC range covering one whole IST calendar year. */
const istYearRange = (year) => ({
  $gte: new Date(Date.UTC(year, 0, 1) - TZ_OFFSET_MS),
  $lt: new Date(Date.UTC(year + 1, 0, 1) - TZ_OFFSET_MS),
});

/**
 * Gather the year's Data Added report.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.year]         calendar year (IST). Defaults to now.
 * @param {string}  [opts.base]         'ALL' | 'PY' | 'CH' city scope.
 * @param {boolean} [opts.hideDeleted]  drop soft-deleted rows from the counts.
 * @returns {Promise<object>} months[], totals, best month and staff[]
 */
async function buildYearReport({ year, base = 'ALL', hideDeleted = false } = {}) {
  const targetYear = Number(year) || new Date().getFullYear();

  const match = { createdAt: istYearRange(targetYear) };
  if (hideDeleted) {
    match.isDeleted = { $ne: true };
    match.status = { $ne: 'delete' };
  }

  // A record counts as "staff added" when it carries a non-empty addedBy name;
  // everything else was posted by the owner from the user app.
  const staffCond = {
    $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$addedBy', ''] } }, 0] }, 1, 0] },
  };

  // cityScopePlugin reads the base off AsyncLocalStorage, exactly as it does
  // for a request — so 'PY'/'CH' scope the aggregation and 'ALL' leaves it open.
  const [monthRows, staffRows] = await runWithBase(base, () =>
    Promise.all([
      AddModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $month: { date: '$createdAt', timezone: TZ } },
            count: { $sum: 1 },
            staff: staffCond,
          },
        },
      ]),
      AddModel.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$addedBy', ''] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ])
  );

  const byMonth = new Map(monthRows.map((r) => [r._id, r]));
  const months = MONTH_LABELS.map((label, i) => {
    const row = byMonth.get(i + 1);
    const count = row?.count || 0;
    const staff = row?.staff || 0;
    return { month: i + 1, label, short: label.slice(0, 3), count, staff, user: count - staff };
  });

  const total = months.reduce((sum, m) => sum + m.count, 0);
  const staffTotal = months.reduce((sum, m) => sum + m.staff, 0);

  // Highest month of the year; null while the year is still empty.
  const best = months.reduce((top, m) => (m.count > (top?.count || 0) ? m : top), null);

  return {
    year: targetYear,
    months,
    total,
    staffTotal,
    userTotal: total - staffTotal,
    best: best && best.count > 0 ? best : null,
    staff: staffRows.map((r) => ({
      name: String(r._id || '').trim() || 'Not Set (User Added)',
      count: r.count,
    })),
  };
}

module.exports = { buildYearReport, MONTH_LABELS };
