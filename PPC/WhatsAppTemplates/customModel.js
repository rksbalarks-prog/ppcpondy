// Admin-authored WhatsApp templates (the "+ New template" builder on the
// WhatsApp Bot page) - the PM-admin style free-form templates, as opposed to the
// fixed pp_* action alerts in templates.js.
//
// A row here is ONE template the office wrote and sent to SmartGrowth -> Meta for
// approval. Its live Meta status is NOT stored; it is read fresh from the account
// (get-all-templates) by name, exactly like the fixed templates, so this row never
// goes stale. We keep only what the office typed + who/when.

const mongoose = require('mongoose');

const WaCustomTemplateSchema = new mongoose.Schema({
  // Meta template name: lowercase, digits and _ only, unique on the account.
  // Cannot change after the first submit (Meta locks name + language).
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, enum: ['UTILITY', 'MARKETING', 'AUTHENTICATION'], default: 'UTILITY' },
  language: { type: String, default: 'en' },     // en, en_US, ta, ...
  body: { type: String, default: '' },           // with {{1}}, {{2}} ... in order
  example: { type: Array, default: [] },         // one sample value per variable
  footer: { type: String, default: '' },         // <= 60 chars, optional
  buttonText: { type: String, default: '' },     // optional URL button
  buttonUrl: { type: String, default: '' },
  label: { type: String, default: '' },          // a friendly name for the office
  createdBy: { type: String, default: '' },      // admin name
  submittedAt: { type: Date, default: null },    // last time it was sent to Meta
}, { timestamps: true, collection: 'wa_custom_templates' });

const WaCustomTemplate = mongoose.models.WaCustomTemplate
  || mongoose.model('WaCustomTemplate', WaCustomTemplateSchema);

// ── validation: the same rules Meta applies, caught here instead of as a 400 ──
function validateCustom(t) {
  const out = [];
  const name = String(t.name || '').trim();
  if (!/^[a-z0-9_]{1,512}$/.test(name)) out.push('name: lowercase letters, digits and _ only');
  if (!['UTILITY', 'MARKETING', 'AUTHENTICATION'].includes(t.category)) out.push('category must be UTILITY, MARKETING or AUTHENTICATION');
  if (!String(t.language || '').trim()) out.push('pick a language');

  if (t.category !== 'AUTHENTICATION') {
    const body = String(t.body || '');
    const example = Array.isArray(t.example) ? t.example : [];
    if (!body.trim()) out.push('the message body is empty');
    const vars = (body.match(/\{\{(\d+)\}\}/g) || []).map((v) => Number(v.replace(/\D/g, '')));
    vars.forEach((n, i) => { if (n !== i + 1) out.push('variables must be {{1}}, {{2}} ... in order with none skipped'); });
    if (vars.length !== example.length) out.push(`${vars.length} variable(s) in the body but ${example.length} example value(s)`);
    if (example.some((v) => !String(v == null ? '' : v).trim())) out.push('every variable needs an example value');
    if (/^\s*\{\{/.test(body) || /\{\{\d+\}\}\W*$/.test(body)) out.push('a variable cannot be the very start or end of the body');
    if (body.length > 1024) out.push('body is over 1024 characters');
    if (t.footer && String(t.footer).length > 60) out.push('footer is over 60 characters');
    if (t.buttonUrl && !/^https?:\/\//i.test(t.buttonUrl)) out.push('button URL must start with http:// or https://');
    if (t.buttonUrl && !String(t.buttonText || '').trim()) out.push('give the button some text');
  }
  return [...new Set(out)];
}

// Meta's component array for /api/create-template-for-approval, built from the
// office's fields. Mirrors templates.js components() but nothing is hardcoded.
function customComponents(t) {
  const comps = [{ type: 'BODY', text: t.body, example: { body_text: [t.example] } }];
  if (t.footer && String(t.footer).trim()) comps.push({ type: 'FOOTER', text: String(t.footer).trim() });
  if (t.buttonUrl && String(t.buttonUrl).trim()) {
    comps.push({ type: 'BUTTONS', buttons: [{ type: 'URL', text: String(t.buttonText).trim(), url: String(t.buttonUrl).trim() }] });
  }
  return comps;
}

module.exports = { WaCustomTemplate, validateCustom, customComponents };
