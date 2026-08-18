// Manual controls for the Admin Detail (Excel) e-mail.
//
//   GET  /PPC/admin-excel-mail/status
//   POST /PPC/admin-excel-mail/send-now?dryRun=1   (x-report-token header)

const express = require('express');
const router = express.Router();

const mailer = require('../DataAddedMail/mailer');
const config = require('./config');
const { sendDetailReport } = require('./sendDetailReport');
const { API_BASE } = require('./fetchDetail');
const state = require('./state');

const maskEmail = (address) => {
  const [name, domain] = String(address).split('@');
  if (!domain) return '***';
  return `${name.slice(0, 3)}***@${domain}`;
};

const tokenMatches = (supplied) => {
  const expected = config.triggerToken;
  if (!expected) return false;
  const a = String(supplied || '');
  if (a.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
};

router.get('/admin-excel-mail/status', (req, res) => {
  res.json({
    success: true,
    enabled: config.enabled,
    smtpConfigured: mailer.isConfigured(),
    cron: config.cron,
    timezone: config.timezone,
    apiBase: API_BASE,
    recipients: config.to.map(maskEmail),
    manualTrigger: config.triggerToken ? 'enabled' : 'disabled (set ADMIN_EXCEL_TOKEN)',
    scheduler: state.get(),
  });
});

router.post('/admin-excel-mail/send-now', async (req, res) => {
  if (!config.triggerToken) {
    return res.status(503).json({
      success: false,
      message: 'Manual trigger disabled — set ADMIN_EXCEL_TOKEN (or DATA_ADDED_REPORT_TOKEN) in .env',
    });
  }

  const supplied = req.get('x-report-token') || req.query.token || (req.body && req.body.token);
  if (!tokenMatches(supplied)) {
    return res.status(401).json({ success: false, message: 'Invalid report token' });
  }

  const dryRun = /^(1|true|yes)$/i.test(String(req.query.dryRun || (req.body && req.body.dryRun) || ''));
  const to = String(req.query.to || (req.body && req.body.to) || '')
    .split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

  const result = await sendDetailReport({ to: to.length ? to : undefined, dryRun });
  state.record({ ...result, trigger: 'manual' });

  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
