// Autobot > WhatsApp Bot — RUNS: a filter left switched on.
//
// A CAMPAIGN is one list, sent once, now. A RUN holds a segment ("owners
// with an expired listing"), a template and a daily allowance; the scheduler
// works through the matching people a few at a time, and when it reaches the
// end it does not finish — it keeps watching, so somebody who signs up next
// week is reached without anybody starting anything again.
//
// THE DAILY ALLOWANCE IS THE POINT. A segment can be tens of thousands of
// people; without a quota, switching a run on spends that many credits before
// anyone looks, and Meta throttles a number that behaves like that.
//
// NOTHING IS SENT TWICE, and the guard is the send log, not this file: every
// send is claimed under the unique eventKey 'bcast:<run id>:<phone>' BEFORE
// it goes out. Two overlapping ticks find the key taken and move on.
//
// Through /send/campaign (not a raw message): SmartGrowth then records it in
// the chat history, so a reply lands in Chats with the message above it.

const { SgRun, SgSendLog } = require('../models');
const { sendTemplate } = require('../sender');
const { limit, blocks, health } = require('../guards');
const audience = require('./audience');
const { takeSlot, runnerAllowed, runnerWhy } = require('./pace');
const sg = require('../client');
const U = require('../util');

const KIND = 'bcast';
const MAX_PER_TICK = 25;
const TICK_WAIT = 40;          // seconds a tick may spend waiting for paced slots
const MAX_DAILY_QUOTA = 5000;
const MAX_SEND_DELAY = 3600;

const eventKey = (runId, phone) => KIND + ':' + runId + ':' + U.key10(phone);

/** Phones this run has already claimed (sent, failed, held, anything). */
async function claimedSet(runId) {
  const rows = await SgSendLog.find({ kind: KIND, refId: String(runId) }, { eventKey: 1 }).lean();
  return new Set(rows.map((r) => String(r.eventKey || '').split(':')[2]).filter(Boolean));
}

async function audienceFor(run) {
  if (run.onlyPhone) {
    const p = await audience.findOne(run.onlyPhone);
    return p && !p.blocked ? [p] : [];
  }
  return audience.list(run.segment, run.plan);
}

/** How many of the audience this run has NOT reached yet. */
async function remainingFor(run) {
  const [aud, claimed] = await Promise.all([audienceFor(run), claimedSet(run._id)]);
  return aud.filter((p) => !claimed.has(p.phone)).length;
}

class Broadcast {
  constructor() {
    this.log = [];
    this.probe = false;
    this.halted = false;
    this.budget = { left: TICK_WAIT };
  }

  say(m) { this.log.push(m); }

  /** Sending stopped? Then only ONE waiting message every few minutes, to see if it works again. */
  async gate() {
    if (!(await health.isDown())) return true;
    if (await health.claimProbe()) {
      this.probe = true;
      this.say('WhatsApp sending is stopped — trying one waiting message to see if it works again.');
      return true;
    }
    const st = await health.status();
    this.say('WhatsApp sending stopped: ' + st.reason + ' — runs are on hold, ' + st.waiting + ' message(s) waiting.');
    return false;
  }

  async note(id, detail) {
    await SgRun.updateOne({ _id: id }, { $set: { lastRunAt: new Date(), lastDetail: String(detail).slice(0, 500) } });
  }

  /** Every run that is switched on, worked a little further (the scheduled tick). */
  async run() {
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) { this.say('No SmartGrowth credentials saved — nothing can be sent.'); return 0; }
    if (!runnerAllowed()) { this.say(runnerWhy()); return 0; }
    const runs = await SgRun.find({ status: 'running' }).sort({ _id: 1 }).lean();
    if (!runs.length) { this.say('No runs are switched on.'); return 0; }
    if (!(await this.gate())) return 0;
    let total = 0;
    for (const r of runs) {
      total += await this.runOne(r);
      if (this.halted) break;
    }
    return total;
  }

  /** "Send now" — the same tick on a button, same quota, same claim. */
  async runNow(id) {
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) { this.say('No SmartGrowth credentials saved — nothing can be sent.'); return 0; }
    const r = await SgRun.findById(id).lean();
    if (!r) { this.say('No such run.'); return 0; }
    if (r.status !== 'running') { this.say('That run is ' + r.status + ' — start it first.'); return 0; }
    if (!(await this.gate())) return 0;
    return this.runOne(r);
  }

  async runOne(run) {
    const id = run._id;
    const label = '#' + String(id).slice(-5) + ' ' + run.name;
    const today = U.istToday();
    const delay = Math.max(0, Number(run.sendDelay) || 0);

    if (!U.inHours(run.hourFrom, run.hourTo)) {
      const hrs = U.hoursLabel(run.hourFrom, run.hourTo);
      this.say(label + ': outside sending hours (' + hrs + ').');
      await this.note(id, 'Outside sending hours (' + hrs + ', India time). Waiting.');
      return 0;
    }

    const sentToday = run.quotaDate === today ? Number(run.sentToday) || 0 : 0;
    const quota = Number(run.dailyQuota) || 0;
    const left = quota - sentToday;
    if (left <= 0) {
      this.say(label + ': today’s allowance of ' + quota + ' is used up.');
      await this.note(id, 'Daily allowance of ' + quota + ' used up; resumes tomorrow.');
      return 0;
    }
    let take = Math.min(left, MAX_PER_TICK);
    if (this.probe) take = 1;

    // WAITING FIRST: messages held while WhatsApp was down were due before anybody new.
    const held = await SgSendLog.find({ kind: KIND, refId: String(id), status: 'held' }).sort({ _id: 1 }).limit(take).lean();
    const people = held.map((h) => ({ phone: U.key10(h.phone), _held: h.eventKey }));
    if (people.length < take) {
      const claimed = await claimedSet(id);
      for (const p of await audienceFor(run)) {
        if (people.length >= take) break;
        if (!claimed.has(p.phone)) people.push(p);
      }
    }
    if (!people.length) {
      // Not an ending: caught up, waiting for somebody new to match.
      this.say(label + ': caught up, nobody new to send to.');
      await this.note(id, 'Caught up — waiting for new people to match the filter.');
      return 0;
    }

    let sent = 0; let failed = 0; let skipped = 0; let heldNow = 0; let paced = false; let lastMsg = '';
    const byPhone = new Map();
    if (held.length) for (const p of await audienceFor(run)) byPhone.set(p.phone, p);

    for (const p of people) {
      if (delay > 0 && !(await takeSlot(SgRun, id, delay, this.budget))) { paced = true; break; }
      const key = p._held || eventKey(id, p.phone);
      const person = p._held ? (byPhone.get(p.phone) || (await audience.findOne(p.phone)) || { phone: p.phone }) : p;

      if (p._held) {
        // Taken back with one update, so two runners cannot both send it.
        const got = await SgSendLog.updateOne({ eventKey: key, status: 'held' }, { $set: { status: 'sending' } });
        if (got.modifiedCount !== 1) { skipped++; continue; }
        if (await blocks.isBlocked(p.phone)) { await limit.finish(key, 'blocked', 0, 'blocked while waiting'); skipped++; continue; }
      } else {
        // Checked again at the moment of sending: a block always wins.
        if (await blocks.isBlocked(p.phone)) { skipped++; continue; }
        const claimedNow = await limit.record(p.phone, KIND, {
          eventKey: key, templateName: run.templateName, campaignName: run.name, refId: String(id), status: 'sending', createdByName: run.createdByName,
        });
        if (!claimedNow) { skipped++; continue; }
      }

      const vars = audience.varsFor(run.varMap, person);
      const r = await sendTemplate({
        templateId: run.templateId, campaignName: run.name, phones: [U.normalisePhone(p.phone)],
        bodyParams: vars, headerParams: run.headerParams || [], mediaUrl: run.mediaUrl, fileName: run.fileName,
      });
      lastMsg = r.okSend ? r.msg : sg.message(r.data, r.code);
      await health.report(r.okSend, r.code, lastMsg, r.error);

      if (r.okSend) {
        await limit.finish(key, 'sent', r.code, r.msg);
        sent++;
        if (this.probe) { this.probe = false; this.say('WhatsApp sending works again.'); }
        continue;
      }
      // AN ACCOUNT PROBLEM: every message after this would fail the same way.
      // Keep it waiting, not failed, and stop — it resumes by itself.
      if (health.isAccountProblem(r.code, lastMsg, r.error)) {
        await limit.finish(key, 'held', r.code, lastMsg);
        heldNow++;
        this.halted = true;
        this.say(label + ': WhatsApp is not working (' + lastMsg + ') — stopped, will retry by itself.');
        break;
      }
      await limit.finish(key, 'failed', r.code, lastMsg);
      failed++;
      if (this.probe) { this.halted = true; break; }
    }

    if (paced && sent + failed + skipped === 0) {
      this.say(label + ': next message not due yet (one every ' + delay + 's).');
      return 0;
    }
    this.say(label + ': ' + sent + ' sent, ' + failed + ' failed, ' + skipped + ' skipped' + (heldNow ? ', ' + heldNow + ' waiting' : '') + '.');

    // A new day returns the whole allowance; then ADD to what is stored —
    // a tick and a Send now can both be working this run.
    await SgRun.updateOne({ _id: id, quotaDate: { $ne: today } }, { $set: { quotaDate: today, sentToday: 0 } });
    await SgRun.updateOne({ _id: id }, {
      $inc: { sentToday: sent, sentCount: sent, failedCount: failed, skippedCount: skipped },
      $set: {
        lastRunAt: new Date(),
        lastDetail: ((heldNow ? 'Stopped — WhatsApp is not working (' + lastMsg + '). Holding; resumes by itself. ' : '')
          + sent + ' sent, ' + failed + ' failed, ' + skipped + ' skipped. ' + Math.max(0, quota - sentToday - sent) + ' left of today’s ' + quota + '.'
          + (delay > 0 ? ' One every ' + delay + 's.' : '')).slice(0, 500),
      },
    });
    return sent;
  }
}

module.exports = { Broadcast, KIND, MAX_DAILY_QUOTA, MAX_SEND_DELAY, remainingFor, audienceFor };
