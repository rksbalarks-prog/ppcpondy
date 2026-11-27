// Autobot > Reminder Bot — the bot follows up everybody who has something
// left to do, UNTIL THEY DO IT. The calls an office would make, on WhatsApp.
//
// PM_Matri_Admin's four reminders were matrimony ones (partner preference,
// photo, profile, payment). Rent Pondy's, in turn order:
//
//   post_property     signed in, never listed a property
//   add_photos        has a live listing (active / pending / incomplete) with no photos
//   complete_listing  has a listing still marked incomplete
//   renew_listing     has an expired listing and nothing active
//
// NO END DATE. Somebody with no photos is reminded about photos until the
// photos are there. When nothing is left the follow-up ends ("completed").
// Block stops everything at once.
//
// ONE REMINDER AT A TIME, IN TURN: each message is about the next thing in the
// order above they still have not done, after the one they were last told
// about — and round again. Something they do drops out of the turn.
//
// HOW OFTEN: the first goes on their day 1, the next remindEvery days later.
// WHO STARTS WHEN: people who sign up after the follow-up is first switched on
// start the day after they sign up; everybody before that starts
// startPerDay at a time, newest first.
//
// ALWAYS A TEMPLATE, and only one Meta filed as UTILITY — a MARKETING one is
// dearer and is never sent; that reminder simply waits until a UTILITY
// template is named. (PM also sent a free bot message inside the 24-hour
// window; Rent Pondy has no WhatsApp bot answering chats, so there is no free
// path here.)
//
// THE CLAIM: a sg_reminder_logs row is written BEFORE anything is sent,
// unique on (phone, follow-up day): never two reminders on one day.

const { SgReminder, SgFollowupSetting, SgFollowup, SgReminderLog } = require('../models');
const { sendTemplate } = require('../sender');
const { limit, blocks, health } = require('../guards');
const tpl = require('../templates');
const audience = require('./audience');
const { takeSlot, runnerAllowed, runnerWhy } = require('./pace');
const sg = require('../client');
const U = require('../util');

const AddModel = require('../../AddModel');

const KIND = 'reminder';
const MAX_PER_TICK = 25;
const MAX_NEW_PER_TICK = 500;
const GAP_HOURS = 20;
const TICK_WAIT = 40;
const MAX_DELAY = 3600;
const DEFAULT_EVERY = 10;
const MAX_EVERY = 180;
const UTILITY_ONLY = true;

const ORDER = ['post_property', 'add_photos', 'complete_listing', 'renew_listing'];
const KINDS = {
  post_property:    { label: 'Post your property', needs: 'Signed in, never listed a property', cap: 100 },
  add_photos:       { label: 'Add photos', needs: 'A live listing with no photos', cap: 100 },
  complete_listing: { label: 'Complete your listing', needs: 'A listing still marked incomplete', cap: 100 },
  renew_listing:    { label: 'Renew your listing', needs: 'An expired listing and nothing active', cap: 100 },
};

/** Make sure the setting row and the four reminders exist. */
async function ensure() {
  await SgFollowupSetting.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true });
  for (const k of ORDER) {
    await SgReminder.updateOne({ kind: k }, { $setOnInsert: { kind: k, name: KINDS[k].label, status: 'on', dailyCap: KINDS[k].cap, templateName: '', varMap: { 1: 'first_name' } } }, { upsert: true });
  }
}

// ── Who needs what, right now ──────────────────────────────────────────────
let needsCache = null;
let needsAt = 0;

async function needsNow(fresh = false) {
  if (!fresh && needsCache && Date.now() - needsAt < 120000) return needsCache;
  const logins = await audience.loginMap();
  const props = await AddModel.find({ isDeleted: { $ne: true }, phoneNumber: { $nin: [null, ''] } })
    .select('phoneNumber status photos ownerName rentId area city createdAt').lean();
  const owners = new Map();
  for (const p of props) {
    const k = U.key10(p.phoneNumber);
    if (!U.isMobile10(k)) continue;
    const o = owners.get(k) || { statuses: new Set(), noPhotoLive: false, name: '', rentId: undefined, area: '', since: p.createdAt, rentFor: {} };
    o.statuses.add(p.status);
    // The listing each reminder is about, so a message quotes ITS Rent ID.
    if (['active', 'pending', 'incomplete'].includes(p.status) && !(Array.isArray(p.photos) && p.photos.length)) { o.noPhotoLive = true; o.rentFor.add_photos = p.rentId; }
    if (p.status === 'incomplete') o.rentFor.complete_listing = p.rentId;
    if (p.status === 'expired') o.rentFor.renew_listing = p.rentId;
    o.name = p.ownerName || o.name;
    o.rentId = p.rentId !== undefined ? p.rentId : o.rentId;
    o.area = p.area || p.city || o.area;
    owners.set(k, o);
  }
  const blocked = await blocks.all();
  const people = new Map();   // phone -> { needs:Set, name, rentId, area, since }
  const add = (k, kind, base) => {
    if (blocked.has(k)) return;
    const e = people.get(k) || { needs: new Set(), phone: k, name: base.name || '', rentId: base.rentId, area: base.area || '', since: base.since || null, rentFor: {} };
    e.needs.add(kind);
    if (base.rentFor && base.rentFor[kind] !== undefined) e.rentFor[kind] = base.rentFor[kind];
    people.set(k, e);
  };
  for (const [k, l] of logins) if (!owners.has(k)) add(k, 'post_property', l);
  for (const [k, o] of owners) {
    if (o.noPhotoLive) add(k, 'add_photos', o);
    if (o.statuses.has('incomplete')) add(k, 'complete_listing', o);
    if (o.statuses.has('expired') && !o.statuses.has('active')) add(k, 'renew_listing', o);
  }
  // A sign-in date is the better "since" for the new / existing line.
  for (const [k, e] of people) { const l = logins.get(k); if (l && l.since) e.since = l.since; }
  needsCache = people;
  needsAt = Date.now();
  return people;
}

/** The next thing in the turn after `last` that they still need and that is switched on. */
function nextKind(last, needs, enabled) {
  const i = ORDER.indexOf(last);
  for (let s = 1; s <= ORDER.length; s++) {
    const k = ORDER[(i + s + ORDER.length) % ORDER.length];
    if (needs.has(k) && enabled.has(k)) return k;
  }
  return null;
}

/** A template is usable only APPROVED, and (UTILITY_ONLY) filed UTILITY by Meta. */
async function usableTemplate(name) {
  if (!name) return { ok: false, why: 'no template named' };
  const t = await tpl.byName(name);
  if (!t) return { ok: false, why: 'template "' + name + '" is not APPROVED on SmartGrowth' };
  if (UTILITY_ONLY && String(t.category).toUpperCase() !== 'UTILITY') return { ok: false, why: 'template "' + name + '" is filed ' + t.category + ' — only UTILITY is sent' };
  return { ok: true, t };
}

class Reminder {
  constructor() { this.log = []; this.probe = false; this.budget = { left: TICK_WAIT }; }
  say(m) { this.log.push(m); }

  async setting() { await ensure(); return SgFollowupSetting.findOne({ key: 'main' }).lean(); }

  /** Start follow-ups: new sign-ups at once (day 1 = the day after), existing ones startPerDay a day. */
  async enrol(set, people) {
    const today = U.istToday();
    const launched = set.launchedAt ? new Date(set.launchedAt) : new Date();
    const have = new Set((await SgFollowup.find({}, { phone: 1 }).lean()).map((f) => f.phone));
    const fresh = [];
    const existing = [];
    for (const [k, e] of people) {
      if (have.has(k)) continue;
      if (e.since && new Date(e.since) > launched) fresh.push(e); else existing.push(e);
    }
    let started = 0;
    for (const e of fresh.slice(0, MAX_NEW_PER_TICK)) {
      const d1 = U.istToday(new Date(new Date(e.since).getTime() + 86400000));
      try { await SgFollowup.create({ phone: e.phone, day1: d1 < today ? today : d1, source: 'new' }); started++; } catch (_) { /* raced */ }
    }
    // Existing people, newest first, a few a day.
    await SgFollowupSetting.updateOne({ key: 'main', startDate: { $ne: today } }, { $set: { startDate: today, startedToday: 0 } });
    const s2 = await SgFollowupSetting.findOne({ key: 'main' }).lean();
    const room = Math.max(0, Number(s2.startPerDay) - Number(s2.startedToday || 0));
    existing.sort((a, b) => (b.since ? new Date(b.since).getTime() : 0) - (a.since ? new Date(a.since).getTime() : 0));
    let n = 0;
    for (const e of existing.slice(0, room)) {
      try { await SgFollowup.create({ phone: e.phone, day1: today, source: 'existing' }); n++; } catch (_) { /* raced */ }
    }
    if (n) await SgFollowupSetting.updateOne({ key: 'main' }, { $inc: { startedToday: n } });
    return started + n;
  }

  /** Follow-ups whose people need nothing any more are finished ("completed"). */
  async endJourneys(people, enabled) {
    const open = await SgFollowup.find({ endedAt: null }, { phone: 1 }).lean();
    const done = open.filter((f) => { const e = people.get(f.phone); return !e || ![...e.needs].some((k) => enabled.has(k)); }).map((f) => f._id);
    if (done.length) await SgFollowup.updateMany({ _id: { $in: done } }, { $set: { endedAt: new Date(), endReason: 'completed' } });
    return done.length;
  }

  /** Whoever did the thing they were reminded about: their log rows get doneAt. */
  async markDone(people) {
    const open = await SgReminderLog.find({ doneAt: null, status: 'sent' }, { phone: 1, kind: 1 }).limit(5000).lean();
    const ids = open.filter((g) => { const e = people.get(g.phone); return !e || !e.needs.has(g.kind); }).map((g) => g._id);
    if (ids.length) await SgReminderLog.updateMany({ _id: { $in: ids } }, { $set: { doneAt: new Date() } });
  }

  /** Who is due now: day 1 reached, remindEvery days since the last, never closer than GAP_HOURS. */
  async due(set, people, enabled, max) {
    const today = U.istToday();
    const every = Math.max(1, Number(set.remindEvery) || DEFAULT_EVERY);
    const gapCut = new Date(Date.now() - GAP_HOURS * 3600000);
    const rows = await SgFollowup.find({ endedAt: null, day1: { $lte: today }, $or: [{ lastSentAt: null }, { lastSentAt: { $lte: gapCut } }] })
      .sort({ lastSentAt: 1, day1: 1 }).limit(max * 10).lean();
    const out = [];
    for (const f of rows) {
      if (out.length >= max) break;
      if (f.lastSentAt && U.dayDiff(U.istToday(new Date(f.lastSentAt)), today) < every) continue;
      const e = people.get(f.phone);
      if (!e) continue;
      const kind = nextKind(f.lastKind, e.needs, enabled);
      if (!kind) continue;
      out.push({ f, e, kind, step: U.dayDiff(f.day1, today) + 1 });
    }
    return out;
  }

  async takeCap(rem, today) {
    await SgReminder.updateOne({ _id: rem._id, quotaDate: { $ne: today } }, { $set: { quotaDate: today, sentToday: 0 } });
    const r = await SgReminder.updateOne({ _id: rem._id, quotaDate: today, sentToday: { $lt: Number(rem.dailyCap) || 0 } }, { $inc: { sentToday: 1 } });
    return r.modifiedCount === 1;
  }

  async run({ manual = false } = {}) {
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) { this.say('Reminder: no SmartGrowth credentials saved.'); return 0; }
    if (!manual && !runnerAllowed()) { this.say('Reminder: ' + runnerWhy()); return 0; }
    const set = await this.setting();
    if (set.status !== 'on') { this.say('Reminder: the follow-up is paused.'); return 0; }
    if (!U.inHours(set.hourFrom, set.hourTo)) {
      await this.note('Outside sending hours (' + U.hoursLabel(set.hourFrom, set.hourTo) + ', India time). Waiting.');
      this.say('Reminder: outside sending hours.');
      return 0;
    }
    if (await health.isDown()) {
      if (!(await health.claimProbe())) { this.say('Reminder: on hold — WhatsApp sending stopped.'); return 0; }
      this.probe = true;
    }
    const rems = await SgReminder.find({}).lean();
    const enabled = new Set(rems.filter((r) => r.status === 'on').map((r) => r.kind));
    const byKind = Object.fromEntries(rems.map((r) => [r.kind, r]));
    const people = await needsNow();
    const started = await this.enrol(set, people);
    const ended = await this.endJourneys(people, enabled);
    await this.markDone(people);

    const today = U.istToday();
    const delay = Math.max(0, Number(set.sendDelay) || 0);
    const due = await this.due(set, people, enabled, this.probe ? 1 : MAX_PER_TICK);
    let sent = 0; let failed = 0; let skipped = 0; const why = new Set();
    for (const d of due) {
      const rem = byKind[d.kind];
      const use = await usableTemplate(rem.templateName);
      if (!use.ok) { why.add(rem.name + ': ' + use.why); skipped++; continue; }
      if (delay > 0 && !(await takeSlot(SgFollowupSetting, set._id, delay, this.budget))) break;
      if (!(await this.takeCap(rem, today))) { why.add(rem.name + ': today’s ' + rem.dailyCap + ' are used'); skipped++; continue; }
      // THE CLAIM: one reminder per person per follow-up day.
      let logRow;
      try { logRow = await SgReminderLog.create({ kind: d.kind, phone: d.f.phone, step: d.step, via: 'template', status: 'sending', sentAt: new Date() }); }
      catch (_) { skipped++; continue; }
      // Exactly as many values as the template has blanks — Meta counts them.
      const want = Number(use.t.variableCount) || 0;
      const person = { ...d.e, rentId: d.e.rentFor && d.e.rentFor[d.kind] !== undefined ? d.e.rentFor[d.kind] : d.e.rentId };
      const vars = audience.varsFor(rem.varMap, person).slice(0, want);
      while (vars.length < want) vars.push('');
      const r = await sendTemplate({ templateId: use.t.id, campaignName: 'Reminder: ' + rem.name, phones: ['91' + d.f.phone], bodyParams: vars });
      const msg = r.okSend ? r.msg : sg.message(r.data, r.code);
      await health.report(r.okSend, r.code, msg, r.error);
      await limit.record(d.f.phone, KIND, {
        eventKey: 'rem:' + d.f.phone + ':' + d.step, templateName: use.t.name, campaignName: 'Reminder: ' + rem.name,
        refId: d.kind, status: r.okSend ? 'sent' : 'failed', httpCode: r.code, detail: msg,
      });
      if (r.okSend) {
        await SgReminderLog.updateOne({ _id: logRow._id }, { $set: { status: 'sent', detail: msg.slice(0, 255) } });
        await SgFollowup.updateOne({ _id: d.f._id }, { $set: { lastKind: d.kind, lastSentAt: new Date() } });
        sent++;
        if (this.probe) this.probe = false;
        continue;
      }
      await SgReminderLog.updateOne({ _id: logRow._id }, { $set: { status: 'failed', detail: msg.slice(0, 255) } });
      // Give the day's slot back so a fault on our side does not cost them a reminder.
      await SgReminder.updateOne({ _id: rem._id, quotaDate: today, sentToday: { $gt: 0 } }, { $inc: { sentToday: -1 } });
      if (health.isAccountProblem(r.code, msg, r.error)) {
        await SgReminderLog.deleteOne({ _id: logRow._id });   // not sent — the same day may try again
        why.add('WhatsApp is not working (' + msg + ') — holding');
        break;
      }
      failed++;
    }
    const detail = sent + ' sent, ' + failed + ' failed, ' + skipped + ' skipped this turn.'
      + (started ? ' ' + started + ' follow-up(s) started.' : '') + (ended ? ' ' + ended + ' finished.' : '')
      + (why.size ? ' ' + [...why].join('; ') + '.' : '');
    await this.note(detail);
    this.say('Reminder: ' + detail);
    return sent;
  }

  async note(detail) {
    await SgFollowupSetting.updateOne({ key: 'main' }, { $set: { lastRunAt: new Date(), lastDetail: String(detail).slice(0, 500) } });
  }

  /** The page: settings, each reminder's figures, journey counts. */
  async overview() {
    const set = await this.setting();
    const people = await needsNow();
    const rems = await SgReminder.find({}).lean();
    const today = U.istToday();
    const stats = await SgReminderLog.aggregate([
      { $group: { _id: '$kind', sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }, worked: { $sum: { $cond: [{ $ne: ['$doneAt', null] }, 1, 0] } } } },
    ]);
    const st = Object.fromEntries(stats.map((x) => [x._id, x]));
    const needCount = {};
    for (const e of people.values()) for (const k of e.needs) needCount[k] = (needCount[k] || 0) + 1;
    const reminders = [];
    for (const k of ORDER) {
      const r = rems.find((x) => x.kind === k);
      if (!r) continue;
      const use = await usableTemplate(r.templateName);
      reminders.push({
        id: String(r._id), kind: k, name: r.name, needs: KINDS[k].needs, status: r.status, dailyCap: r.dailyCap,
        templateName: r.templateName || '', varMap: r.varMap || {}, templateOk: use.ok, templateWhy: use.ok ? '' : use.why,
        sentToday: r.quotaDate === today ? r.sentToday : 0, needNow: needCount[k] || 0,
        sent: (st[k] || {}).sent || 0, failed: (st[k] || {}).failed || 0, worked: (st[k] || {}).worked || 0,
      });
    }
    const [active, ended] = await Promise.all([SgFollowup.countDocuments({ endedAt: null }), SgFollowup.countDocuments({ endedAt: { $ne: null } })]);
    return {
      followup: { ...set, active, ended, waitingToStart: Math.max(0, people.size - active - ended), startedToday: set.startDate === today ? set.startedToday : 0 },
      reminders,
    };
  }

  /** Who the follow-up would message right now. Sends nothing. */
  async preview(max = 50) {
    const set = await this.setting();
    const rems = await SgReminder.find({}).lean();
    const enabled = new Set(rems.filter((r) => r.status === 'on').map((r) => r.kind));
    const people = await needsNow(true);
    const due = await this.due(set, people, enabled, max);
    return due.map((d) => ({ phone: d.f.phone, name: d.e.name || '', kind: d.kind, label: KINDS[d.kind].label, day: d.step, needs: [...d.e.needs].map((k) => KINDS[k].label) }));
  }
}

module.exports = { Reminder, KINDS, ORDER, ensure, MAX_EVERY, MAX_DELAY, KIND };
