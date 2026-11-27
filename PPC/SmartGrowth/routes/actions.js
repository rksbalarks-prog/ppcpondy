// Communication > WhatsApp > Action Messages — which actions run, with which
// template, wording and per-person allowance. The sending is
// engine/actions.js on the scheduler; this page only decides.
//
//   GET  /sg/actions        every action as configured, the master switch, today's counts
//   POST /sg/actions        save
//   POST /sg/actions/run    check for new events now (sends, if switched on)

const express = require('express');
const sg = require('../client');
const act = require('../engine/actions');
const { SgSettings } = require('../models');
const { runnerAllowed } = require('../engine/pace');
const U = require('../util');

const router = express.Router();

router.get('/sg/actions', async (req, res) => {
  try {
    const s = (await sg.settingsDoc()).toObject();
    res.json({
      status: 'success',
      settings: {
        capEnabled: s.capEnabled !== false, capAction: s.capAction ?? 2,
        actionOn: !!s.actionEnabled, actionRan: s.actionCheckedAt, runner: runnerAllowed(),
      },
      actions: Object.values(act.config(s.actionConfig)),
      fields: act.FIELDS,
      utilityOnly: act.UTILITY_ONLY,
      actionToday: await act.todayByAction(),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/actions', async (req, res) => {
  try {
    const b = req.body || {};
    const cfg = {};
    const given = b.actions && typeof b.actions === 'object' ? b.actions : {};
    for (const key of Object.keys(act.CATALOGUE)) {
      const one = given[key] || {};
      const varMap = {};
      if (one.varMap && typeof one.varMap === 'object') {
        for (const [n, spec] of Object.entries(one.varMap)) {
          const i = parseInt(n, 10);
          const v = String(spec || '');
          if (i >= 1 && i <= 20 && (act.FIELDS[v] || v.startsWith('text:'))) varMap[String(i)] = v.slice(0, 120);
        }
      }
      cfg[key] = {
        on: !!one.on,
        template: String(one.template || '').trim().slice(0, 120),
        cap: U.clampInt(one.cap, 0, 20, act.CATALOGUE[key].cap),
        status: String(one.status || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        varMap,
      };
    }
    await SgSettings.updateOne({ key: 'main' }, { $set: { actionEnabled: !!b.actionOn, actionConfig: cfg, updatedBy: U.adminName(req) } }, { upsert: true });
    sg.invalidate();
    res.json({ status: 'success', message: 'Action messages saved.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/actions/run', async (req, res) => {
  try {
    const r = await act.run({ manual: true });
    res.json({ status: 'success', sent: r.sent, message: r.log.join(' ') || 'Nothing new to send.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
