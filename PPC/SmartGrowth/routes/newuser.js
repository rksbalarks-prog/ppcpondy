// AI & Automation > Autobot > New User Bot — an uploaded list of numbers
// (people not on Rent Pondy yet), sent one template a few at a time.
//
//   POST /sg/newuser/upload        file + template + pace: read, clean, store (saved PAUSED)
//   GET  /sg/newuser/lists         every list with its progress
//   POST /sg/newuser/save          change a list's name, message and pace
//   POST /sg/newuser/act           { id, act: on | pause | delete }
//   POST /sg/newuser/now           this list's next batch now
//   GET  /sg/newuser/export        a list with each number's status, as CSV (only = sent|failed|pending|held)

const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { SgNuList, SgNuNumber } = require('../models');
const nu = require('../engine/newUserBot');
const { health } = require('../guards');
const { runnerAllowed } = require('../engine/pace');
const U = require('../util');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });
const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

/** The template and pace the form posted, checked; or { error }. */
function settingsFrom(b) {
  const tid = String(b.templateId || '').trim();
  const tname = String(b.templateName || '').trim();
  const fmt = String(b.headerFormat || '').trim().toUpperCase();
  const media = String(b.mediaUrl || '').trim();
  const vc = parseInt(b.varCount, 10) || 0;
  let map = b.varMap;
  if (typeof map === 'string') { try { map = JSON.parse(map); } catch (_) { map = {}; } }
  const from = parseInt(b.hourFrom, 10);
  const to = parseInt(b.hourTo, 10);
  const delay = parseInt(b.sendDelay, 10) || 0;
  const quota = parseInt(b.dailyQuota, 10);
  if (!tid || !tname) return { error: 'Choose the WhatsApp template these numbers should get.' };
  if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(fmt) && !U.isPublicUrl(media))
    return { error: 'This template opens with a picture or file. Upload one, or paste a public http(s) link.' };
  const clean = {};
  for (let i = 1; i <= vc; i++) {
    const spec = map && typeof map === 'object' ? String(map[String(i)] || '') : '';
    if (spec !== 'name' && (!spec.startsWith('text:') || !spec.slice(5).trim()))
      return { error: 'Fill blank {{' + i + '}} - the name from the list, or fixed text. WhatsApp refuses a template with a blank left empty.' };
    clean[String(i)] = spec;
  }
  if (!(from >= 0 && to <= 24 && from < to)) return { error: 'Sending time: From has to be before To.' };
  if (delay < 0 || delay > nu.MAX_DELAY) return { error: 'Per message delay: 0 to ' + nu.MAX_DELAY + ' seconds.' };
  if (!(quota >= 1 && quota <= nu.MAX_QUOTA)) return { error: 'Messages per day: 1 to ' + nu.MAX_QUOTA.toLocaleString('en-IN') + '.' };
  return {
    templateId: tid.slice(0, 64), templateName: tname.slice(0, 120), headerFormat: fmt, mediaUrl: media.slice(0, 500),
    varCount: vc, varMap: clean, nameFallback: String(b.nameFallback || '').trim().slice(0, 60),
    hourFrom: from, hourTo: to, sendDelay: delay, dailyQuota: quota,
  };
}

router.post('/sg/newuser/upload', upload.single('file'), async (req, res) => {
  try {
    const set = settingsFrom(req.body || {});
    if (set.error) return fail(res, set.error);
    if (!req.file) return fail(res, 'Choose a .xlsx or .csv file.');
    const name = (String((req.body || {}).name || '').trim() || String(req.file.originalname).replace(/\.[^.]+$/, '')).slice(0, 120);
    // 'draft' until the numbers are in: the scheduler never picks up a half-read list.
    const list = await SgNuList.create({ ...set, name, fileName: String(req.file.originalname).slice(0, 200), status: 'draft', createdByName: U.adminName(req) });
    let c;
    try {
      c = await nu.importList(list._id, req.file.buffer);
    } catch (e) {
      await SgNuNumber.deleteMany({ listId: list._id });
      await SgNuList.deleteOne({ _id: list._id });
      return fail(res, e.message);
    }
    if (c.valid === 0) {
      await SgNuList.deleteOne({ _id: list._id });
      return fail(res, 'Nobody in that file can be sent to: ' + c.invalid + ' invalid, ' + c.dup + ' duplicates, ' + c.member + ' already Rent Pondy users, ' + c.blocked + ' blocked.', { counts: c });
    }
    await SgNuList.updateOne({ _id: list._id }, {
      $set: { totalRows: c.total, validCount: c.valid, dupCount: c.dup, invalidCount: c.invalid, memberCount: c.member, blockedCount: c.blocked, status: 'paused' },
    });
    res.json({ status: 'success', id: String(list._id), name, counts: c, template: set.templateName, hours: U.hoursLabel(set.hourFrom, set.hourTo), delay: set.sendDelay, quota: set.dailyQuota });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/newuser/lists', async (req, res) => {
  try {
    res.json({ status: 'success', lists: await nu.lists(), health: await health.status(), runner: runnerAllowed() });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/newuser/save', async (req, res) => {
  try {
    const b = req.body || {};
    if (!mongoose.isValidObjectId(b.id)) return fail(res, 'Which list?');
    const l = await SgNuList.findById(b.id).lean();
    if (!l) return fail(res, 'No such list.');
    const set = settingsFrom(b);
    if (set.error) return fail(res, set.error);
    if (String(b.name || '').trim()) set.name = String(b.name).trim().slice(0, 120);
    set.status = l.status === 'draft' ? 'paused' : l.status;
    await SgNuList.updateOne({ _id: l._id }, { $set: set });
    res.json({ status: 'success', message: 'Saved.' + (l.status === 'running' ? ' It carries on with the new settings from the next message.' : (l.status === 'done' ? '' : ' Press Switch on when ready.')) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/newuser/act', async (req, res) => {
  try {
    const { id, act } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Which list?');
    const l = await SgNuList.findById(id).lean();
    if (!l) return fail(res, 'No such list.');
    if (act === 'on') {
      if (!l.templateId) return fail(res, 'Choose the template first (Edit).');
      if (l.status === 'done') return fail(res, 'This list is finished - every number has had its message.');
      await SgNuList.updateOne({ _id: l._id }, { $set: { status: 'running' } });
      return res.json({ status: 'success', message: 'Switched on. It sends inside ' + U.hoursLabel(l.hourFrom, l.hourTo) + ' (India time), up to ' + Number(l.dailyQuota).toLocaleString('en-IN') + ' a day.' + (runnerAllowed() ? '' : ' Automatic sending is off on this server (SMARTGROWTH_RUNNER), so only Send now moves it.') });
    }
    if (act === 'pause') {
      await SgNuList.updateOne({ _id: l._id, status: 'running' }, { $set: { status: 'paused' } });
      return res.json({ status: 'success', message: 'Paused. Nothing more goes out until it is switched on.' });
    }
    if (act === 'delete') {
      await SgNuNumber.deleteMany({ listId: l._id });
      await SgNuList.deleteOne({ _id: l._id });
      return res.json({ status: 'success', message: 'Deleted. What was already sent stays in the send log.' });
    }
    fail(res, 'Unknown action.');
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/newuser/now', async (req, res) => {
  try {
    const id = (req.body || {}).id;
    if (!mongoose.isValidObjectId(id)) return fail(res, 'Which list?');
    const bot = new nu.NewUserBot();
    const sent = await bot.runNow(id);
    res.json({ status: 'success', sent, message: bot.log.join(' ') });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/newuser/export', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.query.id)) return res.status(404).send('No such list.');
    const l = await SgNuList.findById(req.query.id).lean();
    if (!l) return res.status(404).send('No such list.');
    const only = String(req.query.only || '');
    const where = { listId: l._id };
    if (['sent', 'failed', 'pending', 'held'].includes(only)) where.status = only;
    const rows = await SgNuNumber.find(where).sort({ _id: 1 }).lean();
    const csv = U.toCsv(['Phone', 'Name', 'Status', 'Detail', 'When'],
      rows.map((r) => ['+' + r.phone, r.name || '', r.status === 'held' ? 'waiting' : r.status, r.detail || '', U.istStamp(r.sentAt)]));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="new-user-bot-${String(l.name).replace(/[^A-Za-z0-9]+/g, '-')}${only ? '-' + only : ''}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
