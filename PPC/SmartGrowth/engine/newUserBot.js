// Autobot > New User Bot — an uploaded list of numbers (people who are not on
// Rent Pondy yet), sent one template a few at a time.
//
// Import: every number cleaned to 91 + ten digits; duplicates in the file,
// numbers that are already Rent Pondy users and blocked numbers are left out
// and counted. A list is saved PAUSED — switching it on is a second decision.
//
// Sending: each number is taken with one conditional update (pending/held ->
// sending), the day's quota with another, so overlapping ticks never send a
// number twice or past the day's limit. An account problem holds the number
// as 'held' and stops the pass; it goes out first once WhatsApp works again.

const XLSX = require('xlsx');
const { SgNuList, SgNuNumber } = require('../models');
const { sendTemplate } = require('../sender');
const { limit, blocks, health } = require('../guards');
const { takeSlot, runnerAllowed, runnerWhy } = require('./pace');
const { knownNumbersSet } = require('./known');
const sg = require('../client');
const U = require('../util');

const KIND = 'newuser';
const TICK_BATCH = 25;
const TICK_WAIT = 40;
const MAX_DELAY = 3600;
const MAX_QUOTA = 100000;
const NAME_FALLBACK = 'Friend';

/** A cell that may hold a phone, cleaned; '' when it is not a dialable mobile. */
function cleanPhone(raw) {
  const d = U.digits(raw).replace(/^0+/, '');
  if (d.length === 10 && U.isMobile10(d)) return '91' + d;
  if (d.length === 12 && d.startsWith('91') && U.isMobile10(d.slice(2))) return d;
  return '';
}

function cleanName(raw) {
  const n = String(raw === undefined || raw === null ? '' : raw).replace(/\s+/g, ' ').trim();
  if (!n || /^\+?\d[\d\s-]*$/.test(n)) return '';
  return n.slice(0, 60);
}

/**
 * Read a sheet of numbers. The phone column is the first one where most
 * cells clean to a number; the name column the first mostly-words column.
 * A header row is skipped by the same test.
 */
function readNumbers(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', raw: false, cellText: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('That file has no sheets in it.');
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }).filter((r) => Array.isArray(r) && r.some((c) => String(c).trim()));
  if (!rows.length) throw new Error('That file is empty.');
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const sample = rows.slice(0, 200);
  let phoneCol = -1;
  let best = 0;
  for (let c = 0; c < width; c++) {
    const n = sample.filter((r) => cleanPhone(r[c])).length;
    if (n > best) { best = n; phoneCol = c; }
  }
  if (phoneCol < 0) throw new Error('No column of phone numbers was found in that file.');
  let nameCol = -1;
  for (let c = 0; c < width; c++) {
    if (c === phoneCol) continue;
    const n = sample.filter((r) => cleanName(r[c])).length;
    if (n >= sample.length / 3) { nameCol = c; break; }
  }
  return rows.map((r) => ({ phone: r[phoneCol], name: nameCol >= 0 ? r[nameCol] : '' }));
}

async function importList(listId, buffer) {
  const members = await knownNumbersSet();
  const blocked = await blocks.all(true);
  const c = { total: 0, valid: 0, dup: 0, invalid: 0, member: 0, blocked: 0 };
  const seen = new Set();
  const docs = [];
  for (const row of readNumbers(buffer)) {
    const p = cleanPhone(row.phone);
    // A header row is not a number either; it is not worth counting as one.
    if (!p) { if (U.digits(row.phone).length) c.invalid++; c.total++; continue; }
    c.total++;
    const k = p.slice(-10);
    if (members.has(k)) { c.member++; continue; }
    if (blocked.has(k)) { c.blocked++; continue; }
    if (seen.has(p)) { c.dup++; continue; }
    seen.add(p);
    docs.push({ listId, phone: p, name: cleanName(row.name), status: 'pending' });
  }
  for (let i = 0; i < docs.length; i += 2000) {
    try { await SgNuNumber.insertMany(docs.slice(i, i + 2000), { ordered: false }); }
    catch (e) { if (!(e && (e.code === 11000 || e.writeErrors))) throw e; }
  }
  c.valid = await SgNuNumber.countDocuments({ listId });
  c.dup += docs.length - c.valid;
  return c;
}

function params(l, n) {
  const map = l.varMap && typeof l.varMap === 'object' ? l.varMap : {};
  const out = [];
  for (let i = 1; i <= (Number(l.varCount) || 0); i++) {
    const spec = String(map[String(i)] || '');
    if (spec.startsWith('text:')) { out.push(spec.slice(5)); continue; }
    if (spec === 'name') {
      const nm = String(n.name || '').trim();
      out.push(nm ? nm.split(' ')[0] : (String(l.nameFallback || '').trim() || NAME_FALLBACK));
      continue;
    }
    out.push('');
  }
  return out;
}

class NewUserBot {
  constructor() { this.log = []; this.probe = false; this.halted = false; this.budget = { left: TICK_WAIT }; }
  say(m) { this.log.push(m); }

  async note(id, detail) {
    await SgNuList.updateOne({ _id: id }, { $set: { lastRunAt: new Date(), lastDetail: String(detail).slice(0, 500) } });
  }

  /** A number left 'sending' by a crash is failed, never sent twice. */
  async recover() {
    await SgNuNumber.updateMany({ status: 'sending', sentAt: { $lt: new Date(Date.now() - 10 * 60000) } },
      { $set: { status: 'failed', detail: 'interrupted while sending - not sent again' } });
  }

  async run() {
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) { this.say('New User Bot: no SmartGrowth credentials saved.'); return 0; }
    if (!runnerAllowed()) { this.say('New User Bot: ' + runnerWhy()); return 0; }
    await this.recover();
    const lists = await SgNuList.find({ status: 'running' }).sort({ _id: 1 }).lean();
    if (!lists.length) { this.say('New User Bot: no list is switched on.'); return 0; }
    if (await health.isDown()) {
      if (!(await health.claimProbe())) { this.say('New User Bot: on hold — WhatsApp sending stopped.'); return 0; }
      this.probe = true;
    }
    let total = 0;
    for (const l of lists) {
      total += await this.runOne(l);
      if (this.halted) break;
    }
    return total;
  }

  /** "Send now" on one list — the same turn as the scheduler, behind the same health gate. */
  async runNow(id) {
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) { this.say('New User Bot: no SmartGrowth credentials saved.'); return 0; }
    const l = await SgNuList.findById(id).lean();
    if (!l) { this.say('No such list.'); return 0; }
    if (l.status !== 'running') { this.say('That list is ' + l.status + ' — switch it on first.'); return 0; }
    await this.recover();
    if (await health.isDown()) {
      if (!(await health.claimProbe())) {
        const st = await health.status();
        this.say('On hold — WhatsApp sending stopped (' + st.reason + '). It retries by itself.');
        return 0;
      }
      this.probe = true;
    }
    return this.runOne(l);
  }

  async next(listId, n) {
    const held = await SgNuNumber.find({ listId, status: 'held' }).sort({ _id: 1 }).limit(n).lean();
    if (held.length >= n) return held;
    return held.concat(await SgNuNumber.find({ listId, status: 'pending' }).sort({ _id: 1 }).limit(n - held.length).lean());
  }

  async takeQuota(id, today) {
    await SgNuList.updateOne({ _id: id, quotaDate: { $ne: today } }, { $set: { quotaDate: today, sentToday: 0 } });
    const l = await SgNuList.findById(id, { dailyQuota: 1 }).lean();
    const r = await SgNuList.updateOne({ _id: id, quotaDate: today, sentToday: { $lt: Number(l.dailyQuota) || 0 } }, { $inc: { sentToday: 1 } });
    return r.modifiedCount === 1;
  }

  async giveQuota(id, today) {
    await SgNuList.updateOne({ _id: id, quotaDate: today, sentToday: { $gt: 0 } }, { $inc: { sentToday: -1 } });
  }

  async finishIfDone(id, label) {
    const open = await SgNuNumber.countDocuments({ listId: id, status: { $in: ['pending', 'held', 'sending'] } });
    if (open > 0) return;
    await SgNuList.updateOne({ _id: id, status: 'running' }, { $set: { status: 'done', lastRunAt: new Date(), lastDetail: 'Finished - every number has had its message.' } });
    this.say(label + ': finished.');
  }

  async runOne(l) {
    const id = l._id;
    const delay = Math.max(0, Number(l.sendDelay) || 0);
    const label = 'New User Bot "' + l.name + '"';
    if (!U.inHours(l.hourFrom, l.hourTo)) {
      await this.note(id, 'Outside sending hours (' + U.hoursLabel(l.hourFrom, l.hourTo) + ', India time). Waiting.');
      this.say(label + ': outside sending hours.');
      return 0;
    }
    const today = U.istToday();
    const used = l.quotaDate === today ? Number(l.sentToday) || 0 : 0;
    if (used >= Number(l.dailyQuota)) {
      await this.note(id, 'Today’s limit of ' + Number(l.dailyQuota).toLocaleString('en-IN') + ' is used - resumes tomorrow.');
      this.say(label + ': daily limit reached.');
      return 0;
    }
    const rows = await this.next(id, this.probe ? 1 : TICK_BATCH);
    if (!rows.length) { await this.finishIfDone(id, label); return 0; }

    let sent = 0; let failed = 0; let skipped = 0; let held = 0; let paced = false; let quotaHit = false; let lastMsg = '';
    for (const n of rows) {
      if (delay > 0 && !(await takeSlot(SgNuList, id, delay, this.budget))) { paced = true; break; }
      if (!(await this.takeQuota(id, today))) { quotaHit = true; break; }
      const got = await SgNuNumber.updateOne({ _id: n._id, status: { $in: ['pending', 'held'] } }, { $set: { status: 'sending', sentAt: new Date() } });
      if (got.modifiedCount !== 1) { await this.giveQuota(id, today); continue; }
      if (await blocks.isBlocked(n.phone)) {
        await SgNuNumber.updateOne({ _id: n._id }, { $set: { status: 'skipped', detail: 'blocked', sentAt: new Date() } });
        await this.giveQuota(id, today);
        skipped++;
        continue;
      }
      const fmt = String(l.headerFormat || '').toUpperCase();
      const r = await sendTemplate({
        templateId: l.templateId, campaignName: 'New User Bot: ' + l.name, phones: [n.phone], bodyParams: params(l, n),
        mediaUrl: ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(fmt) ? l.mediaUrl : '',
      });
      lastMsg = r.okSend ? r.msg : sg.message(r.data, r.code);
      await health.report(r.okSend, r.code, lastMsg, r.error);
      const logIt = (status) => limit.record(n.phone, KIND, {
        eventKey: 'nu:' + id + ':' + n._id, templateName: l.templateName, campaignName: 'New User Bot: ' + l.name,
        refId: String(id), status, httpCode: r.code, detail: lastMsg, createdByName: l.createdByName,
      });
      if (r.okSend) {
        await SgNuNumber.updateOne({ _id: n._id }, { $set: { status: 'sent', detail: '', sentAt: new Date() } });
        await logIt('sent');
        sent++;
        if (this.probe) { this.probe = false; this.say('WhatsApp sending works again.'); }
        continue;
      }
      if (health.isAccountProblem(r.code, lastMsg, r.error)) {
        await SgNuNumber.updateOne({ _id: n._id }, { $set: { status: 'held', detail: lastMsg.slice(0, 255) } });
        await this.giveQuota(id, today);
        held++;
        this.halted = true;
        break;
      }
      await SgNuNumber.updateOne({ _id: n._id }, { $set: { status: 'failed', detail: lastMsg.slice(0, 255), sentAt: new Date() } });
      await logIt('failed');
      failed++;
      if (this.probe) { this.halted = true; break; }
    }
    if (sent + failed + skipped + held === 0 && paced) return 0;
    const left = await SgNuNumber.countDocuments({ listId: id, status: { $in: ['pending', 'held'] } });
    const detail = (held ? 'Stopped - WhatsApp is not working (' + lastMsg + '). Holding; resumes by itself. ' : '')
      + sent + ' sent, ' + failed + ' failed' + (skipped ? ', ' + skipped + ' blocked' : '') + ' this turn. '
      + left.toLocaleString('en-IN') + ' left.' + (quotaHit ? ' Today’s limit reached - resumes tomorrow.' : '')
      + (delay > 0 ? ' One every ' + delay + 's.' : '');
    await this.note(id, detail);
    this.say(label + ': ' + detail);
    if (left === 0) await this.finishIfDone(id, label);
    return sent;
  }
}

async function lists() {
  const rows = await SgNuList.find({}).sort({ _id: -1 }).limit(100).lean();
  const counts = await SgNuNumber.aggregate([
    { $match: { listId: { $in: rows.map((r) => r._id) } } },
    { $group: { _id: { l: '$listId', s: '$status' }, n: { $sum: 1 } } },
  ]);
  const by = {};
  for (const c of counts) { const k = String(c._id.l); (by[k] = by[k] || {})[c._id.s] = c.n; }
  const today = U.istToday();
  return rows.map((r) => {
    const c = by[String(r._id)] || {};
    const g = (k) => c[k] || 0;
    return {
      ...r, id: String(r._id),
      nSent: g('sent'), nFailed: g('failed'), nHeld: g('held'), nSkipped: g('skipped'), nPending: g('pending') + g('sending'),
      nTotal: Object.values(c).reduce((a, b) => a + b, 0),
      today: r.quotaDate === today ? r.sentToday : 0, hours: U.hoursLabel(r.hourFrom, r.hourTo),
    };
  });
}

module.exports = { NewUserBot, importList, lists, params, KIND, MAX_DELAY, MAX_QUOTA };
