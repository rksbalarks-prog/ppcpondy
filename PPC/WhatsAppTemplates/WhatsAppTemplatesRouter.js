// Admin "WhatsApp Templates" (on the WhatsApp Bot page). Mounted under /PPC, BEFORE
// SingleSendRouter (its catch-all GET "/:id").
//
//   GET  /PPC/wa-templates                     every template + its Meta status on the account + switches
//   PUT  /PPC/wa-templates/settings            {templatesEnabled, apiCode, templateDailyLimit, templateOn:{key:bool}}
//   POST /PPC/wa-templates/submit-all          send every template not yet on the account to Meta
//   POST /PPC/wa-templates/:key/submit         send one to Meta for approval
//   POST /PPC/wa-templates/:key/test {phone}   send one now with its example values (approved ones only)

const express = require('express');
const { WaBotSettings, getSettings } = require('../WhatsAppBot/models');
const { sg } = require('../WhatsAppBot/smartgrowth');
const WhatsAppLog = require('../WhatsAppActivity/WhatsAppLogModel');
const { TEMPLATES, BY_KEY, components, problems } = require('./templates');
const { accountTemplates, sendTemplate, isOn } = require('./sender');
const { WaCustomTemplate, validateCustom, customComponents } = require('./customModel');

const router = express.Router();
const mask = (t) => (t ? `${'•'.repeat(6)}${String(t).slice(-3)}` : '');
const fail = (res, code, error) => res.status(code).json({ error });

async function submit(s, t) {
  const r = t.category === 'AUTHENTICATION'
    ? await sg(s, 'POST', '/api/create-authentication-template', { name: t.name }, 90000)
    : await sg(s, 'POST', '/api/create-template-for-approval', {
      name: t.name, category: t.category, language: t.language, components: components(t), approveForAll: false,
    }, 90000);
  return r;
}

// Same call as submit(), but for an office-authored (custom) template.
async function submitCustom(s, c) {
  return c.category === 'AUTHENTICATION'
    ? sg(s, 'POST', '/api/create-authentication-template', { name: c.name }, 90000)
    : sg(s, 'POST', '/api/create-template-for-approval', {
      name: c.name, category: c.category, language: c.language, components: customComponents(c), approveForAll: false,
    }, 90000);
}

// One custom row shaped like a fixed template, for the admin table.
const customRow = (c, acc) => ({
  id: String(c._id), custom: true, key: `custom:${c._id}`, name: c.name, category: c.category,
  language: c.language, label: c.label || c.name, when: 'Office template', audience: 'custom', source: 'admin',
  body: c.body, example: c.example || [], footer: c.footer || '', buttonText: c.buttonText || '', buttonUrl: c.buttonUrl || '',
  note: c.createdBy ? `Added by ${c.createdBy}` : '', createdAt: c.createdAt,
  preview: String(c.body || '').replace(/\{\{(\d+)\}\}/g, (m, n) => (c.example || [])[n - 1] ?? m),
  on: false, defaultOn: false,
  status: acc.byName[c.name] ? (acc.byName[c.name].status || 'SUBMITTED') : (c.submittedAt ? 'SUBMITTED' : 'NOT SUBMITTED'),
  problems: c.category === 'AUTHENTICATION' ? [] : validateCustom(c),
});

router.get('/wa-templates', async (req, res) => {
  try {
    const s = await getSettings();
    let acc = { byName: {}, error: '' };
    if (s.apiToken) acc = await accountTemplates(s, req.query.refresh === '1');
    const DAY = 24 * 3600000; const IST = 5.5 * 3600000;
    const sentToday = await WhatsAppLog.countDocuments({
      createdAt: { $gte: new Date(Math.floor((Date.now() + IST) / DAY) * DAY - IST) }, provider: /"via":"template"/, status: 'sent',
    });
    const customs = await WaCustomTemplate.find().sort({ createdAt: -1 }).lean();
    res.json({
      settings: {
        templatesEnabled: !!s.templatesEnabled, hasToken: !!s.apiToken, hasApiCode: !!s.apiCode, apiCodeMasked: mask(s.apiCode),
        templateDailyLimit: s.templateDailyLimit, sentToday,
      },
      accountError: acc.error || '',
      templates: TEMPLATES.map((t) => ({
        key: t.key, name: t.name, category: t.category, label: t.label, when: t.when, audience: t.audience,
        source: t.source, body: t.body, example: t.example, note: t.note || '',
        preview: t.body.replace(/\{\{(\d+)\}\}/g, (m, n) => t.example[n - 1]),
        on: isOn(s, t.key), defaultOn: !!t.defaultOn, custom: false,
        status: acc.byName[t.name] ? acc.byName[t.name].status || 'SUBMITTED' : 'NOT SUBMITTED',
        problems: t.category === 'AUTHENTICATION' ? [] : problems(t),
      })).concat(customs.map((c) => customRow(c, acc))),
    });
  } catch (e) { fail(res, 500, e.message); }
});

router.put('/wa-templates/settings', async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};
    if (typeof b.templatesEnabled === 'boolean') set.templatesEnabled = b.templatesEnabled;
    if (typeof b.apiCode === 'string' && b.apiCode.trim() && !b.apiCode.includes('•')) set.apiCode = b.apiCode.trim().slice(0, 200);
    if (b.templateDailyLimit !== undefined) {
      const n = Math.round(Number(b.templateDailyLimit));
      if (!(n >= 0 && n <= 100000)) return fail(res, 400, 'Daily limit must be 0 (no limit) to 100000');
      set.templateDailyLimit = n;
    }
    if (b.templateOn && typeof b.templateOn === 'object') {
      const s = await getSettings();
      const on = { ...(s.templateOn || {}) };
      for (const [k, v] of Object.entries(b.templateOn)) if (BY_KEY[k] && typeof v === 'boolean') on[k] = v;
      set.templateOn = on;
    }
    await WaBotSettings.updateOne({ key: 'main' }, { $set: set }, { upsert: true });
    res.json({ ok: true });
  } catch (e) { fail(res, 500, e.message); }
});

router.post('/wa-templates/submit-all', async (req, res) => {
  try {
    const s = await getSettings();
    if (!s.apiToken) return fail(res, 400, 'Save the SmartGrowth API token first (Settings above).');
    const acc = await accountTemplates(s, true);
    if (acc.error) return fail(res, 502, `Could not read the account's templates: ${acc.error}`);
    const out = [];
    for (const t of TEMPLATES) {
      if (acc.byName[t.name]) { out.push({ name: t.name, result: `already ${acc.byName[t.name].status || 'on the account'}` }); continue; }
      const p = t.category === 'AUTHENTICATION' ? [] : problems(t);
      if (p.length) { out.push({ name: t.name, result: `not sent: ${p.join('; ')}` }); continue; }
      const r = await submit(s, t);
      out.push({ name: t.name, result: r.ok ? 'sent to Meta for approval' : `refused: ${r.error}` });
    }
    await accountTemplates(s, true);
    res.json({ results: out });
  } catch (e) { fail(res, 500, e.message); }
});

router.post('/wa-templates/:key/submit', async (req, res) => {
  try {
    const t = BY_KEY[req.params.key];
    if (!t) return fail(res, 404, 'unknown template');
    const s = await getSettings();
    if (!s.apiToken) return fail(res, 400, 'Save the SmartGrowth API token first (Settings above).');
    const p = t.category === 'AUTHENTICATION' ? [] : problems(t);
    if (p.length) return fail(res, 400, p.join('; '));
    const r = await submit(s, t);
    if (!r.ok) return fail(res, 502, `Meta / SmartGrowth refused it: ${r.error}`);
    await accountTemplates(s, true);
    res.json({ message: `${t.name} sent to Meta for approval - usually minutes, sometimes a day.` });
  } catch (e) { fail(res, 500, e.message); }
});

router.post('/wa-templates/:key/test', async (req, res) => {
  try {
    const t = BY_KEY[req.params.key];
    if (!t) return fail(res, 404, 'unknown template');
    const phone = String((req.body || {}).phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) return fail(res, 400, 'Give a 10-digit test number.');
    const r = await sendTemplate(t.key, phone, t.example, { force: true, campaign: `Pondy Properties - TEST ${t.label}` });
    if (!r.ok) return fail(res, 502, r.error);
    WhatsAppLog.create({ to: phone, category: 'other', audience: t.audience === 'owner' ? 'owner' : 'user',
      message: `[TEST] ${t.body.replace(/\{\{(\d+)\}\}/g, (m, n) => t.example[n - 1])}`, status: 'sent',
      provider: JSON.stringify({ via: 'template', template: t.name, test: true }).slice(0, 300), source: 'admin' }).catch(() => {});
    res.json({ message: `Test ${t.name} sent to ${phone}.` });
  } catch (e) { fail(res, 500, e.message); }
});

// ── Office-authored templates (the "+ New template" builder) ────────────────

// Pull the editable fields out of a request body, trimmed and bounded.
function readFields(b) {
  const example = Array.isArray(b.example) ? b.example.map((v) => String(v == null ? '' : v).slice(0, 200)) : [];
  return {
    name: String(b.name || '').trim().toLowerCase(),
    category: String(b.category || 'UTILITY').toUpperCase(),
    language: String(b.language || 'en').trim(),
    body: String(b.body || '').slice(0, 1024),
    example,
    footer: String(b.footer || '').slice(0, 60),
    buttonText: String(b.buttonText || '').slice(0, 25),
    buttonUrl: String(b.buttonUrl || '').trim().slice(0, 2000),
    label: String(b.label || '').slice(0, 120),
  };
}

// POST /wa-templates/create  - save a new template and send it to Meta for approval.
router.post('/wa-templates/create', async (req, res) => {
  try {
    const f = readFields(req.body || {});
    f.createdBy = String((req.body || {}).createdBy || '').slice(0, 80);
    const errs = validateCustom(f);
    if (errs.length) return fail(res, 400, errs.join('; '));
    if (BY_KEY[f.name] || TEMPLATES.some((t) => t.name === f.name)) return fail(res, 400, `"${f.name}" is a built-in template name - pick another.`);
    if (await WaCustomTemplate.findOne({ name: f.name })) return fail(res, 400, `A template named "${f.name}" already exists.`);

    const s = await getSettings();
    if (!s.apiToken) return fail(res, 400, 'Connect a SmartGrowth account first (SmartGrowth account card above).');
    const r = await submitCustom(s, f);
    if (!r.ok) return fail(res, 502, `Meta / SmartGrowth refused it: ${r.error}`);
    const doc = await WaCustomTemplate.create({ ...f, submittedAt: new Date() });
    await accountTemplates(s, true);
    res.json({ message: `"${doc.name}" sent to Meta for approval - usually minutes, sometimes a day.`, id: String(doc._id) });
  } catch (e) {
    if (e && e.code === 11000) return fail(res, 400, 'A template with that name already exists.');
    fail(res, 500, e.message);
  }
});

// PUT /wa-templates/custom/:id  - edit wording (name + language are locked) and resubmit.
router.put('/wa-templates/custom/:id', async (req, res) => {
  try {
    const doc = await WaCustomTemplate.findById(req.params.id);
    if (!doc) return fail(res, 404, 'template not found');
    const f = readFields(req.body || {});
    // Meta locks name + language once submitted - keep the originals.
    f.name = doc.name; f.language = doc.language;
    const errs = validateCustom(f);
    if (errs.length) return fail(res, 400, errs.join('; '));

    const s = await getSettings();
    if (!s.apiToken) return fail(res, 400, 'Connect a SmartGrowth account first.');
    const r = await submitCustom(s, f);
    if (!r.ok) return fail(res, 502, `Meta / SmartGrowth refused it: ${r.error}`);
    Object.assign(doc, { category: f.category, body: f.body, example: f.example, footer: f.footer, buttonText: f.buttonText, buttonUrl: f.buttonUrl, label: f.label, submittedAt: new Date() });
    await doc.save();
    await accountTemplates(s, true);
    res.json({ message: `"${doc.name}" updated and resent to Meta for approval.` });
  } catch (e) { fail(res, 500, e.message); }
});

// POST /wa-templates/custom/:id/submit  - resend an existing custom template to Meta.
router.post('/wa-templates/custom/:id/submit', async (req, res) => {
  try {
    const doc = await WaCustomTemplate.findById(req.params.id);
    if (!doc) return fail(res, 404, 'template not found');
    const errs = validateCustom(doc);
    if (errs.length) return fail(res, 400, errs.join('; '));
    const s = await getSettings();
    if (!s.apiToken) return fail(res, 400, 'Connect a SmartGrowth account first.');
    const r = await submitCustom(s, doc);
    if (!r.ok) return fail(res, 502, `Meta / SmartGrowth refused it: ${r.error}`);
    doc.submittedAt = new Date(); await doc.save();
    await accountTemplates(s, true);
    res.json({ message: `"${doc.name}" sent to Meta for approval.` });
  } catch (e) { fail(res, 500, e.message); }
});

// POST /wa-templates/custom/:id/test {phone}  - send an approved custom template now.
router.post('/wa-templates/custom/:id/test', async (req, res) => {
  try {
    const doc = await WaCustomTemplate.findById(req.params.id).lean();
    if (!doc) return fail(res, 404, 'template not found');
    const phone = String((req.body || {}).phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) return fail(res, 400, 'Give a 10-digit test number.');
    const s = await getSettings();
    if (!s.apiToken || !s.apiCode) return fail(res, 400, 'SmartGrowth token / API code not saved.');
    const acc = await accountTemplates(s, true);
    const found = acc.byName[doc.name];
    if (!found || !found.id) return fail(res, 400, `"${doc.name}" is not on the account yet.`);
    if (found.status !== 'APPROVED') return fail(res, 400, `"${doc.name}" is ${found.status || 'not approved'} - test only approved templates.`);
    const body = {
      templateId: found.id, apiCode: s.apiCode, campaignName: `Pondy Properties - TEST ${doc.name}`,
      phoneNumbers: [`91${phone}`], bodyParams: (doc.example || []).map((v) => String(v).replace(/\s+/g, ' ').trim().slice(0, 200)),
    };
    const r = await sg(s, 'POST', '/send/campaign', body, 30000);
    const d = r.data;
    const refused = d && typeof d === 'object' && (d.success === false || d.status === false || /fail|error/i.test(String(d.status || '')));
    if (!r.ok || refused) return fail(res, 502, r.error || (d && d.message) || 'refused');
    WhatsAppLog.create({ to: phone, category: 'other', audience: 'user',
      message: `[TEST] ${String(doc.body || '').replace(/\{\{(\d+)\}\}/g, (m, n) => (doc.example || [])[n - 1] ?? m)}`, status: 'sent',
      provider: JSON.stringify({ via: 'template', template: doc.name, test: true }).slice(0, 300), source: 'admin' }).catch(() => {});
    res.json({ message: `Test "${doc.name}" sent to ${phone}.` });
  } catch (e) { fail(res, 500, e.message); }
});

// DELETE /wa-templates/custom/:id  - remove the office template from this admin.
// NOTE: this removes OUR record only. Deleting it on SmartGrowth / Meta needs the
// SmartGrowth delete-template endpoint used by the PM admin (see pm-vps handoff).
router.delete('/wa-templates/custom/:id', async (req, res) => {
  try {
    const doc = await WaCustomTemplate.findByIdAndDelete(req.params.id);
    if (!doc) return fail(res, 404, 'template not found');
    res.json({ message: `"${doc.name}" removed from the admin. It may still exist on the SmartGrowth account.` });
  } catch (e) { fail(res, 500, e.message); }
});

module.exports = router;
