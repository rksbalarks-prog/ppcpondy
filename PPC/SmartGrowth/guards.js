// The three rules every sender obeys: the daily cap, the block list, and
// "sending has stopped because the account itself is failing".
//
// Every place the panel sends from — Send Message, a sheet campaign, a chat
// reply, a template from Chats, the action messages and the three Autobot
// senders — calls these. A limit only one of them respects is not a limit.

const { SgSettings, SgSendLog, SgBlock } = require('./models');
const { key91, key10, istDayStart } = require('./util');

// =====================================================================
//  LIMITS — how many messages one number may receive in a day.
//
//  campaign, action   capped. We decided to send these, so we can decide not to.
//  everything else    only counted. A chat reply is somebody answering a person
//                     who just wrote in; refusing that is a silence they cannot
//                     interpret. Bot senders have their own daily quotas.
// =====================================================================

const CAPPED = new Set(['campaign', 'action']);

async function capFor(kind) {
  const s = await SgSettings.findOne({ key: 'main' }).lean();
  if (!s || s.capEnabled === false) return 0;
  if (kind === 'campaign') return Math.max(0, Number(s.capCampaign ?? 1));
  if (kind === 'action') return Math.max(0, Number(s.capAction ?? 2));
  return 0;
}

async function sentToday(phone, kind) {
  const k = key91(phone);
  if (!k) return 0;
  return SgSendLog.countDocuments({ phone: k, kind, status: 'sent', createdAt: { $gte: istDayStart() } });
}

/** { ok, sent, cap } — may this number have one more of this kind today? */
async function check(phone, kind) {
  const cap = CAPPED.has(kind) ? await capFor(kind) : 0;
  if (cap <= 0) return { ok: true, sent: 0, cap: 0 };
  const sent = await sentToday(phone, kind);
  return { ok: sent < cap, sent, cap };
}

/** Split a list into the numbers to send to and the ones already at their limit — one query. */
async function filter(phones, kind) {
  const out = { allow: [], blocked: {} };
  const cap = CAPPED.has(kind) ? await capFor(kind) : 0;
  if (cap <= 0) { out.allow = [...phones]; return out; }
  const keys = [...new Set(phones.map(key91).filter(Boolean))];
  if (!keys.length) return out;
  const rows = await SgSendLog.aggregate([
    { $match: { kind, status: 'sent', createdAt: { $gte: istDayStart() }, phone: { $in: keys } } },
    { $group: { _id: '$phone', n: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  for (const p of phones) {
    const k = key91(p);
    if (!k) continue;
    const n = counts[k] || 0;
    if (n < cap) out.allow.push(p);
    else out.blocked[p] = n;
  }
  return out;
}

/**
 * Record one send or refusal. With an eventKey it is also THE CLAIM: a second
 * record with the same key is refused and this answers false — the caller
 * must then not send, because something else already has.
 */
async function record(phone, kind, o = {}) {
  const k = key91(phone);
  if (!k) return true;
  try {
    await SgSendLog.create({
      phone: k,
      kind,
      eventKey: o.eventKey || undefined,
      templateName: o.templateName || '',
      campaignName: o.campaignName || '',
      refId: o.refId ? String(o.refId) : '',
      status: o.status || 'sent',
      httpCode: o.httpCode || undefined,
      detail: o.detail ? String(o.detail).slice(0, 500) : '',
      createdByName: o.createdByName || '',
    });
  } catch (e) {
    if (e && e.code === 11000) return false;
    console.warn('[SmartGrowth] send log failed:', e.message);
  }
  return true;
}

const recordBlocked = (phone, kind, o = {}) => record(phone, kind, { ...o, status: 'blocked' });

/** Turn a claimed row into its outcome. */
async function finish(eventKey, status, code, detail) {
  try {
    await SgSendLog.updateOne({ eventKey }, { $set: { status, httpCode: Number(code) || 0, detail: String(detail || '').slice(0, 500) } });
  } catch (e) {
    console.warn('[SmartGrowth] finish failed:', e.message);
  }
}

/** Today's totals by kind, for Limits & Alerts. */
async function todayByKind() {
  const rows = await SgSendLog.aggregate([
    // 'skipped' rows are bookkeeping (a listing already approved when an
    // action was switched on) and 'sending' is a claim in flight — neither
    // is a message.
    { $match: { createdAt: { $gte: istDayStart() }, status: { $nin: ['skipped', 'sending'] } } },
    { $group: { _id: { kind: '$kind', status: '$status' }, n: { $sum: 1 }, people: { $addToSet: '$phone' } } },
  ]);
  const out = {};
  for (const r of rows) {
    const k = r._id.kind;
    if (!out[k]) out[k] = { sent: 0, blocked: 0, failed: 0, held: 0, people: 0 };
    const st = ['sent', 'blocked', 'failed', 'held'].includes(r._id.status) ? r._id.status : 'failed';
    out[k][st] += r.n;
    out[k].people = Math.max(out[k].people, r.people.length);
  }
  return out;
}

// =====================================================================
//  BLOCK — the numbers that asked us to stop. Absolute, and not one
//  sender's alone: every unattended sender and the campaign send check here.
//  Keyed by the last ten digits, so 9443278916 and 919443278916 agree.
// =====================================================================

let blockCache = null;
let blockAt = 0;

async function allBlocked(fresh = false) {
  if (!fresh && blockCache && Date.now() - blockAt < 30000) return blockCache;
  const rows = await SgBlock.find({}, { phone: 1 }).lean();
  blockCache = new Set(rows.map((r) => r.phone));
  blockAt = Date.now();
  return blockCache;
}

async function isBlocked(phone) {
  const k = key10(phone);
  if (!k) return false;
  return (await allBlocked()).has(k);
}

async function block(phone, source = 'admin', note = '', by = '') {
  const k = key10(phone);
  if (!k) return false;
  try { await SgBlock.create({ phone: k, source, note, createdByName: by }); }
  catch (e) { if (e.code !== 11000) throw e; }
  blockCache = null;
  return true;
}

async function unblock(phone) {
  const k = key10(phone);
  if (!k) return false;
  await SgBlock.deleteOne({ phone: k });
  blockCache = null;
  return true;
}

// =====================================================================
//  HEALTH — is WhatsApp sending working? Stop by itself when it is not,
//  start again by itself when it is.
//
//  A failure is an ACCOUNT problem when it would fail for anybody: expired or
//  suspended account, refused key, SmartGrowth unreachable or a server error.
//  On the first one sending is marked stopped, that message is kept as
//  'held' (not failed), and the bots hold. Every PROBE_MINUTES one waiting
//  message is tried again; the first that goes through switches sending on.
//  Read-only calls are no use for this — with the account expired, templates
//  and chats still answer 200; only a send tells.
// =====================================================================

const PROBE_MINUTES = 10;

function isAccountProblem(code, msg, curlError = '') {
  code = Number(code) || 0;
  if (String(curlError || '').trim()) return true;
  if (code === 0 || code === 401 || code === 402 || code === 403 || code === 429 || code >= 500) return true;
  return /expired|renew|subscription|suspend|unauthori[sz]ed|not authori[sz]ed|invalid (api )?(key|token)|account (is )?(inactive|disabled|blocked)|insufficient|recharge|balance/i
    .test(String(msg || ''));
}

async function isDown() {
  const s = await SgSettings.findOne({ key: 'main' }, { sendDownSince: 1 }).lean();
  return !!(s && s.sendDownSince);
}

async function report(okSend, code, msg, curlError = '') {
  try {
    if (okSend) {
      await SgSettings.updateOne({ key: 'main', sendDownSince: { $ne: null } },
        { $set: { sendDownSince: null, sendDownReason: '', sendProbeAt: null } });
      return;
    }
    if (!isAccountProblem(code, msg, curlError)) return;
    const why = String(curlError || '').trim() ? 'Could not reach SmartGrowth: ' + curlError
      : (String(msg || '').trim() || 'HTTP ' + (Number(code) || 0));
    const s = await SgSettings.findOne({ key: 'main' }, { sendDownSince: 1 }).lean();
    await SgSettings.updateOne({ key: 'main' }, {
      $set: { sendDownSince: (s && s.sendDownSince) || new Date(), sendDownReason: why.slice(0, 255), sendProbeAt: new Date() },
    });
  } catch (_) { /* never the reason a send fails */ }
}

/** While stopped: may THIS caller try one waiting message now? One claimer every PROBE_MINUTES. */
async function claimProbe() {
  const cutoff = new Date(Date.now() - PROBE_MINUTES * 60000);
  const r = await SgSettings.updateOne(
    { key: 'main', sendDownSince: { $ne: null }, $or: [{ sendProbeAt: null }, { sendProbeAt: { $lte: cutoff } }] },
    { $set: { sendProbeAt: new Date() } });
  return r.modifiedCount === 1;
}

async function healthStatus() {
  const s = await SgSettings.findOne({ key: 'main' }).lean();
  const waiting = await SgSendLog.countDocuments({ status: 'held' });
  const out = { down: false, since: null, reason: '', nextCheck: null, waiting };
  if (!s || !s.sendDownSince) return out;
  const from = s.sendProbeAt || s.sendDownSince;
  return { ...out, down: true, since: s.sendDownSince, reason: s.sendDownReason || '', nextCheck: new Date(new Date(from).getTime() + PROBE_MINUTES * 60000) };
}

module.exports = {
  limit: { check, filter, record, recordBlocked, finish, todayByKind, capFor },
  blocks: { all: allBlocked, isBlocked, block, unblock },
  health: { isAccountProblem, isDown, report, claimProbe, status: healthStatus, PROBE_MINUTES },
};
