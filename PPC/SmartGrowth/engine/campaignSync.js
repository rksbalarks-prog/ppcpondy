// Campaign Report's local copy of what SmartGrowth knows about this account:
// sg_cstats (one row per campaign, with its counts) and sg_cmsgs (one row per
// message). The report is sliced a dozen ways a minute and cannot ask
// SmartGrowth for every click, so it reads the copy; this refreshes it.
//
// All read-only GETs (no messages, no credits):
//   /api/get-campaigns                                every campaign name
//   /api/get-campaign-stats?campaignName=             the six counts
//   /api/get-campaign-messages?campaignName=&status=&limit=&page=
//   /api/campaign-reply-numbers/?campaignName=        who wrote back
//
// ONE CALL PER STATUS, NOT PAGES. SmartGrowth's paging is not stable — on PM's
// account page 1 and page 2 of 1,000 shared 44 rows and 44 others were on
// neither — but one page as big as the status holds comes back whole. So each
// status is asked for in one piece up to BUCKET_MAX, and duplicates dropped.
//
// A campaign's messages are copied again only when its counts changed since
// the last copy; a first copy of a big account goes in SYNC_BUDGET pieces and
// the page keeps asking until nothing is left.
//
// WHICH PAGE SENT IT (`source`), from the name:
//   send      in the campaign log — Send Message
//   chat      the same log, a "-chat-" name — a template sent from Chats
//   run       an Autobot run's name
//   reminder  "Reminder: ..."
//   newuser   "New User Bot: ..."
//   action    "Action: ..."
//   site      anything else — sent from SmartGrowth's own website

const sg = require('../client');
const { SgCStat, SgCMsg, SgCampaignLog, SgRun, SgNuList, SgSettings } = require('../models');
const { knownNumbersSet } = require('./known');
const U = require('../util');

const BUCKET_MAX = 50000;
const PARALLEL = 8;
const SYNC_BUDGET_MS = 25000;
const MIN_GAP_MS = 120000;

const SOURCES = {
  send: 'Send Message', chat: 'Chats', run: 'Autobot runs', reminder: 'Reminder',
  newuser: 'New User Bot', action: 'Action messages', site: 'SmartGrowth site',
};
const STATUSES = ['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled'];

let busy = false;

async function lastSync() {
  const s = await SgSettings.findOne({ key: 'main' }, { reportSyncedAt: 1 }).lean();
  return s && s.reportSyncedAt ? new Date(s.reportSyncedAt).getTime() : 0;
}

async function pendingCount() {
  return SgCStat.countDocuments({ statsKey: { $ne: null }, $or: [{ msgsAt: null }, { msgKey: null }, { $expr: { $ne: ['$msgKey', '$statsKey'] } }] });
}

function sourceOf(name) {
  if (name.startsWith('Reminder: ')) return 'reminder';
  if (name.startsWith('New User Bot: ')) return 'newuser';
  if (name.startsWith('Action: ')) return 'action';
  return 'site';
}

/** What this admin knows about names it sent: page, template, who, when. */
async function localKnowledge() {
  const k = {};
  const logs = await SgCampaignLog.aggregate([
    { $match: { campaignName: { $nin: [null, ''] } } },
    { $group: { _id: '$campaignName', t: { $max: '$templateName' }, b: { $max: '$createdByName' }, a: { $min: '$createdAt' } } },
  ]);
  for (const r of logs) {
    const n = String(r._id).trim();
    k[n] = { source: n.includes('-chat-') ? 'chat' : 'send', template: r.t, by: r.b, at: r.a };
  }
  for (const r of await SgRun.find({}, { name: 1, templateName: 1, createdByName: 1 }).lean())
    k[String(r.name || '').trim()] = { source: 'run', template: r.templateName, by: r.createdByName, at: null };
  for (const r of await SgNuList.find({}, { name: 1, templateName: 1, createdByName: 1 }).lean())
    k['New User Bot: ' + r.name] = { source: 'newuser', template: r.templateName, by: r.createdByName, at: null };
  return k;
}

async function getMany(paths) {
  return sg.many('GET', paths, PARALLEL, 120);
}

/** Every campaign's counts; new names get a row. Answers '' or an error. */
async function refreshStats() {
  const [list] = await getMany(['/api/get-campaigns']);
  if (list.code !== 200 || !list.data)
    return 'SmartGrowth did not return the campaign list (HTTP ' + list.code + (list.error ? ', ' + list.error : '') + ').';
  const names = [];
  const seen = new Set();
  for (const one of sg.listOf(list.data)) {
    const n = String(one && typeof one === 'object' ? (one.campaignName || '') : (one || '')).trim();
    if (n && n.length <= 191 && !seen.has(n)) { seen.add(n); names.push(n); }
  }
  const known = await localKnowledge();
  const rows = new Map((await SgCStat.find({}, { campaignName: 1 }).lean()).map((x) => [x.campaignName, x]));
  const res = await getMany(names.map((n) => '/api/get-campaign-stats?campaignName=' + encodeURIComponent(n)));
  const now = new Date();
  for (let i = 0; i < names.length; i++) {
    const n = names[i];
    const d = res[i].data;
    if (res[i].code !== 200 || !d || !d.data || typeof d.data !== 'object') continue;
    const c = {};
    for (const st of STATUSES) c[st] = Math.max(0, Number(d.data[st]) || 0);
    const k = known[n] || { source: sourceOf(n), template: null, by: null, at: null };
    const set = {
      source: k.source, ...c, total: STATUSES.reduce((a, st) => a + c[st], 0),
      statsKey: STATUSES.map((st) => c[st]).join(','), statsAt: now,
    };
    if (k.template) set.templateName = String(k.template).slice(0, 120);
    if (k.by) set.createdByName = String(k.by).slice(0, 100);
    if (rows.has(n)) await SgCStat.updateOne({ _id: rows.get(n)._id }, { $set: set });
    else await SgCStat.create({ campaignName: n, ...set, ...(k.at ? { firstAt: k.at } : {}) });
  }
  return '';
}

/** The calls that fetch one campaign's messages: [status, limit, page]. */
function buckets(c) {
  const out = [];
  for (const st of STATUSES) {
    const n = Number(c[st]) || 0;
    if (n <= 0) continue;
    const want = n + 100 + Math.floor(n / 50);
    if (want <= BUCKET_MAX) { out.push([st, want, 1]); continue; }
    for (let p = 1; p <= Math.ceil(n / BUCKET_MAX); p++) out.push([st, BUCKET_MAX, p]);
  }
  return out;
}

/** SmartGrowth stores some of Meta's texts double-encoded ("There’s" as "Thereâ€™s"). Put those back. */
function unmangle(s) {
  if (!/â€|Ã[\u0080-¿]/.test(s)) return s;
  try {
    const bytes = Buffer.from([...s].map((ch) => {
      const cp = ch.codePointAt(0);
      const map = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f };
      if (cp < 256) return cp;
      if (map[cp] !== undefined) return map[cp];
      throw new Error('not cp1252');
    }));
    const back = bytes.toString('utf8');
    return back.includes('�') ? s : back;
  } catch (_) {
    return s;
  }
}

/** The same fault with a different number or name in it is one reason. */
function reasonOf(err) {
  err = String(err || '').trim();
  if (!err) return '';
  const m = err.match(/^(Invalid phone number|No rate found for phone)\b/i);
  return m ? m[1] : err;
}

/** Replace one campaign's messages with what SmartGrowth sent back. */
async function store(c, msgs, replies, known) {
  const docs = [];
  const seen = new Set();
  const tpl = {};
  let first = null;
  let last = null;
  for (const m of msgs) {
    const mid = String(m._id || '');
    if (mid) { if (seen.has(mid)) continue; seen.add(mid); }   // a page boundary moved under us
    // Kept even when `to` is not a number: a campaign sent to a column of
    // names is explained by exactly these rows.
    const raw = String(m.to || '').trim();
    if (!raw) continue;
    const d = U.digits(raw);
    const last10 = d.length >= 10 ? d.slice(-10) : '';
    let st = String(m.status || '').toLowerCase().trim();
    if (!STATUSES.includes(st)) st = st.slice(0, 10);
    const at = m.updatedOn ? new Date(m.updatedOn) : null;
    if (at && !Number.isNaN(at.getTime())) {
      if (!first || at < first) first = at;
      if (!last || at > last) last = at;
    }
    const t = String(m.templateName || '').slice(0, 120);
    if (t) tpl[t] = (tpl[t] || 0) + 1;
    let err = m.error === undefined || m.error === null ? '' : (typeof m.error === 'string' ? m.error : JSON.stringify(m.error));
    err = unmangle(err.replace(/\s+/g, ' ').trim());
    docs.push({
      campaignId: c._id, campaignName: c.campaignName, source: c.source,
      phone: (d.length >= 7 ? d : raw).slice(0, 20), last10, status: st, templateName: t || undefined,
      error: err ? err.slice(0, 255) : undefined, reason: reasonOf(err) ? reasonOf(err).slice(0, 160) : undefined,
      at: at && !Number.isNaN(at.getTime()) ? at : undefined, replied: replies.has(last10), known: !!(last10 && known.has(last10)),
    });
  }
  await SgCMsg.deleteMany({ campaignId: c._id });
  for (let i = 0; i < docs.length; i += 2000) await SgCMsg.insertMany(docs.slice(i, i + 2000), { ordered: false });
  const set = { msgsAt: new Date(), msgKey: c.statsKey, replied: replies.size };
  if (first) { set.firstAt = c.firstAt && c.firstAt < first ? c.firstAt : first; set.lastAt = last; }
  if (!c.templateName) {
    const top = Object.entries(tpl).sort((a, b) => b[1] - a[1])[0];
    if (top) set.templateName = top[0];
  }
  await SgCStat.updateOne({ _id: c._id }, { $set: set });
}

/** Copy the messages of every campaign whose counts changed, until the budget is spent. */
async function copyMessages(start) {
  const todo = await SgCStat.find({ statsKey: { $ne: null }, $or: [{ msgsAt: null }, { msgKey: null }, { $expr: { $ne: ['$msgKey', '$statsKey'] } }] })
    .sort({ msgsAt: 1, lastAt: -1 }).lean();
  if (!todo.length) return [];
  const log = [];
  let known = null;
  while (todo.length && Date.now() - start < SYNC_BUDGET_MS) {
    const round = [];
    let calls = 0;
    while (todo.length && (calls < PARALLEL * 3 || !round.length)) {
      const c = todo.shift();
      round.push(c);
      calls += 1 + buckets(c).length;
    }
    const paths = [];
    const map = [];
    round.forEach((c, ci) => {
      const q = '/api/get-campaign-messages?campaignName=' + encodeURIComponent(c.campaignName);
      for (const [st, lim, page] of buckets(c)) { paths.push(q + '&status=' + st + '&limit=' + lim + '&page=' + page); map.push([ci, 'm']); }
      paths.push('/api/campaign-reply-numbers/?campaignName=' + encodeURIComponent(c.campaignName));
      map.push([ci, 'r']);
    });
    const res = await getMany(paths);
    if (!known) known = await knownNumbersSet();
    const got = {};
    const replies = {};
    const bad = new Set();
    res.forEach((r, i) => {
      const [ci, what] = map[i];
      if (r.code !== 200 || !r.data) { bad.add(ci); return; }
      if (what === 'r') {
        replies[ci] = replies[ci] || new Set();
        for (const x of Array.isArray(r.data.replies) ? r.data.replies : []) {
          const d = U.digits(x && x.phoneNumber);
          if (d.length >= 10) replies[ci].add(d.slice(-10));
        }
        return;
      }
      for (const m of Array.isArray(r.data.data) ? r.data.data : [])
        if (m && String(m.status || '').trim()) (got[ci] = got[ci] || []).push(m);
    });
    for (let ci = 0; ci < round.length; ci++) {
      if (bad.has(ci)) { log.push('Could not read ' + round[ci].campaignName + ' - tried again next time.'); continue; }
      await store(round[ci], got[ci] || [], replies[ci] || new Set(), known);
    }
  }
  return log;
}

/**
 * Refresh the copy. Answers { state, message, pending }:
 *   done | partial (call again) | fresh (copied < 2 min ago) | busy | error
 */
async function sync(force = false) {
  const s = await sg.settings();
  if (!s.apiToken) return { state: 'error', message: 'No SmartGrowth API token saved (Send Message > More Info).', pending: 0 };
  const before = await pendingCount();
  const last = await lastSync();
  if (!force && before === 0 && Date.now() - last < MIN_GAP_MS)
    return { state: 'fresh', message: 'Copied ' + Math.round((Date.now() - last) / 1000) + 's ago.', pending: 0 };
  if (busy) return { state: 'busy', message: 'Another copy is running.', pending: before };
  busy = true;
  const start = Date.now();
  try {
    if (before === 0 || Date.now() - last >= MIN_GAP_MS) {
      const err = await refreshStats();
      if (err) return { state: 'error', message: err, pending: before };
      await SgSettings.updateOne({ key: 'main' }, { $set: { reportSyncedAt: new Date() } });
    }
    await copyMessages(start);
  } catch (e) {
    return { state: 'error', message: e.message, pending: await pendingCount() };
  } finally {
    busy = false;
  }
  const left = await pendingCount();
  return { state: left ? 'partial' : 'done', message: left ? left + ' campaign(s) still to copy.' : 'Up to date.', pending: left };
}

module.exports = { sync, lastSync, SOURCES, STATUSES, reasonOf };
