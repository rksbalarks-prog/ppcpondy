// AI & Automation > Autobot > WhatsApp Bot Report — what the bots have been
// doing: Autobot runs, the New User Bot and the reminders. Campaigns typed by
// a person (Send Message) and chat replies are left out on purpose — those
// are reported where they were done.
//
//   GET /sg/bot-report          totals, by kind / template / day, and the rows (from, to = 'YYYY-MM-DD', India)
//   GET /sg/bot-report/export   the same range as CSV

const express = require('express');
const { SgSendLog, SgBlock } = require('../models');
const U = require('../util');

const router = express.Router();

const KINDS = { bcast: 'Autobot run', newuser: 'New User Bot', reminder: 'Reminder', action: 'Action message' };
const MAX_ROWS = 500;

function range(q) {
  let from = /^\d{4}-\d{2}-\d{2}$/.test(String(q.from || '')) ? q.from : U.istToday();
  let to = /^\d{4}-\d{2}-\d{2}$/.test(String(q.to || '')) ? q.to : U.istToday();
  if (from > to) [from, to] = [to, from];   // typed the wrong way round is a slip, not an empty report
  return { from, to };
}

function where(q) {
  const { from, to } = range(q);
  const w = { createdAt: { $gte: U.istDateStart(from), $lte: U.istDateEnd(to) }, kind: { $in: Object.keys(KINDS) }, status: { $nin: ['skipped', 'sending'] } };
  if (KINDS[q.kind]) w.kind = q.kind;
  if (q.rstatus) w.status = String(q.rstatus);
  const s = String(q.q || '').trim();
  if (s) {
    const d = U.digits(s);
    if (d.length >= 6) w.phone = new RegExp(U.escRe(d.slice(-10)));
    else { const re = new RegExp(U.escRe(s), 'i'); w.$or = [{ templateName: re }, { campaignName: re }]; }
  }
  return { w, from, to };
}

const sumIf = (st) => ({ $sum: { $cond: [{ $eq: ['$status', st] }, 1, 0] } });

router.get('/sg/bot-report', async (req, res) => {
  try {
    const { w, from, to } = where(req.query);
    const [tot] = await SgSendLog.aggregate([{ $match: w }, { $group: { _id: null, total: { $sum: 1 }, sent: sumIf('sent'), failed: sumIf('failed'), blocked: sumIf('blocked'), held: sumIf('held'), people: { $addToSet: '$phone' } } }]);
    const byKind = await SgSendLog.aggregate([{ $match: w }, { $group: { _id: '$kind', n: { $sum: 1 }, sent: sumIf('sent') } }, { $sort: { n: -1 } }]);
    const byTemplate = await SgSendLog.aggregate([{ $match: w }, { $group: { _id: { $ifNull: ['$templateName', '(none)'] }, n: { $sum: 1 }, sent: sumIf('sent'), failed: sumIf('failed') } }, { $sort: { n: -1 } }, { $limit: 25 }]);
    const byDay = await SgSendLog.aggregate([{ $match: w }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, n: { $sum: 1 }, failed: sumIf('failed') } }, { $sort: { _id: 1 } }]);
    const rows = await SgSendLog.find(w).sort({ _id: -1 }).limit(MAX_ROWS + 1).lean();
    const capped = rows.length > MAX_ROWS;
    if (capped) rows.pop();
    res.json({
      status: 'success', from, to,
      totals: { total: tot ? tot.total : 0, sent: tot ? tot.sent : 0, failed: tot ? tot.failed : 0, blocked: tot ? tot.blocked : 0, held: tot ? tot.held : 0, people: tot ? tot.people.length : 0 },
      byKind: byKind.map((k) => ({ kind: k._id, label: KINDS[k._id] || k._id, n: k.n, sent: k.sent })),
      byTemplate: byTemplate.map((t) => ({ name: t._id || '(none)', n: t.n, sent: t.sent, failed: t.failed })),
      byDay: byDay.map((d) => ({ d: d._id, n: d.n, failed: d.failed })),
      rows: rows.map((r) => ({ id: String(r._id), at: r.createdAt, phone: r.phone, kind: r.kind, kindLabel: KINDS[r.kind] || r.kind, template: r.templateName || '', run: r.campaignName || '', rstatus: r.status, code: r.httpCode || 0, detail: r.detail || '', by: r.createdByName || '' })),
      capped, maxRows: MAX_ROWS, kinds: KINDS, blockedNow: await SgBlock.countDocuments({}),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/bot-report/export', async (req, res) => {
  try {
    const { w, from, to } = where(req.query);
    const rows = await SgSendLog.find(w).sort({ _id: -1 }).lean();
    const csv = U.toCsv(['When', 'Phone Number', 'What', 'Template', 'Run / campaign', 'Result', 'HTTP', 'Detail', 'By'],
      rows.map((r) => [U.istStamp(r.createdAt), U.e164(r.phone), KINDS[r.kind] || r.kind, r.templateName || '', r.campaignName || '', r.status, r.httpCode || '', r.detail || '', r.createdByName || '']));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="whatsapp-bot-report-${from}-to-${to}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
