// Generic run loop: detect restores, load, decide, (in live mode) expire, record.

const config = require('./config');
const { decide } = require('./engine');
const { KINDS } = require('./sources');
const { AutoExpireSettings, AutoExpireRun, AutoExpireLog } = require('./AutoExpireModel');

const LOG = '[AutoExpire]';
let running = false;

async function effectiveMode() {
  const saved = await AutoExpireSettings.findById('settings').lean().catch(() => null);
  return saved && saved.mode ? saved.mode : config.mode;
}

async function saveMode(mode, by) {
  await AutoExpireSettings.updateOne(
    { _id: 'settings' },
    { $set: { mode: config.modeOf(mode), updatedBy: String(by || '') } },
    { upsert: true }
  );
  return effectiveMode();
}

/**
 * A record this job expired that is live again was restored by an admin. Its
 * new period starts from when we first notice that, so it is not re-expired
 * the next night. Returns key -> restore time for every restored record.
 */
async function restoredMap(k, now, write) {
  const map = new Map();
  const note = (key, t) => { if (!map.has(key) || map.get(key) < t) map.set(key, t); };

  const seen = await AutoExpireLog.find({ kind: k.kind, restoredSeenAt: { $ne: null } }, { key: 1, restoredSeenAt: 1 }).lean();
  seen.forEach((l) => note(l.key, new Date(l.restoredSeenAt).getTime()));

  const open = await AutoExpireLog.find({ kind: k.kind, restoredSeenAt: null }, { key: 1, recordId: 1 }).lean();
  if (open.length) {
    const docs = await k.currentStatus(open.map((l) => l.recordId).filter(Boolean));
    const liveSet = new Set(k.liveStatuses(config));
    const back = new Set(docs.filter((d) => liveSet.has(k.statusOf(d))).map((d) => String(d._id)));
    const restored = open.filter((l) => back.has(String(l.recordId)));
    // A dry run only notes it in memory; the live run writes it down.
    if (restored.length && write) {
      await AutoExpireLog.updateMany({ _id: { $in: restored.map((l) => l._id) } }, { $set: { restoredSeenAt: now } });
    }
    restored.forEach((l) => note(l.key, now.getTime()));
  }
  return map;
}

const itemOf = (rec, d) => ({
  key: rec.key,
  status: rec.status,
  rule: rec.rule,
  days: rec.days,
  createdAt: rec.createdAt,
  clockStart: d.clockStart,
  dueAt: d.dueAt,
  ageDays: d.ageDays,
});

/**
 * @param {object} opts
 * @param {'dry-run'|'live'} opts.mode
 * @param {string} opts.trigger    'cron' | 'manual' | 'cli' | 'preview'
 * @param {boolean} [opts.save]    record the run in auto_expire_runs (default: not for previews)
 * @param {boolean} [opts.items]   return every due item, not just the sample
 */
async function run({ mode, trigger, save = trigger !== 'preview', items = false, sampleSize = 50, now = new Date() } = {}) {
  if (running) throw new Error('a run is already in progress');
  running = true;
  const live = mode === 'live';
  const startedAt = new Date();
  const report = {
    mode: live ? 'live' : 'dry-run',
    trigger,
    startedAt,
    rules: { days: config.days, propertyStatuses: config.propertyStatuses, assistanceStatuses: config.assistanceStatuses, protectFeatured: config.protectFeatured, maxPerRun: config.maxPerRun },
    summary: {},
    sample: {},
  };
  if (items) report.items = {};

  const runDoc = save ? await AutoExpireRun.create({ mode: report.mode, trigger, startedAt, rules: report.rules }) : null;

  try {
    for (const k of KINDS) {
      const restoredAt = await restoredMap(k, now, live);
      const recs = await k.load(config, restoredAt);

      const s = { scanned: recs.length, fresh: 0, protected: {}, unknown: 0, due: 0, dueByRule: {}, dueByStatus: {}, expired: 0, changedMidRun: 0, capped: 0, restoredTracked: restoredAt.size };
      const due = [];
      for (const rec of recs) {
        const d = decide(rec, now.getTime());
        if (d.state === 'fresh') s.fresh += 1;
        else if (d.state === 'unknown') s.unknown += 1;
        else if (d.state === 'protected') s.protected[d.protectedBy] = (s.protected[d.protectedBy] || 0) + 1;
        else {
          due.push({ rec, d });
          s.due += 1;
          s.dueByRule[rec.rule] = (s.dueByRule[rec.rule] || 0) + 1;
          s.dueByStatus[rec.status] = (s.dueByStatus[rec.status] || 0) + 1;
        }
      }

      // Oldest first, so a capped run retires the stalest records.
      due.sort((a, b) => a.d.dueAt - b.d.dueAt);
      const batch = due.slice(0, config.maxPerRun);
      s.capped = due.length - batch.length;

      if (live) {
        for (const { rec, d } of batch) {
          const ok = await k.expire(rec, d, config, now);
          if (!ok) { s.changedMidRun += 1; continue; }
          s.expired += 1;
          await AutoExpireLog.create({
            kind: rec.kind, key: rec.key, recordId: rec.recordId, rule: rec.rule, days: rec.days,
            previousStatus: rec.status, clockStart: d.clockStart, dueAt: d.dueAt, expiredAt: now,
            runId: runDoc ? runDoc._id : undefined,
          });
        }
      }

      report.summary[k.kind] = s;
      report.sample[k.kind] = batch.slice(0, sampleSize).map(({ rec, d }) => itemOf(rec, d));
      if (items) report.items[k.kind] = due.map(({ rec, d }) => itemOf(rec, d));
    }

    report.finishedAt = new Date();
    report.ok = true;
    if (runDoc) {
      await AutoExpireRun.updateOne({ _id: runDoc._id }, { $set: { finishedAt: report.finishedAt, ok: true, summary: report.summary, sample: report.sample } });
      report.runId = runDoc._id;
    }
    const line = KINDS.map((k) => {
      const s = report.summary[k.kind];
      return `${k.kind}: ${live ? `${s.expired} expired` : `${s.due} would expire`} of ${s.scanned}`;
    }).join(', ');
    console.log(`${LOG} ${report.mode} run (${trigger}) — ${line}`);
    return report;
  } catch (err) {
    if (runDoc) await AutoExpireRun.updateOne({ _id: runDoc._id }, { $set: { finishedAt: new Date(), ok: false, error: err.message, summary: report.summary } });
    throw err;
  } finally {
    running = false;
  }
}

const isRunning = () => running;

module.exports = { run, effectiveMode, saveMode, isRunning };
