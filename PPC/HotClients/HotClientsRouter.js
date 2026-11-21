// Admin "Hot Clients": people showing the strongest buying/renting intent right
// now, ranked by a score built from real activity records in the last N days.
// Mounted under /PPC (same open posture as the rest of the admin API).
//
//   GET /PPC/hot-clients?days=7                 ranked list (read-only)
//   PUT /PPC/hot-clients/:phone/note            staff status / remark / follow-up date
//
// Signals (weight per event, max events counted per type):
//   AI chat where the AI offered a next step and the user didn't take it   15 ×3
//   help request on a listing (buy help, site visit, loan…)               12 ×3
//   clicked "call owner"                                                   10 ×5
//   unlocked an owner contact with points                                  10 ×5
//   contact request / contact sent                                          8 ×5
//   registered a buyer requirement                                          8 ×2
//   sent interest                                                           6 ×5
//   bought points                                                           5 ×2
//   added to favourites                                                     3 ×5
//   other AI chat                                                           3 ×3
//   viewed a property (distinct properties)                                 1 ×15
// Each event is weighted by recency: ≤3 days ×1, ≤7 days ×0.7, older ×0.4.

const express = require('express');
const AddModel = require('../AddModel');
const UserViews = require('../ViewsModel');
const CallUserList = require('../CalledUserModel');
const ContactLog = require('../ContactLog');
const UserLogin = require('../user/UserModel');
const BuyerAssistance = require('../BuyerAssistance/BuyerAssistanceModel');
const { PointsTransaction, PointsBalance } = require('../Points/PointsModel');
const { buildAiHandled } = require('../assistant/adminAiHandledRoute');
const HotClientNote = require('./HotClientNoteModel');

const router = express.Router();
const DAY = 24 * 60 * 60 * 1000;
const MAX_CLIENTS = 300;

const last10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const validPhone = (p) => /^[6-9]\d{9}$/.test(p);

const SIGNALS = {
  ai_followup: { weight: 15, max: 3, label: 'AI offered a next step — not taken' },
  help: { weight: 12, max: 3, label: 'Asked for help on a listing' },
  call: { weight: 10, max: 5, label: 'Clicked call owner' },
  unlock: { weight: 10, max: 5, label: 'Unlocked owner contact' },
  contact: { weight: 8, max: 5, label: 'Contact request' },
  buyer_req: { weight: 8, max: 2, label: 'Registered buyer requirement' },
  interest: { weight: 6, max: 5, label: 'Sent interest' },
  points: { weight: 5, max: 2, label: 'Bought points' },
  favorite: { weight: 3, max: 5, label: 'Added to favourites' },
  ai_chat: { weight: 3, max: 3, label: 'Chatted with AI' },
  view: { weight: 1, max: 15, label: 'Viewed properties' },
};
const TIERS = [{ min: 30, tier: 'hot' }, { min: 15, tier: 'warm' }, { min: 0, tier: 'active' }];

const recency = (at, now) => {
  const age = now - new Date(at).getTime();
  return age <= 3 * DAY ? 1 : age <= 7 * DAY ? 0.7 : 0.4;
};

// Pull { phone, at, ppcId } events out of an AddModel request array.
const listingEvents = (arr, dateField, since) => AddModel.aggregate([
  { $match: { [`${arr}.${dateField}`]: { $gte: since } } },
  { $project: { ppcId: 1, phoneNumber: 1, item: `$${arr}` } },
  { $unwind: '$item' },
  { $match: { [`item.${dateField}`]: { $gte: since } } },
  { $project: { _id: 0, phone: '$item.phoneNumber', at: `$item.${dateField}`, ppcId: 1, owner: '$phoneNumber',
    reason: '$item.selectHelpReason' } },
]);

async function collectEvents(days) {
  const since = new Date(Date.now() - days * DAY);
  const [views, interests, contacts, favorites, helps, calls, contactLogs, pointTx, buyerReqs, aiSessions] = await Promise.all([
    UserViews.aggregate([
      { $match: { 'viewedProperties.viewedAt': { $gte: since } } },
      { $project: { phoneNumber: 1, v: '$viewedProperties' } },
      { $unwind: '$v' },
      { $match: { 'v.viewedAt': { $gte: since } } },
      { $project: { _id: 0, phone: '$phoneNumber', at: '$v.viewedAt', ppcId: '$v.ppcId', owner: '$v.propertyOwnerPhoneNumber' } },
    ]),
    listingEvents('interestRequests', 'date', since),
    listingEvents('contactRequests', 'date', since),
    listingEvents('favoriteRequests', 'date', since),
    listingEvents('helpRequests', 'requestedAt', since),
    CallUserList.find({ date: { $gte: since }, isDeleted: { $ne: true } })
      .select('phoneNumber date ppcId propertyPhoneNumber').lean(),
    ContactLog.find({ contactedAt: { $gte: since } }).select('userPhone contactedAt ppcId postedUserPhone').lean(),
    PointsTransaction.find({ createdAt: { $gte: since },
      $or: [{ type: 'credit' }, { type: 'deduct', reason: 'view-owner-contact' }] })
      .select('phoneNumber type reason amount createdAt rentId').lean(),
    BuyerAssistance.find({ createdAt: { $gte: since }, isDeleted: { $ne: true } })
      .select('phoneNumber createdAt city area bedrooms propertyType propertyMode minPrice maxPrice ba_id').lean(),
    buildAiHandled(days),
  ]);

  const events = [];
  const push = (type, phone, at, extra = {}) => {
    const p = last10(phone);
    if (validPhone(p) && at) events.push({ type, phone: p, at: new Date(at), ...extra });
  };
  views.forEach((e) => push('view', e.phone, e.at, { ppcId: e.ppcId, owner: last10(e.owner) }));
  interests.forEach((e) => push('interest', e.phone, e.at, { ppcId: e.ppcId, owner: last10(e.owner) }));
  contacts.forEach((e) => push('contact', e.phone, e.at, { ppcId: e.ppcId, owner: last10(e.owner) }));
  favorites.forEach((e) => push('favorite', e.phone, e.at, { ppcId: e.ppcId, owner: last10(e.owner) }));
  helps.forEach((e) => push('help', e.phone, e.at, { ppcId: e.ppcId, owner: last10(e.owner), detail: e.reason }));
  calls.forEach((e) => push('call', e.phoneNumber, e.date, { ppcId: e.ppcId, owner: last10(e.propertyPhoneNumber) }));
  contactLogs.forEach((e) => push('contact', e.userPhone, e.contactedAt, { ppcId: e.ppcId, owner: last10(e.postedUserPhone) }));
  pointTx.forEach((t) => (t.type === 'credit'
    ? push('points', t.phoneNumber, t.createdAt, { amount: t.amount || 0 })
    : push('unlock', t.phoneNumber, t.createdAt, { ppcId: Number(t.rentId) || undefined })));
  buyerReqs.forEach((b) => push('buyer_req', b.phoneNumber, b.createdAt, { requirement: {
    city: b.city, area: b.area, bedrooms: b.bedrooms, propertyType: b.propertyType,
    propertyMode: b.propertyMode, minPrice: b.minPrice, maxPrice: b.maxPrice, baId: b.ba_id } }));
  aiSessions.forEach((s) => push(s.outcome === 'needs_followup' ? 'ai_followup' : 'ai_chat', s.phone, s.lastMessageAt || s.startedAt, {
    sessionId: s.sessionId, question: s.firstQuestion, requirement: s.requirement, converted: s.outcome === 'converted' }));
  return events;
}

function scoreClients(events) {
  const now = Date.now();
  const byPhone = new Map();
  for (const e of events) {
    // Owners looking at their own listing are not buyers.
    if (e.owner && e.owner === e.phone) continue;
    if (!byPhone.has(e.phone)) byPhone.set(e.phone, []);
    byPhone.get(e.phone).push(e);
  }

  const clients = [];
  for (const [phone, list] of byPhone) {
    list.sort((a, b) => b.at - a.at); // newest first
    const byType = {};
    for (const e of list) (byType[e.type] = byType[e.type] || []).push(e);
    // Views count distinct properties.
    if (byType.view) {
      const seen = new Set();
      byType.view = byType.view.filter((e) => !seen.has(e.ppcId) && seen.add(e.ppcId));
    }

    let score = 0;
    const counts = {};
    const reasons = [];
    for (const [type, cfg] of Object.entries(SIGNALS)) {
      const evs = byType[type] || [];
      counts[type] = evs.length;
      if (!evs.length) continue;
      const pts = evs.slice(0, cfg.max).reduce((s, e) => s + cfg.weight * recency(e.at, now), 0);
      score += pts;
      reasons.push({ type, label: cfg.label, count: evs.length, points: Math.round(pts) });
    }
    score = Math.round(score);
    reasons.sort((a, b) => b.points - a.points);

    // Properties they engaged with, strongest signal first, then newest.
    const rank = Object.fromEntries(Object.keys(SIGNALS).map((k, i) => [k, i]));
    const propMap = new Map();
    for (const e of [...list].sort((a, b) => rank[a.type] - rank[b.type] || b.at - a.at)) {
      if (e.ppcId == null || Number.isNaN(Number(e.ppcId))) continue;
      const id = Number(e.ppcId);
      if (!propMap.has(id)) propMap.set(id, { ppcId: id, actions: new Set() });
      propMap.get(id).actions.add(e.type);
    }
    const properties = [...propMap.values()].slice(0, 5).map((p) => ({ ppcId: p.ppcId, actions: [...p.actions] }));

    const reqEvent = list.find((e) => e.requirement);
    const aiEvent = (byType.ai_followup || [])[0] || (byType.ai_chat || [])[0];
    const helpEvent = (byType.help || [])[0];

    clients.push({
      phone,
      score,
      tier: TIERS.find((t) => score >= t.min).tier,
      lastActivity: list[0].at,
      firstActivity: list[list.length - 1].at,
      counts,
      reasons,
      properties,
      requirement: reqEvent ? reqEvent.requirement : null,
      ai: aiEvent ? { sessionId: aiEvent.sessionId, question: aiEvent.question, needsFollowup: aiEvent.type === 'ai_followup' } : null,
      helpReason: helpEvent ? helpEvent.detail || '' : '',
      pointsBought: (byType.points || []).reduce((s, e) => s + (e.amount || 0), 0),
    });
  }
  clients.sort((a, b) => b.score - a.score || b.lastActivity - a.lastActivity);
  return clients;
}

router.get('/hot-clients', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 60);
    let clients = scoreClients(await collectEvents(days));

    // Drop deleted / banned accounts.
    if (clients.length) {
      const blocked = await UserLogin.find({ phone: { $in: clients.map((c) => c.phone) }, status: { $in: ['deleted', 'banned'] } })
        .select('phone').lean();
      const out = new Set(blocked.map((u) => last10(u.phone)));
      clients = clients.filter((c) => !out.has(c.phone));
    }
    const total = clients.length;
    clients = clients.slice(0, MAX_CLIENTS);

    const phones = clients.map((c) => c.phone);
    const ppcIds = [...new Set(clients.flatMap((c) => c.properties.map((p) => p.ppcId)))];
    const phoneRe = phones.length ? new RegExp(`^(\\+?91|0)?(${phones.join('|')})$`) : null;
    const [props, balances, notes] = await Promise.all([
      ppcIds.length ? AddModel.find({ ppcId: { $in: ppcIds } })
        .select('ppcId propertyType propertyMode area city price bedrooms status').lean() : [],
      phoneRe ? PointsBalance.find({ phoneNumber: phoneRe }).select('phoneNumber balance').lean() : [],
      phones.length ? HotClientNote.find({ phone: { $in: phones } }).select('-history').lean() : [],
    ]);
    const propById = new Map(props.map((p) => [Number(p.ppcId), p]));
    const balByPhone = new Map(balances.map((b) => [last10(b.phoneNumber), b.balance || 0]));
    const noteByPhone = new Map(notes.map((n) => [n.phone, n]));

    clients.forEach((c) => {
      c.properties = c.properties.map((p) => {
        const d = propById.get(p.ppcId);
        return d ? { ...p, propertyType: d.propertyType, propertyMode: d.propertyMode, area: d.area, city: d.city,
          price: d.price, bedrooms: d.bedrooms, status: d.status } : p;
      });
      c.pointsBalance = balByPhone.get(c.phone) || 0;
      const n = noteByPhone.get(c.phone);
      c.note = n ? { status: n.status, remark: n.remark, followUpDate: n.followUpDate, updatedBy: n.updatedBy, updatedAt: n.updatedAt }
        : { status: 'new', remark: '', followUpDate: null };
    });

    res.json({ success: true, days, total, count: clients.length,
      weights: Object.fromEntries(Object.entries(SIGNALS).map(([k, v]) => [k, { weight: v.weight, max: v.max, label: v.label }])),
      tiers: { hot: TIERS[0].min, warm: TIERS[1].min }, clients });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/hot-clients/:phone/note', async (req, res) => {
  try {
    const phone = last10(req.params.phone);
    if (!validPhone(phone)) return res.status(400).json({ success: false, error: 'Invalid phone number' });
    const { status, remark, followUpDate, updatedBy } = req.body || {};
    if (status && !HotClientNote.STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of ${HotClientNote.STATUSES.join(', ')}` });
    }
    const set = { updatedBy: String(updatedBy || '').slice(0, 100) };
    if (status) set.status = status;
    if (remark !== undefined) set.remark = String(remark).slice(0, 1000);
    if (followUpDate !== undefined) set.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (set.followUpDate && Number.isNaN(set.followUpDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid follow-up date' });
    }
    const note = await HotClientNote.findOneAndUpdate(
      { phone },
      { $set: set, $push: { history: { $each: [{ status: set.status, remark: set.remark, updatedBy: set.updatedBy }], $slice: -50 } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('-history').lean();
    res.json({ success: true, note });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
module.exports.scoreClients = scoreClients;
