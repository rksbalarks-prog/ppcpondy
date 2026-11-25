// Sends a Pondy Properties template through SmartGrowth - the same calls the PM admin
// uses (AppHealth.php / OwnerLeadAlert.php):
//   GET  /api/get-all-templates                 -> the template's id + status (APPROVED only)
//   POST /send/campaign {templateId, apiCode, campaignName, phoneNumbers:[91..], bodyParams:[..]}
//
// tryTemplate() is what POST /send-message calls first: if the message maps to a
// template that is switched on and approved, it goes as that template; on ANY doubt
// or failure it returns null and the caller sends by OneMsg exactly as before.

const { sg, rows } = require('../WhatsAppBot/smartgrowth');
const { getSettings } = require('../WhatsAppBot/models');
const WhatsAppLog = require('../WhatsAppActivity/WhatsAppLogModel');
const { BY_KEY } = require('./templates');
const { toTemplate } = require('./mapper');

const LIST_TTL_MS = 10 * 60 * 1000;
let cache = { at: 0, byName: {}, error: '' };

/** name -> {id, status, category, language} for every template on the account (cached 10 min). */
async function accountTemplates(s, force = false) {
  if (!force && Date.now() - cache.at < LIST_TTL_MS) return cache;
  const r = await sg(s, 'GET', '/api/get-all-templates', undefined, 30000);
  if (!r.ok) {
    cache = { ...cache, at: Date.now() - LIST_TTL_MS + 60000, error: r.error }; // retry in a minute
    return cache;
  }
  let list = rows(r.data);
  if (!list.length && r.data && typeof r.data === 'object') {
    for (const k of ['templates', 'result', 'results']) if (Array.isArray(r.data[k])) { list = r.data[k]; break; }
  }
  const byName = {};
  for (const t of list) {
    if (!t || !t.name) continue;
    byName[t.name] = { id: String(t.id || t._id || ''), status: String(t.status || '').toUpperCase(), category: t.category || '', language: t.language || '' };
  }
  cache = { at: Date.now(), byName, error: '' };
  return cache;
}

const isOn = (s, key) => {
  const t = BY_KEY[key];
  const v = s.templateOn && Object.prototype.hasOwnProperty.call(s.templateOn, key) ? s.templateOn[key] : undefined;
  return v === undefined ? !!(t && t.defaultOn) : !!v;
};

const DAY = 24 * 3600000;
const IST = 5.5 * 3600000;
/** Templates sent since midnight in India (the log row's provider field starts {"via":"template"...). */
async function sentToday() {
  const since = new Date(Math.floor((Date.now() + IST) / DAY) * DAY - IST);
  return WhatsAppLog.countDocuments({ createdAt: { $gte: since }, provider: /"via":"template"/, status: 'sent' });
}

/**
 * Send one template now. -> { ok, error, data }
 * `force` skips the switches (the admin's Test send); the approval check always applies.
 */
async function sendTemplate(key, to, params, { force = false, campaign = '' } = {}) {
  const s = await getSettings();
  const t = BY_KEY[key];
  if (!t) return { ok: false, error: 'unknown template' };
  if (!s.apiToken || !s.apiCode) return { ok: false, error: 'SmartGrowth token / API code not saved' };
  if (!force && (!s.templatesEnabled || !isOn(s, key))) return { ok: false, error: 'switched off' };
  const p10 = String(to || '').replace(/\D/g, '').slice(-10);
  if (p10.length !== 10) return { ok: false, error: 'bad phone number' };
  if (!Array.isArray(params) || params.length !== t.example.length) return { ok: false, error: `needs ${t.example.length} value(s)` };
  if (!force) {
    const limit = Number(s.templateDailyLimit) || 0;
    if (limit > 0 && (await sentToday()) >= limit) return { ok: false, error: `daily limit of ${limit} templates reached` };
  }
  const acc = await accountTemplates(s);
  const found = acc.byName[t.name];
  if (!found || !found.id) return { ok: false, error: acc.error ? `template list: ${acc.error}` : `${t.name} is not on the SmartGrowth account` };
  if (found.status !== 'APPROVED') return { ok: false, error: `${t.name} is ${found.status || 'not approved'}` };

  const body = {
    templateId: found.id,
    apiCode: s.apiCode,
    campaignName: campaign || `Pondy Properties - ${t.label}`,
    phoneNumbers: [`91${p10}`],
    bodyParams: params.map((v) => String(v).replace(/\s+/g, ' ').trim().slice(0, 200)),
  };
  const r = await sg(s, 'POST', '/send/campaign', body, 30000);
  const d = r.data;
  const refused = d && typeof d === 'object' && (d.success === false || d.status === false || /fail|error/i.test(String(d.status || '')));
  if (!r.ok || refused) return { ok: false, error: r.error || (d && d.message) || 'refused', data: d };
  return { ok: true, error: '', data: d };
}

/**
 * For POST /send-message: send this free-text alert as its template, if one applies.
 * -> null (not handled - send by OneMsg) or { key, ok:true, data, text }.
 */
async function tryTemplate(to, message) {
  let s;
  try { s = await getSettings(); } catch (_) { return null; }
  if (!s.templatesEnabled || !s.apiToken || !s.apiCode) return null;
  // First successful login of this number -> the Welcome template instead.
  let firstLogin = false;
  if (/login successful/i.test(message)) {
    try {
      const p10 = String(to || '').replace(/\D/g, '').slice(-10);
      firstLogin = (await WhatsAppLog.countDocuments({ to: p10, category: 'login' })) === 0;
    } catch (_) { firstLogin = false; }
  }
  const m = toTemplate(message, to, { firstLogin });
  if (!m) return null;
  if (!isOn(s, m.key)) return null;
  let res;
  try { res = await sendTemplate(m.key, to, m.params); } catch (e) { res = { ok: false, error: e.message }; }
  if (!res.ok) {
    console.log('[WhatsAppTemplates]', m.key, 'not sent as a template -', res.error, '- OneMsg instead');
    return null;
  }
  const t = BY_KEY[m.key];
  const text = t.body.replace(/\{\{(\d+)\}\}/g, (x, n) => m.params[n - 1]);
  return { key: m.key, ok: true, data: { via: 'template', template: t.name, provider: 'smartgrowth', response: res.data }, text };
}

/** Forget the cached template list (after switching SmartGrowth accounts). */
function clearCache() { cache = { at: 0, byName: {}, error: '' }; }

module.exports = { sendTemplate, tryTemplate, accountTemplates, isOn, clearCache };
