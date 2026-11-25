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

router.get('/wa-templates', async (req, res) => {
  try {
    const s = await getSettings();
    let acc = { byName: {}, error: '' };
    if (s.apiToken) acc = await accountTemplates(s, req.query.refresh === '1');
    const DAY = 24 * 3600000; const IST = 5.5 * 3600000;
    const sentToday = await WhatsAppLog.countDocuments({
      createdAt: { $gte: new Date(Math.floor((Date.now() + IST) / DAY) * DAY - IST) }, provider: /"via":"template"/, status: 'sent',
    });
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
        on: isOn(s, t.key), defaultOn: !!t.defaultOn,
        status: acc.byName[t.name] ? acc.byName[t.name].status || 'SUBMITTED' : 'NOT SUBMITTED',
        problems: t.category === 'AUTHENTICATION' ? [] : problems(t),
      })),
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

module.exports = router;
