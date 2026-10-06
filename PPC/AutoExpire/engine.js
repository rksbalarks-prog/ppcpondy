// The decision, kept pure (no DB) so it can be unit-tested and read in one go.
//
// A record arrives with:
//   createdAt   when it was first uploaded
//   clock[]     later dates that restart its period: a bill, a paid payment,
//               an admin restoring it from the Expired page
//   protect[]   paid cover that is still running, as { until, why }
//
//   clockStart     = the latest of createdAt and every clock date
//   dueAt          = clockStart + rule days
//   protectedUntil = the latest protect.until
//
//   now <  dueAt              -> 'fresh'      (keep)
//   now >= dueAt, paid cover  -> 'protected'  (keep: a paid plan is still running)
//   otherwise                 -> 'due'        (expire)

const DAY = 24 * 60 * 60 * 1000;

/** Milliseconds for a Date, an ISO string, a 'YYYY-MM-DD' string or a number; NaN if unreadable. */
function toMs(v) {
  if (v == null || v === '') return NaN;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  // Only trust unambiguous shapes. '07/02/2026' could be July or February,
  // and guessing wrong would move a listing's clock by months.
  if (!/^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(s)) return NaN;
  return new Date(s.replace(' ', 'T')).getTime();
}

const latest = (values) => values.filter(Number.isFinite).reduce((a, b) => Math.max(a, b), -Infinity);

function decide(rec, now = Date.now()) {
  const created = toMs(rec.createdAt);
  // A date in the future is bad data; let it count as "today", not as years of cover.
  const clockDates = (rec.clock || []).map((c) => Math.min(toMs(c.at), now));
  const clockStart = latest([created, ...clockDates]);

  if (!Number.isFinite(clockStart)) {
    return { state: 'unknown', reason: 'no readable created date' };
  }

  const dueAt = clockStart + rec.days * DAY;
  const ageDays = Math.floor((now - clockStart) / DAY);

  let protectedUntil = -Infinity;
  let protectedBy = null;
  for (const p of rec.protect || []) {
    const until = p.until === Infinity ? Infinity : toMs(p.until);
    if (!Number.isNaN(until) && until > protectedUntil) {
      protectedUntil = until;
      protectedBy = p.why;
    }
  }

  let state = 'due';
  if (now < dueAt) state = 'fresh';
  else if (protectedUntil > now) state = 'protected';

  return {
    state,
    clockStart: new Date(clockStart),
    dueAt: new Date(dueAt),
    ageDays,
    protectedUntil: protectedUntil === Infinity ? 'indefinite' : protectedUntil > -Infinity ? new Date(protectedUntil) : null,
    protectedBy: state === 'protected' ? protectedBy : null,
  };
}

module.exports = { DAY, toMs, decide };
