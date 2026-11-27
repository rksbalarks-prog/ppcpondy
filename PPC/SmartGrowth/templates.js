// WhatsApp templates — reading SmartGrowth's library, and writing new ones.
//
// GET /api/get-all-templates is the same feed SmartGrowth's own dashboard
// reads: one bare array with the LIVE Meta status. (The older /api/templates
// is paged and its status goes stale.) The exact JSON shape is not
// documented, so everything here reads defensively and falls back.

const sg = require('./client');

const isList = Array.isArray;

/** Find the array of template objects wherever it sits in the response. */
function extractTemplateList(data) {
  if (!data || typeof data !== 'object') return [];
  if (isList(data)) return data;
  for (const k of ['data', 'templates', 'result', 'results', 'rows', 'items', 'records']) {
    const v = data[k];
    if (v && typeof v === 'object') {
      if (isList(v)) return v;
      for (const k2 of ['templates', 'data', 'rows', 'items']) if (isList(v[k2])) return v[k2];
    }
  }
  return [];
}

/** A stable shape out of one template object, whatever the source keys. */
function normalizeTemplate(t) {
  const pick = (keys, def = '') => {
    for (const k of keys) {
      const v = t[k];
      if (v !== undefined && v !== null && v !== '' && typeof v !== 'object') return v;
    }
    return def;
  };
  const id = pick(['id', 'templateId', 'template_id', '_id', 'elementId']);
  const name = pick(['name', 'templateName', 'template_name', 'elementName', 'title'], '(unnamed)');
  const category = pick(['category', 'type']);
  const status = pick(['status', 'state', 'approvalStatus']);
  let lang = t.language !== undefined ? t.language : pick(['lang', 'languageCode', 'language_code']);
  if (lang && typeof lang === 'object') lang = lang.code || Object.values(lang).join(',');

  const components = isList(t.components) ? t.components : [];
  let bodyText = '';
  for (const c of components) {
    if (c && String(c.type || '').toUpperCase() === 'BODY' && c.text !== undefined) bodyText = String(c.text);
  }
  if (!bodyText) bodyText = String(pick(['body', 'bodyText', 'text', 'message', 'content']));

  // A media header holds no file of its own — the one uploaded at approval is
  // only Meta's example. Every send must name the file, which is what this
  // field tells the page to ask for.
  let headerFormat = '';
  let headerText = '';
  for (const c of components) {
    if (!c || String(c.type || '').toUpperCase() !== 'HEADER') continue;
    headerFormat = String(c.format || 'TEXT').toUpperCase();
    headerText = c.text !== undefined ? String(c.text) : '';
  }

  // Highest {{n}} for numeric placeholders, else the number of distinct named ones.
  let varCount = 0;
  let placeholders = [];
  const m = bodyText.match(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g);
  if (m) {
    placeholders = [...new Set(m.map((x) => x.replace(/[{}\s]/g, '')))];
    const nums = placeholders.filter((p) => /^\d+$/.test(p));
    varCount = nums.length === placeholders.length && nums.length ? Math.max(...nums.map(Number)) : placeholders.length;
  }
  if (!varCount) {
    const vc = pick(['variableCount', 'variables_count', 'parameterCount', 'paramCount']);
    if (vc !== '' && !Number.isNaN(Number(vc))) varCount = Number(vc);
  }

  // Meta's example values for the body's blanks — the best column names a
  // sample sheet can have ("name", "date" read better than var1, var2).
  let examples = [];
  for (const c of components) {
    if (c && String(c.type || '').toUpperCase() === 'BODY' && c.example && isList(c.example.body_text) && isList(c.example.body_text[0]))
      examples = c.example.body_text[0].map(String);
  }
  const headerVars = /\{\{\s*1\s*\}\}/.test(headerText) ? 1 : 0;

  return {
    id: String(id), name: String(name), language: String(lang || ''), category: String(category),
    status: String(status), variableCount: varCount, placeholders, bodyText,
    headerFormat, headerText, headerVars, examples, parts: templateParts(components, bodyText), raw: t,
  };
}

/**
 * The pieces of one template's message, in the order a handset draws them —
 * wording exactly as Meta holds it, {{1}} and all. An authentication template
 * carries no text (Meta writes and keeps the wording), so its fixed copy is
 * restored here or the row reads empty.
 */
function templateParts(components, fallbackBody = '') {
  const out = { header: '', body: '', footer: '', buttons: [], metaFixed: false };
  if (!isList(components)) return out;
  for (const c of components) {
    if (!c || !c.type) continue;
    const type = String(c.type).toUpperCase();
    if (type === 'HEADER') {
      const fmt = String(c.format || 'TEXT').toUpperCase();
      out.header = fmt === 'TEXT' ? String(c.text || '') : '[' + fmt.toLowerCase() + ']';
    } else if (type === 'BODY') {
      if (c.text !== undefined) out.body = String(c.text);
      else if (Object.prototype.hasOwnProperty.call(c, 'add_security_recommendation')) {
        out.body = '{{1}} is your verification code.' + (c.add_security_recommendation ? ' For your security, do not share this code.' : '');
        out.metaFixed = true;
      }
    } else if (type === 'FOOTER') {
      if (c.text !== undefined) out.footer = String(c.text);
      else if (c.code_expiration_minutes !== undefined) {
        out.footer = 'This code expires in ' + Number(c.code_expiration_minutes) + ' minutes.';
        out.metaFixed = true;
      }
    } else if (type === 'BUTTONS' && isList(c.buttons)) {
      for (const b of c.buttons) {
        if (!b) continue;
        const bt = String(b.type || 'QUICK_REPLY').toUpperCase();
        out.buttons.push({
          type: bt,
          text: b.text !== undefined ? String(b.text) : (bt === 'COPY_CODE' ? 'Copy code' : ''),
          url: b.url ? String(b.url) : '',
          phone: b.phone_number ? String(b.phone_number) : '',
          flowId: b.flow_id ? String(b.flow_id) : '',
        });
      }
    }
  }
  if (!out.body) out.body = fallbackBody;
  return out;
}

// ── The library, fetched ───────────────────────────────────────────────────
// Kept for a minute for the bots (a run asks per tick) and the category labels
// every page draws; the Templates and Send pages always ask fresh.
let libCache = null;
let libAt = 0;

async function fetchTemplates(fresh = false) {
  if (!fresh && libCache && Date.now() - libAt < 60000) return { ok: true, templates: libCache };
  const s = await sg.settings();
  if (!s.apiToken) return { ok: false, message: 'Add your API token in Settings first (Send Message > More Info).' };
  const r = await sg.request('GET', '/api/get-all-templates');
  if (r.error) return { ok: false, message: 'Could not reach SmartGrowth: ' + r.error };
  if (r.code < 200 || r.code >= 300) return { ok: false, message: 'SmartGrowth API: ' + sg.message(r.data, r.code), httpCode: r.code };
  const list = extractTemplateList(r.data).filter((t) => t && typeof t === 'object').map(normalizeTemplate);
  libCache = list;
  libAt = Date.now();
  return { ok: true, templates: list };
}

function forget() { libCache = null; libAt = 0; }

/** An APPROVED template by name, or null. */
async function byName(name) {
  const r = await fetchTemplates();
  if (!r.ok) return null;
  const n = String(name || '').trim().toLowerCase();
  return r.templates.find((t) => t.name.toLowerCase() === n && /^APPROVED/i.test(t.status)) || null;
}

/** Lower-case name -> MARKETING / UTILITY / AUTHENTICATION, for the labels beside a name. */
async function categoryMap() {
  const r = await fetchTemplates();
  const map = {};
  if (r.ok) for (const t of r.templates) if (t.category) map[t.name.toLowerCase()] = t.category.toUpperCase();
  return map;
}

// =====================================================================
//  TEMPLATE BUILDER — Meta's rules, checked before the request leaves.
//  Every refusal is one Meta enforces, said in words; a 400 from Meta costs
//  a round trip and explains nothing.
// =====================================================================

const TEMPLATE_CATEGORIES = ['MARKETING', 'UTILITY'];
const TPL_BODY_MAX = 1024;
const TPL_FOOTER_MAX = 60;
const TPL_HEADER_MAX = 60;
const TPL_BUTTON_MAX = 25;

/** The {{n}} numbers in a piece of text, in the order they appear. */
function templateVars(text) {
  const out = [];
  const re = /\{\{\s*([0-9]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(String(text || '')))) out.push(Number(m[1]));
  return out;
}

class Refusal extends Error {}
const refuse = (msg) => { throw new Refusal(msg); };

/** Meta's components array, built out of the form and checked. Throws Refusal. */
function buildComponents(b) {
  const out = [];

  // HEADER — optional, TEXT only. A media header needs an uploaded asset
  // handle in example.header_handle, which this builder does not make.
  const headerText = String(b.headerText || '').trim();
  if (String(b.headerType || '') === 'TEXT' && headerText) {
    if (headerText.length > TPL_HEADER_MAX) refuse('The header is limited to ' + TPL_HEADER_MAX + ' characters.');
    const h = { type: 'HEADER', format: 'TEXT', text: headerText };
    const hv = templateVars(headerText);
    if (hv.length > 1) refuse('A header may hold one variable at most, written {{1}}.');
    if (hv.length) {
      if (hv[0] !== 1) refuse('The header’s variable must be written {{1}}.');
      const hx = String(b.headerExample || '').trim();
      if (!hx) refuse('Give the header’s {{1}} an example value — Meta will not approve a variable it cannot see filled in.');
      h.example = { header_text: [hx] };
    }
    out.push(h);
  }

  // BODY — required.
  const body = String(b.body || '').trim();
  if (!body) refuse('The body cannot be empty.');
  if (body.length > TPL_BODY_MAX) refuse('The body is limited to ' + TPL_BODY_MAX + ' characters; this one is ' + body.length + '.');
  if (/\{\{\s*[^}]+\s*\}\}\s*$/.test(body)) refuse('The body cannot end with a variable. Put a full stop or a few words after it.');
  const vars = templateVars(body);
  vars.forEach((v, i) => {
    if (v !== i + 1) refuse('Variables must run 1, 2, 3 with none skipped. This body jumps to {{' + v + '}}.');
  });
  const bodyComp = { type: 'BODY', text: body };
  if (vars.length) {
    const given = isList(b.bodyExamples) ? b.bodyExamples : [];
    const ex = vars.map((n) => {
      const v = String(given[n - 1] === undefined ? '' : given[n - 1]).trim();
      if (!v) refuse('Give {{' + n + '}} an example value. Meta reads the examples to judge the template and rejects one that has none.');
      return v;
    });
    bodyComp.example = { body_text: [ex] };   // a list OF LISTS — one inner list per message
  }
  out.push(bodyComp);

  // FOOTER — optional.
  const footer = String(b.footer || '').trim();
  if (footer) {
    if (footer.length > TPL_FOOTER_MAX) refuse('The footer is limited to ' + TPL_FOOTER_MAX + ' characters.');
    if (templateVars(footer).length) refuse('A footer cannot hold variables.');
    out.push({ type: 'FOOTER', text: footer });
  }

  const buttons = buildButtons(b.buttons);
  if (buttons.length) out.push({ type: 'BUTTONS', buttons });
  return out;
}

/**
 * The buttons, against Meta's per-template ceilings: 10 in all, 3 quick
 * replies, 2 links, 1 call, 1 form. Kinds MAY be mixed — PM's account has
 * eight approved templates that mix them.
 */
function buildButtons(raw) {
  if (!isList(raw) || !raw.length) return [];
  const out = [];
  const counts = { QUICK_REPLY: 0, URL: 0, PHONE_NUMBER: 0, FLOW: 0 };
  for (const b of raw) {
    if (!b || typeof b !== 'object') continue;
    const kind = String(b.type || '').trim().toUpperCase();
    if (counts[kind] === undefined) refuse('Unknown button type.');
    const text = String(b.text || '').trim();
    if (!text) refuse('Every button needs a label.');
    if (text.length > TPL_BUTTON_MAX) refuse('A button label is limited to ' + TPL_BUTTON_MAX + ' characters; “' + text + '” is longer.');
    if (templateVars(text).length) refuse('A button label cannot hold variables.');
    counts[kind]++;
    if (kind === 'URL') {
      const url = String(b.url || '').trim();
      if (!/^https?:\/\//i.test(url)) refuse('A website button needs a full address starting http:// or https://.');
      if (templateVars(url).length) refuse('This builder writes fixed website buttons. Take the {{1}} out of the address, or add that button on SmartGrowth’s own builder.');
      out.push({ type: 'URL', text, url });
    } else if (kind === 'PHONE_NUMBER') {
      let phone = String(b.phone || '').replace(/[^0-9+]/g, '');
      if (!phone || phone.replace(/\D/g, '').length < 10) refuse('A call button needs the full number with its country code, like +919876543210.');
      if (!phone.startsWith('+')) phone = '+' + phone.replace(/^\++/, '');
      out.push({ type: 'PHONE_NUMBER', text, phone_number: phone });
    } else if (kind === 'FLOW') {
      const flow = String(b.flowId || '').trim();
      if (!/^[0-9]{5,25}$/.test(flow)) refuse('Pick which form the button should open.');
      out.push({ type: 'FLOW', text, flow_id: flow });
    } else {
      out.push({ type: 'QUICK_REPLY', text });
    }
  }
  if (out.length > 10) refuse('A template may carry 10 buttons at most.');
  if (counts.QUICK_REPLY > 3) refuse('Three quick-reply buttons at most.');
  if (counts.URL > 2) refuse('Two website buttons at most.');
  if (counts.PHONE_NUMBER > 1) refuse('One call button at most.');
  if (counts.FLOW > 1) refuse('One form button at most.');
  return out;
}

/** One template's message as a block of plain text, for the CSV export. */
function messageText(parts) {
  const lines = [];
  if (parts.header) lines.push('Header: ' + parts.header);
  if (parts.body) lines.push(parts.body);
  if (parts.footer) lines.push('Footer: ' + parts.footer);
  for (const b of parts.buttons) {
    const extra = b.url ? ' -> ' + b.url : (b.phone ? ' -> ' + b.phone : '');
    lines.push('Button: ' + (b.text || b.type) + extra);
  }
  return lines.join('\n');
}

module.exports = {
  extractTemplateList, normalizeTemplate, templateParts, templateVars,
  fetchTemplates, forget, byName, categoryMap,
  buildComponents, buildButtons, messageText, Refusal,
  TEMPLATE_CATEGORIES, TPL_BODY_MAX, TPL_FOOTER_MAX, TPL_HEADER_MAX, TPL_BUTTON_MAX,
};
