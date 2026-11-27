// Communication > WhatsApp > Chats — the inbox, conversation by conversation.
//
// A campaign is one message to a list; what comes BACK is a chat, and until
// now the only place to read it was SmartGrowth's own dashboard.
//
//   GET  /api/get-my-chats?from=<search>&tn=     every thread, newest first, unread counts
//   GET  /api/user-chats/<number>[?before=]      one thread, oldest first, {messages, hasMore}
//   POST /message/send-text-message              a free-form reply {to, message, profileName}
//   POST /message/send-file-message              a photo (multipart)
//
// DIRECTION IS NOT `status`: an inbound message carries a status of its own.
// A message is ours when its `from` is NOT the contact's number.
//
// Routes here:
//   GET  /sg/chats                 threads (q = name or number)
//   GET  /sg/chats/thread          one thread (phone, before)
//   POST /sg/chats/send            typed reply
//   POST /sg/chats/send-image      photo reply
//   POST /sg/chats/send-template   an approved template into this thread (no 24-hour window)
//   POST /sg/chats/block           block / unblock this number for every sender
//   GET  /sg/chat-alerts           unread replies, for the badge on every admin page

const express = require('express');
const multer = require('multer');

const sg = require('../client');
const { sendTemplate, logCampaign, headerFields } = require('../sender');
const { limit, blocks } = require('../guards');
const { SgChatLog, SgChatMedia } = require('../models');
const { MEDIA_IMAGE_MAX, mediaKind, safeName, mediaUrlOf, wamidOf } = require('../mediaUtil');
const U = require('../util');

const AddModel = require('../../AddModel');
const BuyerAssistance = require('../../BuyerAssistance/BuyerAssistanceModel');

const router = express.Router();
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

// Meta carries a hand-written reply only inside 24 hours of the member's last
// message. The panel says so rather than leaving a box that fails silently,
// but does not block the attempt — the window is Meta's to judge.
const CHAT_WINDOW_HOURS = 24;
const CHAT_CAPTION_MAX = 1024;
const CHAT_MEDIA_MATCH_MS = 600 * 1000;
const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'voice', 'document', 'sticker']);

const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

async function needToken(res) {
  const s = await sg.settings();
  if (!s.apiToken) { fail(res, 'Add your API token in Settings first (Send Message > More Info).'); return null; }
  return s;
}

/** The thread list, normalised. Shared by the page and the alert so they cannot disagree. */
async function chatThreads(q, timeoutSec = 60) {
  const r = await sg.request('GET', '/api/get-my-chats?from=' + encodeURIComponent(q || '') + '&tn=', null, timeoutSec);
  if (r.error) return { error: r.error, rows: [] };
  const rows = [];
  for (const c of sg.listOf(r.data)) {
    if (!c || typeof c !== 'object') continue;
    const n = U.digits(c.from);
    if (!n) continue;
    rows.push({
      phone: n,
      name: String(c.profileName || '').trim(),
      when: String(c.lastUpdated || ''),
      unread: Number(c.unreadCount) || 0,
      type: String(c.lastMessageType || ''),
      preview: String(c.lastMessageBody || ''),
    });
  }
  return { error: '', rows };
}

router.get('/sg/chats', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const t = await chatThreads(String(req.query.q || '').trim());
    if (t.error) return fail(res, 'Could not reach SmartGrowth: ' + t.error);
    const unread = t.rows.reduce((a, c) => a + c.unread, 0);
    res.json({ status: 'success', rows: t.rows, total: t.rows.length, unread });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/** Meta's reason for refusing a message: the readable detail, with its label when short. */
function chatError(m) {
  if (!Array.isArray(m.errors) || !m.errors.length) return '';
  const e = m.errors[0];
  if (!e || typeof e !== 'object') return String(e || '').trim();
  const title = String(e.title || '').trim();
  let detail = e.error_data && e.error_data.details ? String(e.error_data.details).trim() : '';
  if (!detail) detail = String(e.message || '').trim();
  if (!detail) return title;
  if (!title || title === detail) return detail;
  return title.length <= 40 ? title + ' - ' + detail : detail;
}

const URL_KEYS = ['link', 'url', 'mediaUrl', 'media_url', 'fileUrl', 'file_url', 'previewUrl', 'preview_url', 'mediaLink', 'downloadUrl'];
function firstUrl(row) {
  for (const k of URL_KEYS) if (typeof row[k] === 'string' && /^https?:\/\//i.test(row[k].trim())) return row[k].trim();
  return '';
}

/**
 * The link to a media message's file, if the API gives one at all. Their own
 * inbox never reads one, so every spelling they use elsewhere is tried — the
 * day any of them is populated, pictures simply appear.
 */
function chatMediaUrl(m) {
  if (!MEDIA_TYPES.has(String(m.type || '').toLowerCase())) return '';
  const u = firstUrl(m);
  if (u) return u;
  for (const box of ['image', 'video', 'audio', 'voice', 'document', 'sticker', 'media', 'file', 'payload'])
    if (m[box] && typeof m[box] === 'object') { const v = firstUrl(m[box]); if (v) return v; }
  return '';
}

function chatMediaName(m) {
  if (!MEDIA_TYPES.has(String(m.type || '').toLowerCase())) return '';
  const keys = ['filename', 'fileName', 'file_name', 'name'];
  for (const k of keys) if (typeof m[k] === 'string' && m[k].trim()) return m[k].trim();
  for (const box of ['image', 'video', 'audio', 'document', 'media', 'file'])
    if (m[box] && typeof m[box] === 'object') for (const k of keys) if (typeof m[box][k] === 'string' && m[box][k].trim()) return m[box][k].trim();
  return '';
}

/**
 * Hang our own record of a photo onto its bubble. SmartGrowth stores an
 * image message with its caption and nothing else, so without this every
 * picture we sent is a bubble with words under it and no picture. By wamid
 * when we have one; otherwise caption + time, each record spent once.
 */
async function attachChatMedia(phone, msgs) {
  let rows;
  try { rows = await SgChatMedia.find({ phone }).sort({ _id: 1 }).lean(); } catch (_) { return; }
  if (!rows.length) return;
  const byWamid = new Map();
  rows.forEach((r, i) => { if (r.wamid) byWamid.set(r.wamid, i); });
  const spent = new Set();
  for (const m of msgs) {
    if (!m.mine || m.type.toLowerCase() !== 'image' || m.media) continue;
    let hit = null;
    if (m.wamid && byWamid.has(m.wamid)) hit = byWamid.get(m.wamid);
    else {
      for (let i = 0; i < rows.length; i++) {
        if (spent.has(i)) continue;
        if (String(rows[i].caption || '').trim() !== String(m.body || '').trim()) continue;
        if (Math.abs(new Date(m.cursor) - new Date(rows[i].sentAt)) > CHAT_MEDIA_MATCH_MS) continue;
        hit = i; break;
      }
    }
    if (hit === null) continue;
    spent.add(hit);
    m.media = rows[hit].url || '';
  }
}

/** Who this number is to Pondy Property — listings and buyer requirements. */
async function whoIs(phone) {
  const ten = U.key10(phone);
  if (!U.isMobile10(ten)) return null;
  const [props, buyer] = await Promise.all([
    AddModel.find({ $or: [{ phoneNumber: ten }, { phoneNumber: '+91' + ten }, { phoneNumber: '91' + ten }], isDeleted: { $ne: true } })
      .select('ppcId status ownerName propertyType area city').sort({ createdAt: -1 }).limit(10).lean(),
    BuyerAssistance.findOne({ phoneNumber: ten, isDeleted: { $ne: true } }).select('ba_id baName ba_status area city').lean(),
  ]);
  return {
    phone10: ten,
    name: (props[0] && props[0].ownerName) || (buyer && buyer.baName) || '',
    // return keys kept (rentId/raId) so the Chats page renders unchanged; values are PP's.
    properties: props.map((p) => ({ rentId: p.ppcId, status: p.status, type: p.propertyType || '', area: p.area || p.city || '' })),
    tenant: buyer ? { raId: buyer.ba_id, status: buyer.ba_status, area: buyer.area || buyer.city || '' } : null,
    blocked: await blocks.isBlocked(ten),
  };
}

router.get('/sg/chats/thread', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const phone = U.digits(req.query.phone);
    if (!phone) return fail(res, 'Which conversation?');
    const before = String(req.query.before || '').trim();
    let path = '/api/user-chats/' + encodeURIComponent(phone);
    if (before) path += '?before=' + encodeURIComponent(before);
    const r = await sg.request('GET', path);
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) return fail(res, 'SmartGrowth API: ' + sg.message(r.data, r.code));
    const raw = r.data && Array.isArray(r.data.messages) ? r.data.messages : [];

    let name = '';
    let lastInbound = '';
    const out = [];
    for (const m of raw) {
      if (!m || typeof m !== 'object') continue;
      const mine = U.digits(m.from) !== phone;
      const when = String(m.updatedOn || m.createdOn || '');
      const made = String(m.createdOn || when);
      if (!mine) {
        if (!name && m.profileName) name = String(m.profileName).trim();
        if (made > lastInbound) lastInbound = made;
      }
      out.push({
        id: String(m.id || m._id || ''),
        wamid: String(m.wamid || ''),
        mine,
        type: String(m.type || 'text'),
        body: String(m.body !== undefined ? m.body : (m.text !== undefined ? m.text : '')),
        status: String(m.status || ''),
        when,
        cursor: made,
        template: String(m.templateName || ''),
        templateId: String(m.templateId || ''),
        campaign: String(m.campaignName || ''),
        media: chatMediaUrl(m),
        mediaName: chatMediaName(m),
        error: chatError(m),
      });
    }
    await attachChatMedia(phone, out);

    const t = lastInbound ? new Date(lastInbound).getTime() : NaN;
    const left = Number.isFinite(t) ? Math.max(0, Math.round((t + CHAT_WINDOW_HOURS * 3600000 - Date.now()) / 1000)) : 0;
    res.json({
      status: 'success', phone, name, messages: out,
      hasMore: !!(r.data && r.data.hasMore),
      lastInbound,
      // Worked out here: the answer must not depend on the clock of whoever is at the desk.
      windowOpen: left > 0, windowLeft: left, windowHours: CHAT_WINDOW_HOURS,
      who: await whoIs(phone),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/** Who in this office typed which reply. SmartGrowth records the message, not the login. */
async function logChatReply(phone, text, r, okSend, by) {
  try {
    await SgChatLog.create({ phone, message: text, httpCode: r.code, status: okSend ? 'success' : 'failed', response: String(r.body || '').slice(0, 2000), createdByName: by });
  } catch (e) {
    console.warn('[SmartGrowth] chat log failed:', e.message);
  }
  // Counted towards what this number has received, never capped.
  await limit.record(phone, 'chat', { status: okSend ? 'sent' : 'failed', httpCode: r.code, detail: String(text).slice(0, 200), createdByName: by });
}

router.post('/sg/chats/send', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const b = req.body || {};
    const phone = U.digits(b.phone);
    const text = String(b.message || '').trim();
    if (!phone) return fail(res, 'Which conversation?');
    if (!text) return fail(res, 'Type a message first.');
    const r = await sg.request('POST', '/message/send-text-message', { to: phone, message: text, profileName: String(b.profileName || '').trim() });
    const okSend = sg.ok(r);
    await logChatReply(phone, text, r, okSend, U.adminName(req));
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    // Meta refuses a free-form message once the window has closed; its wording is the only thing that says so.
    if (!okSend) return fail(res, 'Not sent: ' + sg.message(r.data, r.code), { httpCode: r.code });
    res.json({ status: 'success', message: 'Sent.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * A photo into an open conversation, through /message/send-file-message —
 * the call SmartGrowth's own inbox makes. NOT /api/send-raw-message: that is
 * a passthrough to Meta which never writes the message into the thread.
 * The file goes a second time to the media library only for our own bubble's
 * picture, AFTER the member already has it.
 */
router.post('/sg/chats/send-image', photoUpload.single('photo'), async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const b = req.body || {};
    const phone = U.digits(b.phone);
    const caption = String(b.caption || '').trim();
    const who = String(b.profileName || '').trim();
    if (!phone) return fail(res, 'Which conversation?');
    if (caption.length > CHAT_CAPTION_MAX)
      return fail(res, 'That caption is ' + caption.length + ' characters. WhatsApp carries ' + CHAT_CAPTION_MAX + ' under a photo.');
    if (!req.file) return fail(res, 'Pick a photo first.');
    if (req.file.size > MEDIA_IMAGE_MAX)
      return fail(res, 'That photo is ' + U.niceBytes(req.file.size) + '. WhatsApp carries images up to ' + U.niceBytes(MEDIA_IMAGE_MAX) + ' - send a smaller copy.');
    const kind = mediaKind(req.file.buffer);
    if (!kind || kind.format !== 'IMAGE') return fail(res, 'WhatsApp carries JPG and PNG photos only.');
    const name = safeName(req.file.originalname, kind.ext, 'photo');
    const by = U.adminName(req);

    const fields = { to: phone };
    if (caption) fields.message = caption;
    if (who) fields.profileName = who;
    const r = await sg.upload('/message/send-file-message', req.file.buffer, name, kind.mime, fields);
    const okSend = sg.ok(r);
    await logChatReply(phone, (caption ? caption + ' ' : '') + '[photo: ' + name + ']', r, okSend, by);
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (!okSend) return fail(res, 'Not sent: ' + sg.message(r.data, r.code), { httpCode: r.code });

    // Everything past here is ours alone — it must never turn a delivered photo into an error.
    let url = mediaUrlOf(r.data);
    if (!url) {
      const up = await sg.upload('/upload/media/upload-asset', req.file.buffer, name, kind.mime);
      if (sg.ok(up)) url = mediaUrlOf(up.data);
    }
    try {
      await SgChatMedia.create({ wamid: wamidOf(r.data), phone, url, mime: kind.mime, fileName: name, caption, sentAt: new Date(), createdByName: by });
    } catch (e) { console.warn('[SmartGrowth] chat media record failed:', e.message); }
    res.json({ status: 'success', message: 'Sent.', url });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/**
 * An approved template into ONE conversation — the way to reach somebody
 * whose 24-hour window has shut. Same endpoint, log and caps as Send Message;
 * named "<who>-chat-<time>" so Campaign Report files it under Chats.
 */
router.post('/sg/chats/send-template', async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) return fail(res, 'Add your API token and API code in Settings first.');
    const b = req.body || {};
    const phone = U.normalisePhone(b.phone);
    const templateId = String(b.templateId || '').trim();
    const templateName = String(b.templateName || '').trim();
    if (!phone) return fail(res, 'Which conversation?');
    if (!templateId) return fail(res, 'Choose a template first.');
    if (await blocks.isBlocked(phone)) return fail(res, 'This number has asked us to stop messaging them. Unblock it first if that has changed.');
    const head = headerFields(b);
    if (head.error) return fail(res, head.error);
    const by = U.adminName(req);
    const gate = await limit.check(phone, 'campaign');
    if (!gate.ok) {
      await limit.recordBlocked(phone, 'campaign', { templateName, createdByName: by, detail: 'daily cap reached (' + gate.sent + ' of ' + gate.cap + ')' });
      return fail(res, 'Held back — this number has already had ' + gate.sent + ' of ' + gate.cap + ' campaign messages allowed today.');
    }
    const campaignName = U.campaignWho(req) + '-chat-' + U.istCompact();
    const vars = Array.isArray(b.variables) ? b.variables.map(String) : [];
    const r = await sendTemplate({ templateId, campaignName, phones: [phone], bodyParams: vars, ...head });
    await logCampaign({ templateId, templateName, campaignName, phones: [phone], vars, r, ok: r.okSend, by });
    await limit.record(phone, 'campaign', { status: r.okSend ? 'sent' : 'failed', templateName, campaignName, httpCode: r.code, createdByName: by });
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (!r.okSend) return fail(res, 'Send failed: ' + sg.message(r.data, r.code));
    res.json({ status: 'success', message: 'Template sent. It appears in the thread once SmartGrowth records it.', campaignName });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/chats/block', async (req, res) => {
  try {
    const b = req.body || {};
    const phone = U.key10(b.phone);
    if (!phone) return fail(res, 'Which number?');
    if (b.block === false || b.block === 'false') {
      await blocks.unblock(phone);
      return res.json({ status: 'success', blocked: false, message: 'Unblocked. Campaigns and bots may message this number again.' });
    }
    await blocks.block(phone, 'chats', String(b.note || ''), U.adminName(req));
    res.json({ status: 'success', blocked: true, message: 'Blocked. No campaign, bot or action message will go to this number.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── The header alert ───────────────────────────────────────────────────────
// It polls from every open admin page, so one look at SmartGrowth is shared
// for a few seconds: the unread counts belong to the account, not to whoever
// asked. A refresh already under way turns the others away with the previous
// snapshot. Quiet about its own troubles — no token, a bad minute — because it
// runs on every page and must never put an error across the admin.

const ALERT_MAX = 10;
const ALERT_CACHE_MS = 5000;
let alert = { data: null, at: 0, inflight: null };

const quiet = { status: 'success', unread: 0, threads: [], newest: '' };

function alertPayload(rows) {
  let unread = 0;
  const out = [];
  for (const c of rows) {
    if (c.unread < 1) continue;
    unread += c.unread;
    if (out.length < ALERT_MAX) out.push(c);
  }
  return { unread, threads: out, newest: out.length ? out[0].when : '' };
}

router.get('/sg/chat-alerts', async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken) return res.json(quiet);
    const age = Date.now() - alert.at;
    if (alert.data && age < ALERT_CACHE_MS) return res.json({ status: 'success', ...alert.data, age: Math.round(age / 1000) });
    if (alert.inflight) {
      if (alert.data) return res.json({ status: 'success', ...alert.data, age: Math.round(age / 1000) });
      await alert.inflight;
      return res.json({ status: 'success', ...(alert.data || quiet), age: 0 });
    }
    alert.inflight = chatThreads('', 20).then((t) => {
      if (!t.error) { alert.data = alertPayload(t.rows); alert.at = Date.now(); }
    }).finally(() => { alert.inflight = null; });
    await alert.inflight;
    res.json({ status: 'success', ...(alert.data || quiet), age: 0 });
  } catch (_) {
    res.json(quiet);
  }
});

module.exports = router;
