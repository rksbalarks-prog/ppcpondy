// AI & Automation > Autobot > WhatsApp Bot — RUNS (a segment + template +
// daily allowance, worked a few at a time and left watching for new people).
//
//   GET  /sg/autobot/meta          segments, fields, limits, runner + health
//   GET  /sg/autobot/audience      how many a segment + plan reaches (or who one number is)
//   GET  /sg/autobot/runs          every run with its figures
//   POST /sg/autobot/runs          create — always PAUSED; starting is a second decision
//   POST /sg/autobot/runs/act      { id, act: start | pause | delete }
//   POST /sg/autobot/runs/now      { id } — this run's next batch now, instead of the next tick
//   GET  /sg/autobot/activity      the latest sends, for the live panel (after = last id drawn)

const express = require('express');
const mongoose = require('mongoose');
const { SgRun, SgSendLog } = require('../models');
const { Broadcast, KIND, MAX_DAILY_QUOTA, MAX_SEND_DELAY, remainingFor } = require('../engine/broadcast');
const audience = require('../engine/audience');
const { health } = require('../guards');
const { runnerAllowed } = require('../engine/pace');
const U = require('../util');

const router = express.Router();
const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

router.get('/sg/autobot/meta', async (req, res) => {
  try {
    res.json({
      status: 'success', segments: audience.SEGMENTS, fields: audience.FIELDS,
      maxQuota: MAX_DAILY_QUOTA, maxDelay: MAX_SEND_DELAY, runner: runnerAllowed(), health: await health.status(),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/autobot/audience', async (req, res) => {
  try {
    const only = String(req.query.only || '').trim();
    if (only) {
      const p = await audience.findOne(only);
      if (!p) return res.json({ status: 'success', count: 0, only: true, who: 'Not a 10-digit mobile number: "' + only + '".' });
      if (p.blocked) return res.json({ status: 'success', count: 0, only: true, who: p.phone + ' — has asked us to stop, so nothing will be sent.' });
      return res.json({
        status: 'success', count: 1, only: true, phone: p.phone,
        who: p.phone + (p.name ? ' — ' + p.name : '') + (p.rentId !== undefined ? ' — Rent ID ' + p.rentId : '') + (p.known ? '' : ' — not a Rent Pondy user yet'),
      });
    }
    const rows = await audience.list(String(req.query.segment || 'all'), String(req.query.plan || ''));
    res.json({ status: 'success', count: rows.length });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/autobot/runs', async (req, res) => {
  try {
    const runs = await SgRun.find({}).sort({ _id: -1 }).limit(100).lean();
    const held = await SgSendLog.aggregate([{ $match: { kind: KIND, status: 'held' } }, { $group: { _id: '$refId', n: { $sum: 1 } } }]);
    const heldBy = Object.fromEntries(held.map((h) => [h._id, h.n]));
    const today = U.istToday();
    const rows = [];
    for (const r of runs) {
      rows.push({
        id: String(r._id), name: r.name, segment: r.segment, segmentLabel: audience.SEGMENTS[r.segment] || r.segment, plan: r.plan,
        onlyPhone: r.onlyPhone, template: r.templateName, quota: r.dailyQuota,
        sentToday: r.quotaDate === today ? r.sentToday : 0, sent: r.sentCount, failed: r.failedCount, skipped: r.skippedCount,
        status: r.status, lastRunAt: r.lastRunAt, lastDetail: r.lastDetail, by: r.createdByName, createdAt: r.createdAt,
        remaining: await remainingFor(r), waiting: heldBy[String(r._id)] || 0, hasMedia: !!r.mediaUrl,
        delay: r.sendDelay, hourFrom: r.hourFrom, hourTo: r.hourTo, hours: U.hoursLabel(r.hourFrom, r.hourTo),
      });
    }
    res.json({ status: 'success', rows });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/autobot/runs', async (req, res) => {
  try {
    const b = req.body || {};
    const templateId = String(b.templateId || '').trim();
    const templateName = String(b.templateName || '').trim();
    const segment = String(b.segment || 'all');
    const plan = String(b.plan || '');
    const only = String(b.only || '').trim();
    const quota = parseInt(b.dailyQuota, 10);
    const delay = parseInt(b.sendDelay, 10) || 0;
    const hourFrom = parseInt(b.hourFrom, 10);
    const hourTo = parseInt(b.hourTo, 10);
    const mediaUrl = String(b.mediaUrl || '').trim();

    if (!templateId) return fail(res, 'Choose a template first.');
    if (!audience.SEGMENTS[segment]) return fail(res, 'Pick who the run is for.');
    if (plan && plan !== 'free' && plan !== 'paid') return fail(res, 'Plan must be free, paid, or either.');
    if (!(quota >= 1 && quota <= MAX_DAILY_QUOTA))
      return fail(res, 'The daily allowance has to be between 1 and ' + MAX_DAILY_QUOTA + '. It is what stops a segment of thirty thousand people from spending thirty thousand credits.');
    if (delay < 0 || delay > MAX_SEND_DELAY) return fail(res, 'The delay between messages has to be 0 to ' + MAX_SEND_DELAY + ' seconds (0 = no wait).');
    if (!(hourFrom >= 0 && hourTo <= 24 && hourFrom < hourTo)) return fail(res, 'Sending time: the From hour has to be before the To hour.');
    if (mediaUrl && !U.isPublicUrl(mediaUrl)) return fail(res, 'The header file’s link has to be a full http:// or https:// address that anyone can open — WhatsApp fetches it itself.');

    // The blanks, stored as posted after checking each is a known field or fixed text.
    const varMap = {};
    if (b.varMap && typeof b.varMap === 'object') {
      for (const [n, spec] of Object.entries(b.varMap)) {
        const i = parseInt(n, 10);
        const v = String(spec || '');
        if (!(i >= 1) || !v) continue;
        if (!v.startsWith('text:') && !audience.FIELDS[v]) return fail(res, 'Unknown value for blank {{' + i + '}}.');
        varMap[String(i)] = v;
      }
    }
    const need = parseInt(b.varCount, 10) || 0;
    if (need > 0 && Object.keys(varMap).length < need)
      return fail(res, 'This template has ' + need + ' blank(s) and ' + Object.keys(varMap).length + ' are filled in. WhatsApp refuses a template missing any of its values, so the whole run would fail.');

    let onlyPhone = '';
    if (only) {
      const p = await audience.findOne(only);
      if (!p) return fail(res, 'Type a 10-digit mobile number for a test run.');
      if (p.blocked) return fail(res, 'That number has asked us to stop.');
      onlyPhone = p.phone;
    }
    const count = onlyPhone ? 1 : (await audience.list(segment, plan)).length;
    if (count < 1) return fail(res, 'That filter matches nobody, so there is nothing to start.');

    const name = String(b.name || '').trim()
      || (onlyPhone ? templateName + '-test-' + onlyPhone + '-' + U.istCompact().slice(0, 13)
        : [templateName || 'run', segment, plan, U.istCompact().slice(0, 13)].filter(Boolean).join('-'));
    const hp = Array.isArray(b.headerParams) ? b.headerParams.map(String).filter(Boolean) : [];
    const run = await SgRun.create({
      name: name.slice(0, 160), segment: onlyPhone ? 'all' : segment, plan: onlyPhone ? '' : plan, onlyPhone,
      templateId, templateName, varMap, mediaUrl, fileName: String(b.fileName || '').trim(), headerParams: hp,
      dailyQuota: quota, sendDelay: delay, hourFrom, hourTo, status: 'paused', createdByName: U.adminName(req),
    });
    res.json({
      status: 'success', id: String(run._id),
      message: 'Run created for ' + count.toLocaleString('en-IN') + ' person(s), up to ' + quota + ' a day'
        + (hourFrom > 0 || hourTo < 24 ? ', ' + U.hoursLabel(hourFrom, hourTo) : '') + (delay > 0 ? ', one every ' + delay + 's' : '')
        + '. It is PAUSED — press Start when ready.',
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/autobot/runs/act', async (req, res) => {
  try {
    const { id, act } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Which run?');
    const run = await SgRun.findById(id);
    if (!run) return fail(res, 'No such run.');
    if (act === 'start' || act === 'pause') {
      run.status = act === 'start' ? 'running' : 'paused';
      await run.save();
      return res.json({
        status: 'success',
        message: act === 'start'
          ? (runnerAllowed() ? 'Started. The scheduler picks it up within a minute.' : 'Started — but automatic sending is off on this server (SMARTGROWTH_RUNNER), so only Send now moves it.')
          : 'Paused. Nothing more goes out until it is started again.',
      });
    }
    if (act === 'delete') {
      // The run goes; the record of what it sent stays in the send log.
      await SgRun.deleteOne({ _id: run._id });
      return res.json({ status: 'success', message: 'Deleted. What it already sent is still in the send log.' });
    }
    fail(res, 'Unknown action.');
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/autobot/runs/now', async (req, res) => {
  try {
    const id = (req.body || {}).id;
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Which run?');
    const bc = new Broadcast();
    const sent = await bc.runNow(id);
    res.json({ status: 'success', sent, message: bc.log.join(' ') });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/autobot/activity', async (req, res) => {
  try {
    const after = String(req.query.after || '');
    const where = { kind: KIND, status: { $ne: 'sending' } };
    if (mongoose.isValidObjectId(after)) where._id = { $gt: new mongoose.Types.ObjectId(after) };
    const rows = await SgSendLog.find(where).sort({ _id: -1 }).limit(40).lean();
    const start = U.istDayStart();
    const [sentToday, failedToday, running] = await Promise.all([
      SgSendLog.countDocuments({ kind: KIND, status: 'sent', createdAt: { $gte: start } }),
      SgSendLog.countDocuments({ kind: KIND, status: 'failed', createdAt: { $gte: start } }),
      SgRun.countDocuments({ status: 'running' }),
    ]);
    const h = await health.status();
    res.json({
      status: 'success',
      rows: rows.map((r) => ({ id: String(r._id), phone: r.phone, template: r.templateName, run: r.campaignName, status: r.status, detail: r.detail, at: r.createdAt })),
      today: { sent: sentToday, failed: failedToday, waiting: h.waiting }, health: h, running, runner: runnerAllowed(), serverTime: U.istStamp(),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
