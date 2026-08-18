// Daily Admin Detail (Excel) e-mail — entry point.
//
// A SEPARATE mail from the admin-report PDF: that one carries counts, this one
// carries the rows behind them, phone numbers included.
//
// Wiring, in server.js:
//     const adminExcelMail = require('./AdminExcelMail');
//     app.use('/PPC', adminExcelMail.router);
//     adminExcelMail.start();

const cron = require('node-cron');

const mailer = require('../DataAddedMail/mailer');
const config = require('./config');
const state = require('./state');
const router = require('./AdminExcelMailRouter');
const { sendDetailReport } = require('./sendDetailReport');

const LOG = '[AdminExcelMail]';

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
    console.log(`${LOG} disabled (ADMIN_EXCEL_MAIL_ENABLED=0)`);
    return { started: false, reason: 'disabled' };
  }
  if (!mailer.isConfigured() || !config.to.length) {
    console.log(`${LOG} asleep — SMTP not configured.`);
    return { started: false, reason: 'not-configured' };
  }
  if (!cronIsValid(config.cron)) {
    console.error(`${LOG} invalid ADMIN_EXCEL_CRON "${config.cron}" — schedule not armed`);
    return { started: false, reason: 'invalid-cron' };
  }

  task = cron.schedule(
    config.cron,
    async () => {
      console.log(`${LOG} cron tick — building detail workbook`);
      const result = await sendDetailReport();
      state.record({ ...result, trigger: 'cron' });
    },
    { timezone: config.timezone }
  );

  state.armed({ cron: config.cron, timezone: config.timezone, recipients: config.to.length });
  console.log(`${LOG} armed — "${config.cron}" ${config.timezone}, ${config.to.length} recipient(s)`);

  return { started: true, cron: config.cron, timezone: config.timezone };
}

function stop() {
  if (task) { task.stop(); task = null; }
}

module.exports = { router, start, stop, sendDetailReport, config };
