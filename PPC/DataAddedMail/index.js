// Scheduled "Data Added" e-mail report — entry point.
//
// Mails a year summary of properties added (month by month, staff vs user) to
// the configured recipients on a cron schedule, with the spreadsheet attached.
//
// Wiring, in server.js:
//     const dataAddedMail = require('./DataAddedMail');
//     app.use('/PPC', dataAddedMail.router);
//     dataAddedMail.start();
//
// The layer is additive and fail-soft: with no SMTP credentials in .env it
// logs one line at boot and stays asleep. See README.md for the settings.

const cron = require('node-cron');

const config = require('./config');
const mailer = require('./mailer');
const state = require('./state');
const router = require('./DataAddedMailRouter');
const { sendDataAddedReport } = require('./sendReport');

const LOG = '[DataAddedMail]';

let task = null;

/** node-cron rejects a bad expression by throwing; check before arming. */
function cronIsValid(expression) {
  try {
    return typeof cron.validate === 'function' ? cron.validate(expression) : true;
  } catch {
    return false;
  }
}

/**
 * Arm the schedule. Safe to call once at boot; repeat calls are ignored.
 * @returns {object} what it decided to do, for the boot log / tests.
 */
function start() {
  if (task) return { started: true, already: true };

  if (!config.enabled) {
    console.log(`${LOG} disabled (DATA_ADDED_REPORT_ENABLED=0) — no report will be sent`);
    return { started: false, reason: 'disabled' };
  }

  if (!mailer.isConfigured() || !config.to.length) {
    console.log(
      `${LOG} asleep — missing ${mailer.missingSettings().join(', ')}. ` +
        'Fill these in .env and restart to arm the schedule.'
    );
    return { started: false, reason: 'not-configured' };
  }

  if (!cronIsValid(config.cron)) {
    console.error(`${LOG} invalid DATA_ADDED_REPORT_CRON "${config.cron}" — schedule not armed`);
    return { started: false, reason: 'invalid-cron' };
  }

  task = cron.schedule(
    config.cron,
    async () => {
      console.log(`${LOG} cron tick — building ${new Date().getFullYear()} report`);
      const result = await sendDataAddedReport();
      state.record({ ...result, trigger: 'cron' });
    },
    { timezone: config.timezone }
  );

  state.armed({ cron: config.cron, timezone: config.timezone, recipients: config.to.length });
  console.log(
    `${LOG} armed — "${config.cron}" ${config.timezone}, ` +
      `${config.to.length} recipient(s), base ${config.base}`
  );

  return { started: true, cron: config.cron, timezone: config.timezone };
}

/** Stop the schedule (used by tests / graceful shutdown). */
function stop() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { router, start, stop, sendDataAddedReport, config };
