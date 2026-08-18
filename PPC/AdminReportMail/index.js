// Daily e-mail of the Pondy Properties Admin Report as a PDF — entry point.
//
// Wiring, in server.js:
//     const adminReportMail = require('./AdminReportMail');
//     app.use('/PPC', adminReportMail.router);
//     adminReportMail.start();
//
// Additive and fail-soft: with no SMTP credentials it logs one line at boot and
// stays asleep. See README.md.

const cron = require('node-cron');

const mailer = require('../DataAddedMail/mailer');
const config = require('./config');
const state = require('./state');
const router = require('./AdminReportMailRouter');
const { sendAdminReport } = require('./sendAdminReport');

const LOG = '[AdminReportMail]';

let task = null;

function cronIsValid(expression) {
  try {
    return typeof cron.validate === 'function' ? cron.validate(expression) : true;
  } catch {
    return false;
  }
}

function start() {
  if (task) return { started: true, already: true };

  if (!config.enabled) {
    console.log(`${LOG} disabled (ADMIN_REPORT_MAIL_ENABLED=0) — no report will be sent`);
    return { started: false, reason: 'disabled' };
  }

  if (!mailer.isConfigured() || !config.to.length) {
    console.log(`${LOG} asleep — SMTP not configured. Fill SMTP_* in .env and restart.`);
    return { started: false, reason: 'not-configured' };
  }

  if (!cronIsValid(config.cron)) {
    console.error(`${LOG} invalid ADMIN_REPORT_CRON "${config.cron}" — schedule not armed`);
    return { started: false, reason: 'invalid-cron' };
  }

  task = cron.schedule(
    config.cron,
    async () => {
      console.log(`${LOG} cron tick — building yesterday's report`);
      const result = await sendAdminReport();
      state.record({ ...result, trigger: 'cron' });
    },
    { timezone: config.timezone }
  );

  state.armed({ cron: config.cron, timezone: config.timezone, recipients: config.to.length });
  console.log(`${LOG} armed — "${config.cron}" ${config.timezone}, ${config.to.length} recipient(s)`);

  return { started: true, cron: config.cron, timezone: config.timezone };
}

function stop() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { router, start, stop, sendAdminReport, config };
