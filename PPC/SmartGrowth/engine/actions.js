// Communication > WhatsApp > Action Messages — what an owner or buyer is told
// on WhatsApp when something happens to their own listing or requirement,
// from the website and the app alike (both write the same collections, and
// this watches the collections).
//
// PM_Matri_Admin's actions were matrimony events (interest, shortlist, profile
// view, horoscope request...). Pondy Property's are in CATALOGUE below. Each one:
// on/off, the template, its own allowance per person per day, the Status
// wording, and which value fills each of the template's blanks.
//
// ONCE PER EVENT. Every send is claimed in sg_send_logs under a unique key
// ('act:<action>:<what happened>') before it goes, so two ticks, a restart or
// a re-scan never tell anybody the same thing twice. A second view by the
// same buyer is the same key — each pair is told once.
//
// NEVER HISTORY. The first time an action is switched on it only records
// where "now" is (and, for the state ones, which listings are already in that
// state) and sends nothing: switching on "Listing approved" must not message
// every owner whose listing was ever approved. Nothing older than
// MAX_AGE_HOURS is sent either way.

const { SgSettings, SgSendLog } = require('../models');
const { sendTemplate } = require('../sender');
const { limit, blocks, health } = require('../guards');
const tpl = require('../templates');
const { runnerAllowed, runnerWhy } = require('./pace');
const sg = require('../client');
const U = require('../util');

const AddModel = require('../../AddModel');
const BuyerAssistance = require('../../BuyerAssistance/BuyerAssistanceModel');
const PhotoRequest = require('../../Photo/PhotoRequestModel');
const AddressRequest = require('../../AddressRequest/AddressRequestModel');
const Offer = require('../../Offer/OfferModel');

const KIND = 'action';
const MAX_PER_RUN = 200;
const MAX_AGE_HOURS = 48;
const UTILITY_ONLY = true;

// Every action fills from these. {by} in a Status line is the other party's
// number, masked — an owner is told a buyer is interested, not who.
const FIELDS = {
  to_name: 'Their name',
  ref: 'Property ID ("PPC ID 1234")',
  ppc_id: 'PPC ID (number only)',
  status: 'The Status line below',
  when_date: 'Date it happened (dd-mm-yyyy)',
  by_masked: 'The other person’s number, masked',
  price: 'Offered price (offers only)',
  area: 'Area of the listing',
};

const DEFAULT_VARS = { 1: 'ref', 2: 'status', 3: 'when_date' };

const CATALOGUE = {
  property_added:   { label: 'Listing added', help: 'The owner, when they add a property on the website or in the app. Listings keyed in or bulk-uploaded by the office are left out.', status: 'Your property was added and is waiting for approval', cap: 1 },
  property_approved:{ label: 'Listing approved', help: 'The owner, when their listing goes live (status Approved).', status: 'Your property is approved and now visible to buyers', cap: 1, state: 'active' },
  interest:         { label: 'Interest received', help: 'The owner, when a buyer sends interest in their listing. Once per buyer.', status: 'A buyer ({by}) is interested in your property', cap: 3 },
  contact_view:     { label: 'Contact viewed', help: 'The owner, when a buyer views their contact number. Once per buyer.', status: 'Your contact number was viewed by {by}', cap: 3 },
  shortlist:        { label: 'Shortlisted', help: 'The owner, when a buyer adds the listing to favourites. Once per buyer.', status: 'Your property was shortlisted by {by}', cap: 2 },
  photo_request:    { label: 'Photo request', help: 'The owner, when a buyer asks for photos of the listing.', status: 'A buyer ({by}) asked for photos of your property', cap: 2 },
  address_request:  { label: 'Address request', help: 'The owner, when a buyer asks for the address.', status: 'A buyer ({by}) asked for the address of your property', cap: 2 },
  offer:            { label: 'Offer raised', help: 'The owner, when a buyer offers a price. {price} is the offer.', status: 'A buyer ({by}) offered Rs. {price} for your property', cap: 2 },
  report_notice:    { label: 'Listing reported', help: 'The owner, when their listing is reported. Never says who reported it — {by} is not filled here.', status: 'A report about your property was received and is under review', cap: 1, anonymous: true },
  property_expired: { label: 'Listing expired', help: 'The owner, when their listing expires.', status: 'Your property listing has expired — renew it to show it to buyers again', cap: 1, state: 'expired' },
  buyer_added:      { label: 'Buyer requirement added', help: 'The buyer, when they post a requirement on the website or in the app.', status: 'Your property requirement was received — we will send you matching properties', cap: 1 },
};

const mask = (p) => { const k = U.key10(p); return k.length === 10 ? k.slice(0, 2) + 'XXXXXX' + k.slice(8) : ''; };
const ddmmyyyy = (d) => { const s = U.istToday(d ? new Date(d) : new Date()); const [y, m, dd] = s.split('-'); return dd + '-' + m + '-' + y; };

/** The saved configuration merged over the catalogue defaults, clamped. */
function config(saved) {
  const out = {};
  for (const [key, a] of Object.entries(CATALOGUE)) {
    const s = (saved && saved[key]) || {};
    out[key] = {
      key, label: a.label, help: a.help, anonymous: !!a.anonymous, state: a.state || null,
      on: !!s.on,
      template: String(s.template || '').trim(),
      cap: U.clampInt(s.cap === undefined ? a.cap : s.cap, 0, 20, a.cap),
      status: String(s.status === undefined || s.status === '' ? a.status : s.status).slice(0, 120),
      varMap: s.varMap && typeof s.varMap === 'object' ? s.varMap : { ...DEFAULT_VARS },
    };
  }
  return out;
}

function fill(spec, ev, a) {
  spec = String(spec || '');
  if (spec.startsWith('text:')) return spec.slice(5);
  switch (spec) {
    case 'to_name': return (String(ev.toName || '').trim().split(/\s+/)[0]) || 'there';
    case 'ref': return ev.ppcId !== undefined && ev.ppcId !== null ? 'PPC ID ' + ev.ppcId : (ev.baId !== undefined ? 'BA ' + ev.baId : '');
    case 'ppc_id': return ev.ppcId !== undefined && ev.ppcId !== null ? String(ev.ppcId) : '';
    case 'status': return a.status.replace(/\{by\}/g, a.anonymous ? 'someone' : (mask(ev.by) || 'a buyer')).replace(/\{price\}/g, ev.price !== undefined ? String(ev.price) : '').replace(/\{ppc_id\}/g, ev.ppcId !== undefined ? String(ev.ppcId) : '');
    case 'when_date': return ddmmyyyy(ev.at);
    case 'by_masked': return a.anonymous ? '' : mask(ev.by);
    case 'price': return ev.price !== undefined ? String(ev.price) : '';
    case 'area': return String(ev.area || '');
    default: return '';
  }
}

// ── The events, per action ─────────────────────────────────────────────────
// Each answers [{ key, to, toName, ppcId, baId, by, at, area, price }].

const propSel = 'phoneNumber ownerName ppcId area city createdAt updatedAt status createdBy addedBy bulkUploadId';
const ev = (p, extra) => ({ to: p.phoneNumber, toName: p.ownerName, ppcId: p.ppcId, area: p.area || p.city || '', ...extra });

async function embedded(field, since, key) {
  const rows = await AddModel.find({ isDeleted: { $ne: true }, [field + '.date']: { $gte: since } }).select(propSel + ' ' + field).lean();
  const out = [];
  for (const p of rows) {
    for (const x of p[field] || []) {
      if (!x || !x.date || new Date(x.date) < since) continue;
      if (U.key10(x.phoneNumber) === U.key10(p.phoneNumber)) continue;   // the owner on their own listing
      out.push(ev(p, { key: key + ':' + p._id + ':' + U.key10(x.phoneNumber), by: x.phoneNumber, at: x.date }));
    }
  }
  return out;
}

async function byOwnerRequest(Model, since, key, extra) {
  const rows = await Model.find({ createdAt: { $gte: since }, postedUserPhoneNumber: { $nin: [null, ''] } }).lean();
  return rows.map((r) => ({
    key: key + ':' + r._id, to: r.postedUserPhoneNumber, ppcId: r.ppcId, area: r.area || r.city || '',
    by: r.requesterPhoneNumber || r.phoneNumber, at: r.createdAt, ...(extra ? extra(r) : {}),
  }));
}

const EVENTS = {
  property_added: async (since) => (await AddModel.find({ isDeleted: { $ne: true }, createdAt: { $gte: since }, createdBy: 'User', bulkUploadId: { $in: [null, ''] }, addedBy: { $in: [null, ''] } }).select(propSel).lean())
    .map((p) => ev(p, { key: 'property_added:' + p._id, at: p.createdAt })),
  property_approved: async (since) => (await AddModel.find({ isDeleted: { $ne: true }, status: 'active', updatedAt: { $gte: since } }).select(propSel).lean())
    .map((p) => ev(p, { key: 'property_approved:' + p._id, at: p.updatedAt })),
  property_expired: async (since) => (await AddModel.find({ isDeleted: { $ne: true }, status: 'expired', updatedAt: { $gte: since } }).select(propSel).lean())
    .map((p) => ev(p, { key: 'property_expired:' + p._id, at: p.updatedAt })),
  interest: (since) => embedded('interestRequests', since, 'interest'),
  contact_view: (since) => embedded('contactRequests', since, 'contact_view'),
  shortlist: (since) => embedded('favoriteRequests', since, 'shortlist'),
  report_notice: async (since) => (await embedded('reportProperty', since, 'report_notice')).map((e) => ({ ...e, key: e.key.split(':').slice(0, 2).join(':') + ':' + U.istToday(new Date(e.at)) })),
  photo_request: (since) => byOwnerRequest(PhotoRequest, since, 'photo_request'),
  address_request: (since) => byOwnerRequest(AddressRequest, since, 'address_request'),
  offer: (since) => byOwnerRequest(Offer, since, 'offer', (r) => ({ price: r.price })),
  buyer_added: async (since) => (await BuyerAssistance.find({ isDeleted: { $ne: true }, createdAt: { $gte: since }, ba_postBy: 'User', phoneNumber: { $nin: [null, ''] } }).lean())
    .map((t) => ({ key: 'buyer_added:' + t._id, to: t.phoneNumber, toName: t.baName, baId: t.ba_id, area: t.area || t.city || '', at: t.createdAt })),
};

/** For the state actions: which listings are already in that state, so switching on sends none of them. */
async function seedState(key, state) {
  const rows = await AddModel.find({ isDeleted: { $ne: true }, status: state }).select('phoneNumber').lean();
  const docs = rows.map((p) => ({ phone: U.key91(p.phoneNumber) || 'x', kind: KIND, eventKey: 'act:' + key + ':' + p._id, refId: key, status: 'skipped', detail: 'already ' + state + ' when switched on' }));
  for (let i = 0; i < docs.length; i += 1000) {
    try { await SgSendLog.insertMany(docs.slice(i, i + 1000), { ordered: false }); } catch (_) { /* duplicates are fine */ }
  }
  return docs.length;
}

async function usableTemplate(name) {
  if (!name) return { ok: false, why: 'no template chosen' };
  const t = await tpl.byName(name);
  if (!t) return { ok: false, why: '"' + name + '" is not an APPROVED template' };
  if (UTILITY_ONLY && String(t.category).toUpperCase() !== 'UTILITY') return { ok: false, why: '"' + name + '" is filed ' + t.category + ' — only UTILITY is sent' };
  return { ok: true, t };
}

async function sentTodayFor(phone, key) {
  return SgSendLog.countDocuments({ phone: U.key91(phone), kind: KIND, refId: key, status: 'sent', createdAt: { $gte: U.istDayStart() } });
}

/** One pass over every action that is switched on. */
async function run({ manual = false } = {}) {
  const log = [];
  const s = await sg.settings();
  if (!s.apiToken || !s.apiCode) return { sent: 0, log: ['No SmartGrowth credentials saved.'] };
  if (!manual && !runnerAllowed()) return { sent: 0, log: [runnerWhy()] };
  const doc = await sg.settingsDoc();
  if (!doc.actionEnabled) return { sent: 0, log: ['Action messages are switched off.'] };
  if (await health.isDown()) return { sent: 0, log: ['WhatsApp sending is stopped — action messages wait.'] };

  const cfg = config(doc.actionConfig);
  const marks = { ...(doc.actionMarks || {}) };
  const scanStart = new Date();
  const oldest = new Date(Date.now() - MAX_AGE_HOURS * 3600000);
  let sent = 0;
  let budget = MAX_PER_RUN;

  for (const a of Object.values(cfg)) {
    if (!a.on) continue;
    if (!marks[a.key]) {
      // First time on: note where now is, send nothing.
      if (a.state) log.push(a.label + ': ' + (await seedState(a.key, a.state)) + ' listing(s) already ' + a.state + ' — not messaged.');
      marks[a.key] = scanStart.toISOString();
      log.push(a.label + ': switched on — events from now on will be sent.');
      continue;
    }
    const use = await usableTemplate(a.template);
    if (!use.ok) { log.push(a.label + ': ' + use.why + ' — nothing sent.'); continue; }
    const since = new Date(Math.max(new Date(marks[a.key]).getTime() - 5 * 60000, oldest.getTime()));
    let events = [];
    try { events = await EVENTS[a.key](since); } catch (e) { log.push(a.label + ': ' + e.message); continue; }
    events = events.filter((e) => U.isMobile10(U.key10(e.to)) && (!e.at || new Date(e.at) >= oldest))
      .sort((x, y) => new Date(x.at || 0) - new Date(y.at || 0));
    let done = 0; let all = true;
    for (const e of events) {
      if (budget <= 0) { all = false; break; }
      const key = 'act:' + e.key;
      if (await SgSendLog.exists({ eventKey: key })) continue;
      const phone = U.key10(e.to);
      if (await blocks.isBlocked(phone)) { await limit.record(phone, KIND, { eventKey: key, refId: a.key, status: 'blocked', detail: 'asked us to stop', templateName: use.t.name }); continue; }
      const gate = await limit.check(phone, KIND);
      if (!gate.ok) { await limit.recordBlocked(phone, KIND, { eventKey: key, refId: a.key, templateName: use.t.name, campaignName: 'Action: ' + a.label, detail: 'daily action cap reached (' + gate.sent + ' of ' + gate.cap + ')' }); continue; }
      if (a.cap > 0 && (await sentTodayFor(phone, a.key)) >= a.cap) { await limit.recordBlocked(phone, KIND, { eventKey: key, refId: a.key, templateName: use.t.name, campaignName: 'Action: ' + a.label, detail: a.label + ' allowance of ' + a.cap + ' a day reached' }); continue; }
      const claimed = await limit.record(phone, KIND, { eventKey: key, refId: a.key, templateName: use.t.name, campaignName: 'Action: ' + a.label, status: 'sending' });
      if (!claimed) continue;
      const want = Number(use.t.variableCount) || 0;
      const vars = [];
      for (let i = 1; i <= want; i++) vars.push(fill(a.varMap[String(i)], e, a));
      const r = await sendTemplate({ templateId: use.t.id, campaignName: 'Action: ' + a.label, phones: ['91' + phone], bodyParams: vars });
      const msg = r.okSend ? r.msg : sg.message(r.data, r.code);
      await health.report(r.okSend, r.code, msg, r.error);
      if (!r.okSend && health.isAccountProblem(r.code, msg, r.error)) {
        // Not this event's fault: forget the claim so it goes when WhatsApp works again.
        await SgSendLog.deleteOne({ eventKey: key });
        log.push('WhatsApp is not working (' + msg + ') — stopped.');
        all = false;
        budget = 0;
        break;
      }
      await limit.finish(key, r.okSend ? 'sent' : 'failed', r.code, msg);
      if (r.okSend) { sent++; done++; }
      budget--;
    }
    if (all) marks[a.key] = scanStart.toISOString();
    if (done) log.push(a.label + ': ' + done + ' sent.');
  }
  await SgSettings.updateOne({ key: 'main' }, { $set: { actionMarks: marks, actionCheckedAt: new Date() } });
  return { sent, log };
}

async function todayByAction() {
  const rows = await SgSendLog.aggregate([
    { $match: { kind: KIND, createdAt: { $gte: U.istDayStart() }, status: { $ne: 'skipped' } } },
    { $group: { _id: { a: '$refId', s: '$status' }, n: { $sum: 1 } } },
  ]);
  const out = {};
  for (const r of rows) { (out[r._id.a] = out[r._id.a] || { sent: 0, blocked: 0, failed: 0 }); out[r._id.a][r._id.s] = (out[r._id.a][r._id.s] || 0) + r.n; }
  return out;
}

module.exports = { CATALOGUE, FIELDS, config, run, todayByAction, KIND, UTILITY_ONLY };
