// Manual controls for the scheduled Data Added report.
//
//   GET  /PPC/data-added-mail/status
//        → whether the feature is armed, the cadence, and the last run result.
//          Safe to call publicly: it never echoes credentials, and the
//          recipient list is masked.
//
//   POST /PPC/data-added-mail/send-now?year=2026&dryRun=1
//        → build and send the report right now. Guarded by the shared secret
//          in DATA_ADDED_REPORT_TOKEN (header `x-report-token`, or ?token=).
//          Without that env var the route is disabled outright.
//
// Nothing here is required for the schedule to work — it exists so a send can
// be proved end-to-end without waiting for the 1st of the month.

const express = require('express');
const router = express.Router();

const config = require('./config');
const mailer = require('./mailer');
const { sendDataAddedReport } = require('./sendReport');
const state = require('./state');

/** "madhankumar7673@gmail.com" → "mad***@gmail.com". */
const maskEmail = (address) => {
  const [name, domain] = String(address).split('@');
  if (!domain) return '***';
  return `${name.slice(0, 3)}***@${domain}`;
};

/** Constant-time-ish compare so the token cannot be probed byte by byte. */
const tokenMatches = (supplied) => {
  const expected = config.triggerToken;
  if (!expected) return false;
  const a = String(supplied || '');
  if (a.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
};

router.get('/data-added-mail/status', (req, res) => {
  res.json({
    success: true,
    enabled: config.enabled,
    smtpConfigured: mailer.isConfigured(),
    missing: mailer.missingSettings(),
    cron: config.cron,
    timezone: config.timezone,
    base: config.base,
    hideDeleted: config.hideDeleted,
    recipients: config.to.map(maskEmail),
    manualTrigger: config.triggerToken ? 'enabled' : 'disabled (set DATA_ADDED_REPORT_TOKEN)',
    scheduler: state.get(),
  });
});

router.post('/data-added-mail/send-now', async (req, res) => {
  if (!config.triggerToken) {
    return res.status(503).json({
      success: false,
      message: 'Manual trigger disabled — set DATA_ADDED_REPORT_TOKEN in .env',
    });
  }

  const supplied = req.get('x-report-token') || req.query.token || (req.body && req.body.token);
  if (!tokenMatches(supplied)) {
    return res.status(401).json({ success: false, message: 'Invalid report token' });
  }

  const dryRun = /^(1|true|yes)$/i.test(String(req.query.dryRun || (req.body && req.body.dryRun) || ''));
  const to = String(req.query.to || (req.body && req.body.to) || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result = await sendDataAddedReport({
    year: req.query.year || (req.body && req.body.year),
    base: req.query.base || (req.body && req.body.base),
    to: to.length ? to : undefined,
    dryRun,
  });

  state.record({ ...result, trigger: 'manual' });

  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
