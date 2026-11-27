// The numbers behind Campaign Report, read from the copy campaignSync keeps.
//
// Every visual is one aggregation here and all of them take the same filters,
// so clicking a bar in one narrows every other — the way a Power BI page
// cross-filters:
//
//   from, to   'YYYY-MM-DD' (India) — the message's time
//   src        page(s) that sent it, comma separated (see SOURCES)
//   cid        one campaign (sg_cstats _id)
//   tpl        template name
//   st         queued | sent | delivered | read | failed | cancelled
//   reason     failure reason ('-' = none given)
//   aud        member | nonmember | invalid   (member = a number Rent Pondy knows)
//   replied    1 = only numbers that wrote back
//   q          search: a number, or part of a campaign, template or error

const mongoose = require('mongoose');
const { SgCMsg, SgCStat } = require('../models');
const { SOURCES, STATUSES } = require('./campaignSync');
const U = require('../util');

const DETAIL_PAGE = 50;
const TZ = 'Asia/Kolkata';

/** 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM[:SS]', India time -> the Date it means (a bare day: its start / end). */
function istBound(v, end) {
  if (v.length === 10) return end ? U.istDateEnd(v) : U.istDateStart(v);
  const [d, t] = v.split(' ');
  const hms = t.length === 5 ? t + (end ? ':59' : ':00') : t;
  return new Date(d + 'T' + hms + (end ? '.999' : '.000') + '+05:30');
}

function clean(q) {
  const g = (k) => String(q[k] === undefined ? '' : q[k]).trim();
  const f = {};
  // A day, or (from a click on an hour column) a time within one.
  for (const k of ['from', 'to']) if (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(g(k))) f[k] = g(k);
  const src = g('src').split(',').filter((s) => SOURCES[s]);
  if (src.length) f.src = [...new Set(src)];
  if (mongoose.isValidObjectId(g('cid'))) f.cid = g('cid');
  if (g('tpl')) f.tpl = g('tpl').slice(0, 120);
  if (STATUSES.includes(g('st'))) f.st = g('st');
  if (g('reason')) f.reason = g('reason').slice(0, 160);
  if (['member', 'nonmember', 'invalid'].includes(g('aud'))) f.aud = g('aud');
  if (g('replied') === '1') f.replied = 1;
  if (g('q')) f.q = g('q').slice(0, 80);
  return f;
}

function match(f, withSearch = true) {
  const m = {};
  if (f.from || f.to) {
    m.at = {};
    if (f.from) m.at.$gte = istBound(f.from, false);
    if (f.to) m.at.$lte = istBound(f.to, true);
  }
  if (f.src) m.source = { $in: f.src };
  if (f.cid) m.campaignId = new mongoose.Types.ObjectId(f.cid);
  if (f.tpl) m.templateName = f.tpl;
  if (f.st) m.status = f.st;
  if (f.reason) {
    if (f.reason === '-') { m.status = { $in: ['failed', 'cancelled'] }; m.reason = { $in: [null, ''] }; }
    else m.reason = f.reason;
  }
  if (f.aud === 'member') m.known = true;
  if (f.aud === 'nonmember') { m.known = { $ne: true }; m.last10 = { $ne: '' }; }
  if (f.aud === 'invalid') m.last10 = '';
  if (f.replied) m.replied = true;
  if (withSearch && f.q) {
    const d = U.digits(f.q);
    if (d.length >= 5) m.phone = new RegExp(U.escRe(d));
    else {
      const re = new RegExp(U.escRe(f.q), 'i');
      m.$or = [{ campaignName: re }, { templateName: re }, { error: re }, { phone: re }];
    }
  }
  return m;
}

const statusCols = () => Object.fromEntries(STATUSES.map((s) => [s, { $sum: { $cond: [{ $eq: ['$status', s] }, 1, 0] } }]));
const pick = (r) => { const o = { ...r }; delete o._id; return o; };

async function kpiFor(m, full) {
  const [r] = await SgCMsg.aggregate([
    { $match: m },
    {
      $group: {
        _id: null, total: { $sum: 1 }, ...statusCols(),
        people: { $addToSet: { $cond: [{ $ne: ['$last10', ''] }, '$last10', '$$REMOVE'] } },
        members: { $addToSet: { $cond: ['$known', '$last10', '$$REMOVE'] } },
        replied: { $addToSet: { $cond: ['$replied', '$last10', '$$REMOVE'] } },
        ...(full ? { campaigns: { $addToSet: '$campaignId' }, firstAt: { $min: '$at' }, lastAt: { $max: '$at' } } : {}),
      },
    },
  ]);
  const out = { total: 0, ...Object.fromEntries(STATUSES.map((s) => [s, 0])), people: 0, members: 0, replied: 0, campaigns: 0, firstAt: null, lastAt: null };
  if (!r) return out;
  return {
    ...out, ...pick(r),
    people: r.people.length, members: r.members.length, replied: r.replied.length,
    campaigns: r.campaigns ? r.campaigns.length : 0,
  };
}

/** Everything the page draws, in one answer. */
async function data(query) {
  const f = clean(query);
  const m = match(f);
  const kpi = await kpiFor(m, true);

  // The same numbers for the period just before — what the arrows compare against.
  let prev = null;
  if (f.from && f.to) {
    const a = istBound(f.from, false).getTime();
    const b = istBound(f.to, true).getTime();
    if (b > a) {
      const pm = { ...m, at: { $gte: new Date(a - (b - a) - 1), $lte: new Date(a - 1) } };
      prev = await kpiFor(pm, false);
      prev.from = U.istStamp(new Date(a - (b - a) - 1));
      prev.to = U.istStamp(new Date(a - 1));
    }
  }

  // Time: months, days or hours, by how long the period is.
  const span = kpi.firstAt && kpi.lastAt ? new Date(kpi.lastAt) - new Date(kpi.firstAt) : 0;
  const level = span > 62 * 86400000 ? 'month' : (span > 2 * 86400000 ? 'day' : 'hour');
  const fmt = { month: '%Y-%m', day: '%Y-%m-%d', hour: '%Y-%m-%d %H' }[level];
  const time = (await SgCMsg.aggregate([
    { $match: { ...m, at: { ...(m.at || {}), $ne: null } } },
    { $group: { _id: { $dateToString: { format: fmt, date: '$at', timezone: TZ } }, total: { $sum: 1 }, ...statusCols(), replied: { $sum: { $cond: ['$replied', 1, 0] } } } },
    { $sort: { _id: 1 } },
  ])).map((r) => ({ k: r._id, ...pick(r) }));

  // Which page sent it — or, inside one page, its campaigns.
  let bySource;
  let sourceLevel;
  if (f.src && f.src.length === 1 && !f.cid) {
    bySource = (await SgCMsg.aggregate([
      { $match: m },
      { $group: { _id: '$campaignId', label: { $first: '$campaignName' }, total: { $sum: 1 }, ...statusCols() } },
      { $sort: { total: -1 } }, { $limit: 15 },
    ])).map((r) => ({ k: String(r._id), ...pick(r) }));
    sourceLevel = 'campaign';
  } else {
    bySource = (await SgCMsg.aggregate([
      { $match: m },
      { $group: { _id: '$source', total: { $sum: 1 }, ...statusCols() } },
      { $sort: { total: -1 } },
    ])).map((r) => ({ k: r._id, label: SOURCES[r._id] || r._id, ...pick(r) }));
    sourceLevel = 'source';
  }

  const templates = (await SgCMsg.aggregate([
    { $match: m },
    { $group: { _id: { $ifNull: ['$templateName', '(unknown)'] }, total: { $sum: 1 }, ...statusCols() } },
    { $sort: { total: -1 } }, { $limit: 12 },
  ])).map((r) => ({ k: r._id, ...pick(r) }));

  // Failure reasons are about failed and cancelled messages only — a status
  // filter of "read" must not put read messages under "(no reason given)".
  const reasons = (await SgCMsg.aggregate([
    { $match: { ...m, status: ['failed', 'cancelled'].includes(m.status) ? m.status : { $in: ['failed', 'cancelled'] } } },
    { $group: { _id: { $ifNull: ['$reason', '-'] }, n: { $sum: 1 }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } } } },
    { $sort: { n: -1 } }, { $limit: 10 },
  ])).map((r) => ({ k: r._id || '-', ...pick(r) }));

  const [aud] = await SgCMsg.aggregate([
    { $match: m },
    {
      $group: {
        _id: null,
        member: { $sum: { $cond: ['$known', 1, 0] } },
        nonmember: { $sum: { $cond: [{ $and: [{ $ne: ['$known', true] }, { $ne: ['$last10', ''] }] }, 1, 0] } },
        invalid: { $sum: { $cond: [{ $eq: ['$last10', ''] }, 1, 0] } },
      },
    },
  ]);

  // When: reads by weekday and hour (or the chosen status).
  const heatStatus = f.st || 'read';
  const heat = (await SgCMsg.aggregate([
    { $match: { ...match({ ...f, st: heatStatus }), at: { $ne: null } } },
    { $group: { _id: { d: { $dayOfWeek: { date: '$at', timezone: TZ } }, h: { $hour: { date: '$at', timezone: TZ } } }, n: { $sum: 1 } } },
  ])).map((r) => ({ d: r._id.d, h: r._id.h, n: r.n }));

  // The matrix: every campaign, grouped under the page that sent it.
  const camp = await SgCMsg.aggregate([
    { $match: m },
    {
      $group: {
        _id: '$campaignId', name: { $first: '$campaignName' }, source: { $first: '$source' },
        firstAt: { $min: '$at' }, lastAt: { $max: '$at' }, total: { $sum: 1 }, ...statusCols(),
        replied: { $addToSet: { $cond: ['$replied', '$last10', '$$REMOVE'] } },
      },
    },
    { $sort: { source: 1, firstAt: -1 } }, { $limit: 1000 },
  ]);
  const meta = new Map((await SgCStat.find({ _id: { $in: camp.map((c) => c._id) } }, { templateName: 1, createdByName: 1 }).lean()).map((c) => [String(c._id), c]));
  const campaigns = camp.map((c) => ({
    id: String(c._id), ...pick(c), replied: c.replied.length, sourceLabel: SOURCES[c.source] || c.source,
    tpl: (meta.get(String(c._id)) || {}).templateName || '', byname: (meta.get(String(c._id)) || {}).createdByName || '',
  }));

  return {
    filters: f, kpi, prev, time, timeLevel: level, bySource, sourceLevel, templates, reasons,
    audience: aud ? pick(aud) : { member: 0, nonmember: 0, invalid: 0 }, heat, heatStatus, campaigns,
  };
}

/** The detailed view: one page of messages. */
async function rows(query) {
  const f = clean(query);
  const m = match(f);
  const cols = { at: 'at', phone: 'phone', status: 'status', campaign: 'campaignName', template: 'templateName', reason: 'reason' };
  const sortKey = cols[String(query.sort || 'at')] || 'at';
  const dir = String(query.dir) === 'asc' ? 1 : -1;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const total = await SgCMsg.countDocuments(m);
  const list = await SgCMsg.find(m).sort({ [sortKey]: dir, _id: -1 }).skip((page - 1) * DETAIL_PAGE).limit(DETAIL_PAGE).lean();
  return {
    total, page, pages: Math.max(1, Math.ceil(total / DETAIL_PAGE)), per: DETAIL_PAGE,
    rows: list.map((r) => ({
      id: String(r._id), at: r.at, phone: r.phone, status: r.status, tpl: r.templateName || '', error: r.error || '',
      reason: r.reason || '', replied: !!r.replied, known: !!r.known, cid: String(r.campaignId), campaign: r.campaignName,
      source: r.source, sourceLabel: SOURCES[r.source] || r.source,
    })),
  };
}

/** Every message for the filters, newest first, for the CSV. */
function cursor(query) {
  return SgCMsg.find(match(clean(query))).sort({ _id: -1 }).lean().cursor();
}

async function choices() {
  return {
    campaigns: (await SgCStat.find({}, { campaignName: 1, source: 1, total: 1, firstAt: 1, createdAt: 1 }).sort({ firstAt: -1, createdAt: -1 }).lean())
      .map((c) => ({ id: String(c._id), name: c.campaignName, source: c.source, total: c.total })),
    templates: (await SgCMsg.aggregate([
      { $match: { templateName: { $nin: [null, ''] } } },
      { $group: { _id: '$templateName', n: { $sum: 1 } } }, { $sort: { n: -1 } },
    ])).map((t) => ({ name: t._id, n: t.n })),
  };
}

async function campaignId(name) {
  const c = await SgCStat.findOne({ campaignName: String(name || '') }, { _id: 1 }).lean();
  return c ? String(c._id) : '';
}

module.exports = { data, rows, cursor, choices, campaignId, SOURCES };
