// AI & Automation > Autobot > Reminder Bot — the follow-up: one master
// switch, the pace, and the four reminders each with their own template and
// daily limit. The sending is engine/reminder.js on the scheduler.
//
//   GET  /sg/reminder               the follow-up and the reminders, with their figures
//   POST /sg/reminder/followup      days between reminders, starts per day, hours, delay
//   POST /sg/reminder/followup/act  { act: on | pause }
//   POST /sg/reminder/save          { id, dailyCap, templateName, varMap }
//   POST /sg/reminder/act           { id, act: on | off } — include one reminder or leave it out
//   GET  /sg/reminder/preview       who the follow-up would message right now (sends nothing)
//   GET  /sg/reminder/log           the latest reminders sent
//   POST /sg/reminder/now           one turn now

const express = require('express');
const mongoose = require('mongoose');
const { SgReminder, SgFollowupSetting, SgReminderLog } = require('../models');
const rm = require('../engine/reminder');
const audience = require('../engine/audience');
const { health } = require('../guards');
const { runnerAllowed } = require('../engine/pace');
const U = require('../util');

const router = express.Router();
const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

router.get('/sg/reminder', async (req, res) => {
  try {
    const o = await new rm.Reminder().overview();
    res.json({
      status: 'success', followup: o.followup, reminders: o.reminders, kinds: rm.KINDS, fields: audience.FIELDS,
      maxEvery: rm.MAX_EVERY, maxDelay: rm.MAX_DELAY, health: await health.status(), runner: runnerAllowed(),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/reminder/followup', async (req, res) => {
  try {
    const b = req.body || {};
    const every = parseInt(b.remindEvery, 10);
    const perDay = parseInt(b.startPerDay, 10);
    const from = parseInt(b.hourFrom, 10);
    const to = parseInt(b.hourTo, 10);
    const delay = parseInt(b.sendDelay, 10) || 0;
    if (!(every >= 1 && every <= rm.MAX_EVERY)) return fail(res, 'Remind again after 1 to ' + rm.MAX_EVERY + ' days.');
    if (!(perDay >= 0 && perDay <= 5000)) return fail(res, 'Existing people started per day: 0 to 5000.');
    if (delay < 0 || delay > rm.MAX_DELAY) return fail(res, 'Per message delay: 0 to ' + rm.MAX_DELAY + ' seconds (0 = no wait).');
    if (!(from >= 0 && to <= 24 && from < to)) return fail(res, 'Sending hours: the start must be before the end.');
    await rm.ensure();
    await SgFollowupSetting.updateOne({ key: 'main' }, { $set: { remindEvery: every, startPerDay: perDay, hourFrom: from, hourTo: to, sendDelay: delay, updatedByName: U.adminName(req) } });
    res.json({ status: 'success', message: 'Saved.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/reminder/followup/act', async (req, res) => {
  try {
    const act = (req.body || {}).act;
    if (act !== 'on' && act !== 'pause') return fail(res, 'Unknown action.');
    await rm.ensure();
    await SgFollowupSetting.updateOne({ key: 'main' }, { $set: { status: act === 'on' ? 'on' : 'paused', updatedByName: U.adminName(req) } });
    // The first switch-on is the line between "new" people (start at once)
    // and "existing" ones (start a few a day). Set once, never moved.
    if (act === 'on') await SgFollowupSetting.updateOne({ key: 'main', launchedAt: null }, { $set: { launchedAt: new Date() } });
    res.json({
      status: 'success',
      message: act === 'on'
        ? 'Switched on. The scheduler checks every few minutes, inside the sending hours.' + (runnerAllowed() ? '' : ' Automatic sending is off on this server (SMARTGROWTH_RUNNER), so only Run now moves it.')
        : 'Paused. Nothing more goes out until it is switched on again.',
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/reminder/save', async (req, res) => {
  try {
    const b = req.body || {};
    if (!mongoose.isValidObjectId(b.id)) return fail(res, 'No such reminder.');
    const cap = parseInt(b.dailyCap, 10);
    const tplName = String(b.templateName || '').trim();
    if (!(cap >= 0 && cap <= 5000)) return fail(res, 'Messages a day: 0 to 5000.');
    if (tplName && !/^[a-z0-9_]{1,120}$/.test(tplName)) return fail(res, 'Template name: lower-case letters, digits and _ only.');
    const varMap = {};
    if (b.varMap && typeof b.varMap === 'object') {
      for (const [n, spec] of Object.entries(b.varMap)) {
        const v = String(spec || '');
        if (parseInt(n, 10) >= 1 && (audience.FIELDS[v] || v.startsWith('text:'))) varMap[String(parseInt(n, 10))] = v.slice(0, 120);
      }
    }
    const r = await SgReminder.updateOne({ _id: b.id }, { $set: { dailyCap: cap, templateName: tplName, varMap, updatedByName: U.adminName(req) } });
    if (!r.matchedCount) return fail(res, 'No such reminder.');
    res.json({ status: 'success', message: 'Saved.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/reminder/act', async (req, res) => {
  try {
    const { id, act } = req.body || {};
    if (!mongoose.isValidObjectId(id) || (act !== 'on' && act !== 'off')) return fail(res, 'Unknown action.');
    const rem = await SgReminder.findById(id);
    if (!rem) return fail(res, 'No such reminder.');
    rem.status = act;
    rem.updatedByName = U.adminName(req);
    await rem.save();
    res.json({ status: 'success', message: act === 'on' ? rem.name + ' is part of the follow-up again.' : rem.name + ' is left out: its turns are skipped.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/reminder/preview', async (req, res) => {
  try {
    res.json({ status: 'success', people: await new rm.Reminder().preview(50) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/reminder/log', async (req, res) => {
  try {
    const kind = String(req.query.kind || '');
    const rows = await SgReminderLog.find(rm.KINDS[kind] ? { kind } : {}).sort({ _id: -1 }).limit(100).lean();
    res.json({ status: 'success', rows: rows.map((r) => ({ ...r, label: (rm.KINDS[r.kind] || {}).label || r.kind })) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/reminder/now', async (req, res) => {
  try {
    const r = new rm.Reminder();
    const sent = await r.run({ manual: true });
    res.json({ status: 'success', sent, message: r.log.join(' ') });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
