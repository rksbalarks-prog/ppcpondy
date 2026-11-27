// Communication > WhatsApp > Templates — writing a template, not only reading.
//
// A template is the ONLY thing that reaches somebody who has not written to us
// in the last 24 hours, and Meta approves each one first. Endpoints, read off
// SmartGrowth's dashboard bundle:
//
//   GET    /api/languages-list                  [{code, language}]
//   POST   /api/create-template-for-approval    {name, category, language, components[], approveForAll}
//   POST   /api/update-template/<id>            the same body, no approveForAll
//   POST   /api/create-authentication-template  {name} — Meta writes the OTP wording itself
//   DELETE /api/delete-template/<id>/<name>     by name too: every language of it goes
//
// Either way an edit goes to Meta for approval; the old wording keeps sending
// until the new one is approved.

const express = require('express');
const sg = require('../client');
const tpl = require('../templates');

const router = express.Router();
const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

const FALLBACK_LANGUAGES = [
  { code: 'en_US', language: 'English (US)' }, { code: 'en_GB', language: 'English (UK)' },
  { code: 'en', language: 'English' }, { code: 'ta', language: 'Tamil' }, { code: 'hi', language: 'Hindi' },
  { code: 'te', language: 'Telugu' }, { code: 'ml', language: 'Malayalam' }, { code: 'kn', language: 'Kannada' },
  { code: 'mr', language: 'Marathi' }, { code: 'bn', language: 'Bengali' }, { code: 'gu', language: 'Gujarati' },
  { code: 'pa', language: 'Punjabi' },
];

router.get('/sg/template-languages', async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken) return res.json({ status: 'success', rows: FALLBACK_LANGUAGES, source: 'builtin' });
    const r = await sg.request('GET', '/api/languages-list', null, 20);
    const rows = [];
    if (sg.ok(r)) {
      for (const l of sg.listOf(r.data)) {
        const code = l && String(l.code || '').trim();
        if (code) rows.push({ code, language: String(l.language || code) });
      }
    }
    if (!rows.length) return res.json({ status: 'success', rows: FALLBACK_LANGUAGES, source: 'builtin' });
    res.json({ status: 'success', rows, source: 'smartgrowth' });
  } catch (e) {
    res.json({ status: 'success', rows: FALLBACK_LANGUAGES, source: 'builtin' });
  }
});

router.post('/sg/templates/save', async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken) return fail(res, 'Add your API token in Settings first.');
    const b = req.body || {};
    const id = String(b.id || '').trim();

    // Meta's rule, and why the field lower-cases as it is typed.
    const name = String(b.name || '').trim().toLowerCase();
    if (!name) return fail(res, 'Give the template a name.');
    if (name.length > 512) return fail(res, 'The name is limited to 512 characters.');
    if (!/^[a-z0-9_]+$/.test(name)) return fail(res, 'The name may only hold lowercase letters, numbers and underscores — no spaces, dashes or capitals.');
    const category = String(b.category || '').trim().toUpperCase();
    if (!tpl.TEMPLATE_CATEGORIES.includes(category)) return fail(res, 'Pick a category: Marketing or Utility.');
    const language = String(b.language || '').trim();
    if (!/^[A-Za-z]{2,3}(_[A-Za-z0-9]{2,4})?$/.test(language)) return fail(res, 'Pick a language.');

    let components;
    try { components = tpl.buildComponents(b); }
    catch (e) { if (e instanceof tpl.Refusal) return fail(res, e.message); throw e; }

    const payload = { name, category, language, components };
    let r;
    let done;
    if (id) {
      if (!/^[0-9]{5,25}$/.test(id)) return fail(res, 'Which template?');
      r = await sg.request('POST', '/api/update-template/' + id, payload, 90);
      done = 'Your edit has been sent to Meta for approval. The template keeps its old wording until they answer.';
    } else {
      payload.approveForAll = !!b.approveForAll;
      r = await sg.request('POST', '/api/create-template-for-approval', payload, 90);
      done = 'Template sent to Meta for approval. It reads PENDING here until they answer — usually minutes, sometimes a day.';
    }
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) return fail(res, sg.message(r.data, r.code));
    tpl.forget();
    res.json({ status: 'success', message: done, id: r.data && r.data.id ? String(r.data.id) : '' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/templates/auth', async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken) return fail(res, 'Add your API token in Settings first.');
    const name = String((req.body || {}).name || '').trim().toLowerCase();
    if (!name) return fail(res, 'Give the template a name.');
    if (!/^[a-z0-9_]{1,512}$/.test(name)) return fail(res, 'The name may only hold lowercase letters, numbers and underscores.');
    const r = await sg.request('POST', '/api/create-authentication-template', { name }, 90);
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) return fail(res, sg.message(r.data, r.code));
    tpl.forget();
    res.json({ status: 'success', message: 'One-time-password template sent for approval. Meta writes its wording and its Copy code button itself.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/templates/delete', async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken) return fail(res, 'Add your API token in Settings first.');
    const id = String((req.body || {}).id || '').trim();
    const name = String((req.body || {}).name || '').trim();
    if (!/^[0-9]{5,25}$/.test(id) || !/^[A-Za-z0-9_.-]+$/.test(name)) return fail(res, 'Which template?');
    const r = await sg.request('DELETE', '/api/delete-template/' + encodeURIComponent(id) + '/' + encodeURIComponent(name), null, 60);
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) {
      let msg = sg.message(r.data, r.code);
      // Measured on PM's account: the token SmartGrowth issues can read and
      // write templates but not delete them, and Meta's text does not say the
      // problem is OUR credentials rather than this template.
      if (/#100|Need permission/i.test(msg))
        msg = 'Meta will not let this account delete templates — the API token SmartGrowth issued has no permission for it. Nothing was removed. Delete it from SmartGrowth’s own dashboard, or leave it: an unused template costs nothing.';
      return fail(res, msg);
    }
    tpl.forget();
    res.json({ status: 'success', message: (r.data && typeof r.data.message === 'string') ? r.data.message : 'Template deleted.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
