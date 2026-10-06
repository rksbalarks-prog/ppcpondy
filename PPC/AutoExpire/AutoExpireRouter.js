// Controls for the nightly auto-expire job. Mounted under /PPC (public: /PPC/PPC/...).
//
//   GET  /auto-expire/status                 mode, rules, schedule, last runs
//   GET  /auto-expire/preview[?items=1]      dry run right now; changes nothing
//   POST /auto-expire/run-now[?dryRun=1]     run in the current mode    (x-auto-expire-token)
//   POST /auto-expire/mode  {mode}           'off' | 'dry-run' | 'live'  (x-auto-expire-token)
//
// Reports carry ppcIds / ba_ids and dates only — never phone numbers.

const express = require('express');
const router = express.Router();

const config = require('./config');
const runner = require('./runner');
const state = require('./state');
const { AutoExpireRun } = require('./AutoExpireModel');

const tokenMatches = (supplied) => {
  const expected = config.token;
  if (!expected) return false;
  const a = String(supplied || '');
  if (a.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
};

const requireToken = (req, res, next) => {
  if (!config.token) {
    return res.status(503).json({ success: false, message: 'Disabled — set AUTO_EXPIRE_TOKEN in .env' });
  }
  if (!tokenMatches(req.get('x-auto-expire-token') || req.body?.token)) {
    return res.status(401).json({ success: false, message: 'Invalid auto-expire token' });
  }
  return next();
};

const truthy = (v) => /^(1|true|yes)$/i.test(String(v || ''));

router.get('/auto-expire/status', async (req, res) => {
  try {
    const recent = await AutoExpireRun.find({}, { sample: 0 }).sort({ startedAt: -1 }).limit(10).lean();
    res.json({
      success: true,
      mode: await runner.effectiveMode(),
      envMode: config.mode,
      cron: config.cron,
      timezone: config.timezone,
      days: config.days,
      propertyStatuses: config.propertyStatuses,
      assistanceStatuses: config.assistanceStatuses,
      protectFeatured: config.protectFeatured,
      maxPerRun: config.maxPerRun,
      manualControls: config.token ? 'enabled' : 'disabled (set AUTO_EXPIRE_TOKEN)',
      running: runner.isRunning(),
      scheduler: state.get(),
      recentRuns: recent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/auto-expire/preview', async (req, res) => {
  try {
    const report = await runner.run({ mode: 'dry-run', trigger: 'preview', items: truthy(req.query.items) });
    res.json({ success: true, ...report });
  } catch (err) {
    res.status(err.message.includes('in progress') ? 409 : 500).json({ success: false, message: err.message });
  }
});

router.post('/auto-expire/run-now', requireToken, async (req, res) => {
  try {
    const mode = truthy(req.query.dryRun || req.body?.dryRun) ? 'dry-run' : await runner.effectiveMode();
    if (mode === 'off') {
      return res.status(409).json({ success: false, message: 'Mode is off — switch to dry-run or live first' });
    }
    const report = await runner.run({ mode, trigger: 'manual' });
    res.json({ success: true, ...report });
  } catch (err) {
    res.status(err.message.includes('in progress') ? 409 : 500).json({ success: false, message: err.message });
  }
});

router.post('/auto-expire/mode', requireToken, async (req, res) => {
  const wanted = String(req.body?.mode || req.query.mode || '').trim().toLowerCase();
  if (!config.MODES.includes(wanted)) {
    return res.status(400).json({ success: false, message: `mode must be one of ${config.MODES.join(', ')}` });
  }
  try {
    const mode = await runner.saveMode(wanted, req.body?.by || 'api');
    res.json({ success: true, mode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
