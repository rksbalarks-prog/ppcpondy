// Communication > WhatsApp > Message Status and Recent Campaigns.
//
// /send/campaign answers 200 "Campaign sent successfully!" to anything it
// accepts — for weeks on PM's account that was the only word the panel had
// while every message was failing. These read what Meta actually did:
//
//   GET /api/get-campaigns                                  every campaign name, ours and theirs
//   GET /api/get-campaign-stats?campaignName=               queued/sent/delivered/read/failed/cancelled
//   GET /api/get-campaign-messages?campaignName=&limit=&page=   per-recipient, with Meta's error text
//
// Read-only: no credits, no messages.
//
//   GET  /sg/campaigns               the picker (mine = sent from this panel)
//   GET  /sg/campaign-status         counts + one page of messages
//   GET  /sg/logs                    Recent Campaigns (this panel's own log)
//   GET  /sg/delivered-preview       delivered/read numbers of a campaign vs the call queue
//   POST /sg/delivered-to-calling    put the fresh ones in the Call Management automatic queue

const express = require('express');
const sg = require('../client');
const { SgCampaignLog } = require('../models');
const U = require('../util');

const RcmAutoNumber = require('../../Rcm/RcmAutoNumberModel');
const RcmCall = require('../../Rcm/RcmCallModel');

const router = express.Router();
const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

// 40 pages x 200 = 8,000 messages, the most one delivered-preview walks.
const DELIVERED_MAX_PAGES = 40;

async function needToken(res) {
  const s = await sg.settings();
  if (!s.apiToken) { fail(res, 'Add your API token in Settings first (Send Message > More Info).'); return false; }
  return true;
}

router.get('/sg/campaigns', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const r = await sg.request('GET', '/api/get-campaigns');
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    const names = [];
    const seen = new Set();
    for (const one of sg.listOf(r.data)) {
      const n = String(one && typeof one === 'object' ? (one.campaignName || '') : (one || '')).trim();
      if (n && !seen.has(n)) { seen.add(n); names.push(n); }
    }
    // Which of them this panel sent — a name in our log is one we can explain.
    const ours = new Set((await SgCampaignLog.distinct('campaignName')).map((x) => String(x || '').trim()));
    res.json({ status: 'success', rows: names.map((n) => ({ name: n, mine: ours.has(n) })), total: names.length });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/campaign-status', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const campaign = String(req.query.campaignName || '').trim();
    if (!campaign) return fail(res, 'Which campaign?');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    let per = parseInt(req.query.limit, 10) || 50;
    if (per < 1 || per > 200) per = 50;
    const q = '?campaignName=' + encodeURIComponent(campaign);
    const status = String(req.query.status || '').trim();
    const [stats, msgs] = await Promise.all([
      sg.request('GET', '/api/get-campaign-stats' + q),
      sg.request('GET', '/api/get-campaign-messages' + q + '&limit=' + per + '&page=' + page + (status ? '&status=' + encodeURIComponent(status) : '')),
    ]);
    if (stats.error || msgs.error) return fail(res, 'Could not reach SmartGrowth: ' + (stats.error || msgs.error));
    const counts = stats.data && stats.data.data && typeof stats.data.data === 'object' ? stats.data.data : {};
    const rows = [];
    for (const m of (msgs.data && Array.isArray(msgs.data.data) ? msgs.data.data : [])) {
      // Rows with no status are not outgoing messages — reply records carry
      // the WABA's own phone id in `to` and would read as a mystery recipient.
      if (!m || !String(m.status || '').trim()) continue;
      rows.push({
        to: String(m.to || ''), status: String(m.status || 'unknown'), template: String(m.templateName || ''),
        error: typeof m.error === 'string' ? m.error : (m.error ? JSON.stringify(m.error) : ''), when: String(m.updatedOn || ''),
      });
    }
    const meta = msgs.data && msgs.data.meta && typeof msgs.data.meta === 'object' ? msgs.data.meta : {};
    res.json({
      status: 'success', campaign, counts, rows, page, perpage: per,
      total: Number(meta.total) || rows.length, pages: Number(meta.pages) || 1,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/logs', async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const q = String(req.query.q || '').trim();
    const where = q ? { $or: [{ campaignName: new RegExp(U.escRe(q), 'i') }, { templateName: new RegExp(U.escRe(q), 'i') }, { phoneNumbers: U.normalisePhone(q) }] } : {};
    const rows = await SgCampaignLog.find(where).sort({ _id: -1 }).limit(limit)
      .select('templateName templateId campaignName phoneCount phoneNumbers status httpCode createdByName createdAt response').lean();
    res.json({
      status: 'success',
      rows: rows.map((r) => ({ ...r, phoneNumbers: (r.phoneNumbers || []).slice(0, 10), response: String(r.response || '').slice(0, 600) })),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── Delivered numbers -> Call Management ───────────────────────────────────
// Only delivered and read: queued has not finished, sent never confirmed on
// the handset, failed/cancelled never arrived. A number already anywhere in
// the queue is refused — two campaigns must not put one person in front of
// two callers — and comes back with where it sits and its last calls.

async function deliveredNumbers(campaign) {
  const seen = new Set();
  const q = '?campaignName=' + encodeURIComponent(campaign) + '&limit=200';
  for (let page = 1; page <= DELIVERED_MAX_PAGES; page++) {
    const r = await sg.request('GET', '/api/get-campaign-messages' + q + '&page=' + page);
    if (r.error) return { error: r.error, numbers: [] };
    const rows = r.data && Array.isArray(r.data.data) ? r.data.data : [];
    if (!rows.length) break;
    for (const m of rows) {
      const st = String((m && m.status) || '').toLowerCase().trim();
      if (st !== 'delivered' && st !== 'read') continue;
      const n = U.key10(m.to);
      if (U.isMobile10(n)) seen.add(n);
    }
    const pages = r.data && r.data.meta ? Number(r.data.meta.pages) || 1 : 1;
    if (page >= pages) break;
  }
  return { error: '', numbers: [...seen] };
}

async function callingDupes(numbers) {
  if (!numbers.length) return {};
  const out = {};
  for (const r of await RcmAutoNumber.find({ number: { $in: numbers } }).sort({ createdAt: 1 }).lean()) {
    if (!out[r.number]) out[r.number] = { mobile: r.number, batches: [], calls: [] };
    out[r.number].batches.push({ leadType: r.addedBy || '', when: r.createdAt, active: r.active });
  }
  // Whether anybody actually rang it, and what came of it — a number nobody
  // dialled in six months is a different case from one called yesterday.
  for (const c of await RcmCall.find({ number: { $in: Object.keys(out) } }).sort({ createdAt: -1 }).lean()) {
    const o = out[c.number];
    if (!o || o.calls.length >= 3) continue;
    o.calls.push({ status: c.status, when: c.createdAt, who: c.agentUsername });
  }
  return out;
}

const leadType = (campaign) => ('WA: ' + String(campaign).trim()).slice(0, 150);

router.get('/sg/delivered-preview', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const campaign = String(req.query.campaignName || '').trim();
    if (!campaign) return fail(res, 'Which campaign?');
    const d = await deliveredNumbers(campaign);
    if (d.error) return fail(res, 'Could not reach SmartGrowth: ' + d.error);
    const dupes = await callingDupes(d.numbers);
    const fresh = d.numbers.filter((n) => !dupes[n]);
    res.json({ status: 'success', campaign, leadType: leadType(campaign), delivered: d.numbers.length, fresh, dupes: Object.values(dupes) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// The numbers are worked out AGAIN here rather than taken from the browser:
// what is inserted is what the campaign actually delivered, and the duplicate
// check cannot be skipped by editing the request.
router.post('/sg/delivered-to-calling', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const campaign = String((req.body || {}).campaignName || '').trim();
    if (!campaign) return fail(res, 'Which campaign?');
    const d = await deliveredNumbers(campaign);
    if (d.error) return fail(res, 'Could not reach SmartGrowth: ' + d.error);
    const dupes = await callingDupes(d.numbers);
    const fresh = d.numbers.filter((n) => !dupes[n]);
    const type = leadType(campaign);
    if (!fresh.length)
      return res.json({ status: 'success', added: 0, skipped: Object.keys(dupes).length, leadType: type, message: 'Nothing to add - every delivered number is already in the call queue.' });
    // addedBy carries the batch name, so the queue says where each number came from.
    await RcmAutoNumber.insertMany(fresh.map((number) => ({ number, active: true, addedBy: type })), { ordered: false });
    res.json({
      status: 'success', added: fresh.length, skipped: Object.keys(dupes).length, leadType: type,
      message: fresh.length + ' number' + (fresh.length === 1 ? '' : 's') + ' added to the Call Management automatic queue under "' + type + '".',
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
