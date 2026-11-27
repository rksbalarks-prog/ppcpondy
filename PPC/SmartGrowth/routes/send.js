// Communication > WhatsApp > Send Message — settings, the template list, and
// the three ways to send: one number, a pasted list, or a sheet with a column
// per template variable.
//
//   GET  /sg/config               connected? (no secrets, token masked)
//   POST /sg/settings             save base URL / API code / token (blank token keeps the old)
//   GET  /sg/templates            every template, live approval status
//   GET  /sg/templates/export     the same as CSV (q, status filters)
//   GET  /sg/templates/print      a printable page — the browser's Save as PDF makes the file
//   POST /sg/send                 single / bulk send
//   GET  /sg/sample-sheet         a starter CSV for a template's variables
//   POST /sg/parse-sheet          read an uploaded .xlsx/.csv, hand back its rows
//   POST /sg/send-rows            one chunk of sheet rows, one API call per row
//   POST /sg/upload-media         put a header file where Meta can fetch it

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');

const sg = require('../client');
const tpl = require('../templates');
const { sendTemplate, logCampaign, headerFields } = require('../sender');
const { limit, blocks } = require('../guards');
const { MEDIA_DOC_MAX, mediaKind, safeName, mediaUrlOf } = require('../mediaUtil');
const U = require('../util');

const router = express.Router();

// Personalised variables mean one API call per row, so the browser sends a
// sheet in chunks of this many and shows progress between them.
const ROWS_PER_REQUEST = 25;

const sheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const mediaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MEDIA_DOC_MAX } });

const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

// ── Settings ───────────────────────────────────────────────────────────────

router.get('/sg/config', async (req, res) => {
  try {
    const s = await sg.settings(true);
    res.json({
      status: 'success',
      baseUrl: s.baseUrl,
      apiCode: s.apiCode,
      tokenSet: !!s.apiToken,
      tokenMask: sg.tokenMask(s.apiToken),
      tokenFromEnv: s.tokenFromEnv,
      codeFromEnv: s.codeFromEnv,
      configured: !!(s.apiToken && s.apiCode),
      rowsPerRequest: ROWS_PER_REQUEST,
      defaultCountryCode: U.DEFAULT_COUNTRY_CODE,
      adminLogin: U.campaignWho(req),
      runner: process.env.SMARTGROWTH_RUNNER === '1',
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/settings', async (req, res) => {
  try {
    const b = req.body || {};
    const doc = await sg.settingsDoc();
    const baseUrl = String(b.baseUrl || '').trim().replace(/\/+$/, '');
    if (baseUrl && !U.isPublicUrl(baseUrl)) return fail(res, 'The base URL must be a full https:// address.');
    doc.baseUrl = baseUrl;
    doc.apiCode = String(b.apiCode || '').trim();
    const token = String(b.apiToken || '').trim();
    if (token) doc.apiToken = token;
    doc.updatedBy = U.adminName(req);
    await doc.save();
    sg.invalidate();
    tpl.forget();
    const s = await sg.settings(true);
    res.json({
      status: 'success', message: 'Settings saved.',
      configured: !!(s.apiToken && s.apiCode), tokenMask: sg.tokenMask(s.apiToken),
      apiCode: s.apiCode, baseUrl: s.baseUrl,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── Templates ──────────────────────────────────────────────────────────────

router.get('/sg/templates', async (req, res) => {
  try {
    const r = await tpl.fetchTemplates(req.query.fresh !== '0');
    if (!r.ok) return fail(res, r.message, { httpCode: r.httpCode });
    res.json({ status: 'success', count: r.templates.length, templates: r.templates });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

/** The rows both exports carry, filtered the way the page is (status prefix, search). */
async function exportRows(req) {
  const r = await tpl.fetchTemplates(true);
  if (!r.ok) throw new Error(r.message);
  const q = String(req.query.q || '').trim().toLowerCase();
  const status = String(req.query.status || '').trim().toUpperCase();
  return r.templates
    .filter((t) => !status || t.status.toUpperCase().startsWith(status))
    .filter((t) => !q || t.name.toLowerCase().includes(q) || t.bodyText.toLowerCase().includes(q))
    .map((t) => {
      const parts = t.parts;
      // Counted off the wording that is going to print: an authentication
      // template's restored "{{1}} is your verification code" has a blank.
      let vars = t.variableCount;
      if (!vars) {
        const v = tpl.templateVars(parts.header + ' ' + parts.body);
        if (v.length) vars = Math.max(...v);
      }
      return { id: t.id, name: t.name, category: t.category, language: t.language, status: t.status, vars, parts };
    });
}

router.get('/sg/templates/export', async (req, res) => {
  try {
    const rows = await exportRows(req);
    const csv = U.toCsv(['Template id', 'Template name', 'Category', 'Variables', 'Message'],
      rows.map((r) => [r.id, r.name, r.category, r.vars, tpl.messageText(r.parts)]));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="whatsapp-templates-${U.istToday()}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(502).send(e.message);
  }
});

const esc = (s) => String(s === undefined || s === null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

router.get('/sg/templates/print', async (req, res) => {
  try {
    const rows = await exportRows(req);
    const body = rows.map((r) => `<tr>
      <td class="id">${esc(r.id)}</td>
      <td><b>${esc(r.name)}</b><div class="m">${esc(r.category)} · ${esc(r.language)} · ${esc(r.status)}</div></td>
      <td class="c">${r.vars}</td>
      <td class="msg">${r.parts.header ? `<div class="h">${esc(r.parts.header)}</div>` : ''}${esc(r.parts.body)}${r.parts.footer ? `<div class="f">${esc(r.parts.footer)}</div>` : ''}${r.parts.buttons.map((b) => `<span class="b">${esc(b.text || b.type)}</span>`).join('')}</td>
    </tr>`).join('');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>WhatsApp templates — Rent Pondy</title>
<style>
body{font-family:Arial,'Noto Sans Tamil',sans-serif;margin:24px;color:#222}
h1{font-size:18px;margin:0 0 4px}.sub{color:#666;font-size:12px;margin-bottom:14px}
table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px;vertical-align:top;text-align:left}
th{background:#f0f4f0}.id{font-family:monospace;white-space:nowrap}.c{text-align:center}.m{color:#777;font-size:11px}
.msg{white-space:pre-wrap}.h{font-weight:bold;margin-bottom:4px}.f{color:#777;margin-top:4px}
.b{display:inline-block;border:1px solid #25D366;color:#128C7E;border-radius:10px;padding:1px 8px;margin:4px 4px 0 0}
.bar{margin-bottom:12px}@media print{.bar{display:none}}
</style></head><body>
<div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div>
<h1>WhatsApp templates</h1>
<div class="sub">${rows.length} template(s)${req.query.status ? ' · status ' + esc(req.query.status) : ''}${req.query.q ? ' · matching “' + esc(req.query.q) + '”' : ''} · ${esc(U.istStamp())} IST</div>
<table><thead><tr><th>Template id</th><th>Name</th><th>Vars</th><th>Message</th></tr></thead><tbody>${body}</tbody></table>
</body></html>`);
  } catch (e) {
    res.status(502).send(esc(e.message));
  }
});

// ── Send: single / bulk ────────────────────────────────────────────────────

const list5 = (a) => a.slice(0, 5).join(', ') + (a.length > 5 ? ', +' + (a.length - 5) + ' more' : '');

router.post('/sg/send', async (req, res) => {
  try {
    const b = req.body || {};
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) return fail(res, 'Add your API token and API code in Settings first.');
    const templateId = String(b.templateId || '').trim();
    const templateName = String(b.templateName || '').trim();
    if (!templateId) return fail(res, 'Choose a template first.');
    const campaignName = String(b.campaignName || '').trim() || U.autoCampaignName(req);
    const head = headerFields(b);
    if (head.error) return fail(res, head.error);
    const by = U.adminName(req);

    // Split, normalise, THEN dedupe: 7094422941 and 917094422941 are one person.
    const seen = new Set();
    const rejected = [];
    for (const p of U.splitNumbers(b.phoneNumbers)) {
      const d = U.normalisePhone(p);
      if (!d) continue;
      if (d.length < 8 || d.length > 15) { rejected.push(p.trim()); continue; }
      seen.add(d);
    }
    let numbers = [...seen];
    if (!numbers.length)
      return fail(res, 'No usable phone number.' + (rejected.length ? ' Could not read: ' + rejected.slice(0, 5).join(', ') + '.' : ' Enter a 10-digit number, or one with its country code.'));

    // Anybody who asked us to stop is taken out first — before the cap, before the campaign.
    const blocked = [];
    const kept = [];
    for (const p of numbers) (await blocks.isBlocked(p) ? blocked : kept).push(p);
    numbers = kept;
    if (!numbers.length)
      return fail(res, 'Nothing sent — every number on that list has asked us to stop messaging them (' + blocked.length + ' blocked).');

    // The daily cap: numbers at their allowance are written down as held back, not sent.
    const lim = await limit.filter(numbers, 'campaign');
    const capped = Object.keys(lim.blocked);
    for (const p of capped)
      await limit.recordBlocked(p, 'campaign', { templateName, campaignName, createdByName: by, detail: 'daily cap reached (' + lim.blocked[p] + ' already sent today)' });
    numbers = lim.allow;
    if (!numbers.length)
      return fail(res, 'Nothing sent — ' + capped.length + ' number(s) have already had their messages for today. Raise the daily limit on Limits & Alerts, or send this tomorrow.');

    const vars = Array.isArray(b.variables) ? b.variables.map(String) : [];
    const r = await sendTemplate({ templateId, campaignName, phones: numbers, bodyParams: vars, ...head });
    await logCampaign({ templateId, templateName, campaignName, phones: numbers, vars, r, ok: r.okSend, by });
    for (const p of numbers)
      await limit.record(p, 'campaign', { status: r.okSend ? 'sent' : 'failed', templateName, campaignName, httpCode: r.code, createdByName: by });

    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (!r.okSend) return fail(res, 'Send failed: ' + sg.message(r.data, r.code), { httpCode: r.code, raw: r.body });

    res.json({
      status: 'success',
      message: 'Campaign queued to ' + numbers.length + ' number(s): ' + list5(numbers) + '.'
        + (blocked.length ? ' Left out — they have asked us to stop: ' + list5(blocked) + '.' : '')
        + (rejected.length ? ' Skipped as unreadable: ' + rejected.slice(0, 5).join(', ') + '.' : '')
        + (capped.length ? ' Held back by the daily limit: ' + list5(capped) + '.' : ''),
      campaignName, httpCode: r.code, raw: r.data || r.body,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── Send: a sheet, one message per row ─────────────────────────────────────

router.get('/sg/sample-sheet', (req, res) => {
  let names = [];
  try { names = JSON.parse(String(req.query.columns || '[]')); } catch (_) { names = []; }
  if (!Array.isArray(names) || !names.length) names = ['var1'];
  const file = String(req.query.name || 'template').replace(/[^A-Za-z0-9_-]+/g, '-');
  const csv = U.toCsv(['phone', ...names.map(String)], [
    ['919999900001', ...names.map(() => 'example')],
    ['9999900002', ...names.map(() => 'example')],
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="whatsapp-${file}.csv"`);
  res.send(csv);
});

/** Which row holds the column names: the first whose cells are mostly words, not numbers. */
function guessHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map((c) => String(c === undefined || c === null ? '' : c).trim()).filter(Boolean);
    if (!cells.length) continue;
    const words = cells.filter((c) => /[A-Za-z஀-௿]/.test(c) && U.digits(c).length < 7).length;
    if (words >= Math.ceil(cells.length / 2)) return i;
    return -1;   // the first non-empty row is data — no header row
  }
  return -1;
}

function splitSheet(all, headerIndex) {
  const width = all.reduce((m, r) => Math.max(m, r.length), 0);
  const headers = [];
  for (let c = 0; c < width; c++) {
    const h = headerIndex >= 0 ? String((all[headerIndex] || [])[c] === undefined ? '' : all[headerIndex][c]).trim() : '';
    headers.push(h || 'Column ' + (c + 1));
  }
  const rows = all.slice(headerIndex + 1)
    .map((r) => headers.map((_, c) => String(r[c] === undefined || r[c] === null ? '' : r[c]).trim()))
    .filter((r) => r.some((x) => x !== ''));
  return { headers, rows };
}

router.post('/sg/parse-sheet', sheetUpload.single('sheet'), (req, res) => {
  try {
    if (!req.file) return fail(res, 'No file was uploaded.');
    let wb;
    try { wb = XLSX.read(req.file.buffer, { type: 'buffer', raw: false, cellText: true }); }
    catch (_) { return fail(res, 'That file could not be read. Save it as .xlsx or .csv and try again.'); }
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return fail(res, 'That file has no sheets in it.');
    // raw:false so a phone number stored as a number does not come back 9.19E+11.
    const all = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
      .filter((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ''));
    if (!all.length) return fail(res, 'That sheet is empty.');
    if (all.length > 20001) return fail(res, 'That sheet has ' + (all.length - 1) + ' rows. Send 20,000 at most at a time.');
    const headerIndex = guessHeader(all);
    const t = splitSheet(all, headerIndex);
    res.json({ status: 'success', fileName: req.file.originalname, headers: t.headers, rows: t.rows, rowCount: t.rows.length, headerIndex, allRows: all });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/send-rows', async (req, res) => {
  try {
    const b = req.body || {};
    const s = await sg.settings();
    if (!s.apiToken || !s.apiCode) return fail(res, 'Add your API token and API code in Settings first.');
    const templateId = String(b.templateId || '').trim();
    const templateName = String(b.templateName || '').trim();
    if (!templateId) return fail(res, 'Choose a template first.');
    const campaignName = String(b.campaignName || '').trim() || U.autoCampaignName(req);
    const rows = Array.isArray(b.rows) ? b.rows : [];
    if (!rows.length) return fail(res, 'No rows were sent.');
    if (rows.length > ROWS_PER_REQUEST) return fail(res, 'Too many rows in one request (max ' + ROWS_PER_REQUEST + ').');
    const head = headerFields(b);
    if (head.error) return fail(res, head.error);
    const by = U.adminName(req);
    const cc = String(b.countryCode || '').trim();

    const results = [];
    const numbers = [];
    let sent = 0;
    let lastBody = '';
    let lastCode = 0;
    for (const row of rows) {
      // The country code is added HERE and only here; normalising on both
      // sides is how a number ends up prefixed twice.
      const phone = row && row.phone !== undefined ? U.normalisePhone(row.phone, cc) : '';
      const vars = row && Array.isArray(row.vars) ? row.vars.map(String) : [];
      if (!phone) { results.push({ phone: '', ok: false, code: 0, message: 'No phone number in this row.' }); continue; }
      if (await blocks.isBlocked(phone)) { results.push({ phone, ok: false, code: 0, message: 'Left out — this number asked us to stop.' }); continue; }
      // Checked per row: a number twice in one sheet must be stopped by the second check.
      const gate = await limit.check(phone, 'campaign');
      if (!gate.ok) {
        await limit.recordBlocked(phone, 'campaign', { templateName, campaignName, createdByName: by, detail: 'daily cap reached (' + gate.sent + ' of ' + gate.cap + ')' });
        results.push({ phone, ok: false, code: 0, message: 'Held back — already had ' + gate.sent + ' of ' + gate.cap + ' allowed today.' });
        continue;
      }
      const r = await sendTemplate({ templateId, campaignName, phones: [phone], bodyParams: vars, ...head });
      if (r.okSend) { sent++; numbers.push(phone); }
      lastBody = r.body; lastCode = r.code;
      await limit.record(phone, 'campaign', { status: r.okSend ? 'sent' : 'failed', templateName, campaignName, httpCode: r.code, createdByName: by });
      results.push({ phone, ok: r.okSend, code: r.code, message: r.okSend ? r.msg : sg.failText(r) });
    }

    // One log row per chunk: the log is a record of campaigns, not of recipients.
    const failed = results.filter((x) => !x.ok);
    let summary = results.length + ' row(s), ' + (results.length - failed.length) + ' accepted';
    summary += failed.length ? '\nFailed:\n' + failed.slice(0, 20).map((x) => x.phone + ': ' + x.message).join('\n') : '\nLast response: ' + lastBody;
    await logCampaign({ templateId, templateName, campaignName, phones: numbers, vars: null, r: { code: lastCode, body: summary.slice(0, 2000) }, ok: sent > 0, by });

    res.json({ status: 'success', sent, failed: results.length - sent, results, campaignName });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── The header file ────────────────────────────────────────────────────────
// Goes to SmartGrowth's own media library, whose public link is what the send
// carries. A Drive or Photos link is a page, not a file: Meta fetches HTML and
// sends the message with an empty header, and SmartGrowth still answers 200.

router.post('/sg/upload-media', mediaUpload.single('media'), async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken) return fail(res, 'Add your API token in Settings first.');
    if (!req.file) return fail(res, 'Choose a file first.');
    const kind = mediaKind(req.file.buffer);
    if (!kind) return fail(res, 'A WhatsApp header carries a JPG or PNG picture, an MP4 video, or a PDF. That file is none of them.');
    if (req.file.size > kind.max)
      return fail(res, 'That file is ' + U.niceBytes(req.file.size) + '. WhatsApp carries a ' + kind.word + ' header up to ' + U.niceBytes(kind.max) + '.');
    const want = String((req.body && req.body.headerFormat) || '').trim().toUpperCase();
    if (want && want !== kind.format)
      return fail(res, 'This template’s header is a ' + want.toLowerCase() + ', and that file is a ' + kind.word + '. Choose a ' + want.toLowerCase() + ' file.');
    const name = safeName(req.file.originalname, kind.ext, 'header');
    const up = await sg.upload('/upload/media/upload-asset', req.file.buffer, name, kind.mime);
    if (up.error) return fail(res, 'Could not reach SmartGrowth: ' + up.error);
    if (up.code < 200 || up.code >= 300) return fail(res, 'Upload refused: ' + sg.message(up.data, up.code));
    const url = mediaUrlOf(up.data);
    if (!url) return fail(res, 'The file uploaded but SmartGrowth did not give a public link for it. Paste a link to the file instead.');
    res.json({ status: 'success', url, fileName: name, format: kind.format });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
