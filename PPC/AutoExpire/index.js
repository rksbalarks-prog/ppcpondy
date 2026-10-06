// Nightly auto-expire (Pondy Properties) — entry point.
//
//   Properties          Adexpress imports 90 days, everything else 180 days
//   Buyer Assistance    180 days
//
// counted from the later of the upload date and the latest bill / payment /
// restore, skipping anything whose paid plan is still running. Starts in
// DRY-RUN mode: it reports, and changes nothing, until switched to live.
//
// Wiring, in server.js:
//     const autoExpire = require('./AutoExpire');
//     app.use('/PPC', autoExpire.router);   // before SingleSendRouter
//     autoExpire.start();                   // inside app.listen

const cron = require('node-cron');

const config = require('./config');
const runner = require('./runner');
const state = require('./state');
const router = require('./AutoExpireRouter');

const LOG = '[AutoExpire]';
let task = null;

function cronIsValid(expression) {
  try {
    return typeof cron.validate === 'function' ? cron.validate(expression) : true;
  } catch {
    return false;
  }
}

async function nightly() {
  try {
    const mode = await runner.effectiveMode();
    if (mode === 'off') {
      console.log(`${LOG} mode is off — skipped`);
      return;
    }
    const report = await runner.run({ mode, trigger: 'cron' });
    const brief = Object.fromEntries(
      Object.entries(report.summary).map(([kind, s]) => [kind, mode === 'live' ? s.expired : s.due])
    );
    state.ran({ mode, ...brief });
  } catch (err) {
    state.failed(err);
    console.error(`${LOG} nightly run failed:`, err.message);
  }
}

function start() {
  if (task) return { started: true, already: true };
  if (!cronIsValid(config.cron)) {
    console.error(`${LOG} invalid AUTO_EXPIRE_CRON "${config.cron}" — not armed`);
    return { started: false };
  }
  task = cron.schedule(config.cron, nightly, { timezone: config.timezone });
  state.armed({ cron: config.cron, timezone: config.timezone });
  console.log(
    `${LOG} armed — "${config.cron}" ${config.timezone}, .env mode ${config.mode} ` +
      `(general ${config.days.general}d, adex ${config.days.adex}d, buyer assistance ${config.days.assistance}d)`
  );
  return { started: true, cron: config.cron, timezone: config.timezone };
}

function stop() {
  if (task) task.stop();
  task = null;
}

module.exports = { start, stop, router, run: runner.run };
