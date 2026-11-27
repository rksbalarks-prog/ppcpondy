// SmartGrowth HTTP — one helper for every call the panel makes.
//
// The credentials live in sg_settings (saved from Send Message > More Info),
// falling back to SMARTGROWTH_PANEL_TOKEN / SMARTGROWTH_PANEL_API_CODE in
// PPC/.env. Deliberately NOT the older SMARTGROWTH_TOKEN / SMARTGROWTH_API_CODE:
// those hold Pondicherry Matrimony's account, and this panel must only ever
// talk to Rent Pondy's own.
//
// Every call answers { code, body, data, error } and never throws: SmartGrowth
// answers 200 to things that later fail, 4xx with three different message
// keys, and sometimes nothing at all — each caller decides what that means.

const axios = require('axios');
const { SgSettings } = require('./models');

const DEFAULT_BASE_URL = 'https://newapp.smartgrowthai.com';
const USER_AGENT = 'PondyProperty-Admin-WhatsApp/1.0';

// Read once a request is plenty; a short cache keeps the alert poll (every
// admin page, every few seconds) from hitting Mongo for the same row.
const CACHE_MS = 5000;
let cache = null;
let cacheAt = 0;

function envBase() {
  const u = String(process.env.SMARTGROWTH_API_URL || '').trim();
  if (!u) return '';
  try { return new URL(u).origin; } catch (_) { return ''; }
}

async function settingsDoc() {
  let doc = await SgSettings.findOne({ key: 'main' });
  if (!doc) {
    try { doc = await SgSettings.create({ key: 'main' }); }
    catch (_) { doc = await SgSettings.findOne({ key: 'main' }); }   // two first requests at once
  }
  return doc;
}

/** The effective settings: saved values first, .env second, defaults last. */
async function settings(fresh = false) {
  if (!fresh && cache && Date.now() - cacheAt < CACHE_MS) return cache;
  const d = (await settingsDoc()).toObject();
  const envToken = String(process.env.SMARTGROWTH_PANEL_TOKEN || '').trim();
  const envCode = String(process.env.SMARTGROWTH_PANEL_API_CODE || '').trim();
  const out = {
    ...d,
    baseUrl:  (d.baseUrl || envBase() || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    apiToken: d.apiToken || envToken,
    apiCode:  d.apiCode  || envCode,
    tokenFromEnv: !d.apiToken && !!envToken,
    codeFromEnv:  !d.apiCode  && !!envCode,
  };
  cache = out;
  cacheAt = Date.now();
  return out;
}

function invalidate() { cache = null; cacheAt = 0; }

const tokenMask = (t) => (t ? '********' + String(t).slice(-4) : '');

function parse(body) {
  if (body === undefined || body === null || body === '') return null;
  if (typeof body === 'object') return body;
  try { return JSON.parse(body); } catch (_) { return null; }
}

function shape(res, err) {
  if (res) {
    const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data === undefined ? '' : res.data);
    return { code: res.status, body, data: parse(res.data), error: '' };
  }
  return { code: 0, body: '', data: null, error: (err && (err.code || err.message)) || 'no answer' };
}

/** One JSON call. `path` starts with a slash. */
async function request(method, path, body = null, timeoutSec = 60, s = null) {
  s = s || await settings();
  try {
    const res = await axios({
      method,
      url: s.baseUrl + path,
      data: body === null ? undefined : body,
      timeout: timeoutSec * 1000,
      validateStatus: () => true,
      transformResponse: [(x) => x],   // keep the raw text; parse() reads it
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + s.apiToken,
        'User-Agent': USER_AGENT,
        ...(body !== null ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    return shape(res);
  } catch (e) {
    if (e.response) return shape(e.response);
    return shape(null, e);
  }
}

/**
 * The same call carrying a file, as multipart. Content-Type is left for the
 * form to write — it carries the boundary marker, and setting our own blanks
 * the form at the far end.
 */
async function upload(path, buffer, fileName, mime, fields = {}, timeoutSec = 120) {
  const s = await settings();
  try {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
    form.append('file', new Blob([buffer], { type: mime }), fileName);
    const res = await axios.post(s.baseUrl + path, form, {
      timeout: timeoutSec * 1000,
      validateStatus: () => true,
      transformResponse: [(x) => x],
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + s.apiToken, 'User-Agent': USER_AGENT },
    });
    return shape(res);
  } catch (e) {
    if (e.response) return shape(e.response);
    return shape(null, e);
  }
}

/**
 * Several calls of one method, `parallel` at a time, answered in order.
 * SmartGrowth drops part of a burst of new connections (measured on PM's
 * Media Library: 8 at once came back after TCP's retry steps), so this stays
 * modest rather than firing everything together.
 */
async function many(method, paths, parallel = 6, timeoutSec = 60) {
  const s = await settings();
  const out = new Array(paths.length);
  let next = 0;
  const worker = async () => {
    while (next < paths.length) {
      const i = next++;
      out[i] = await request(method, paths[i], method === 'POST' ? {} : null, timeoutSec, s);
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallel, paths.length) }, worker));
  return out;
}

/**
 * SmartGrowth's own words for a refusal, whichever key they used: `message`
 * in most places, `messages` from publish-chatbot-flow, a field-by-field
 * `errors` array on a validation failure.
 */
function message(d, code) {
  if (!d || typeof d !== 'object') return 'SmartGrowth answered HTTP ' + (code || 0) + '.';
  for (const k of ['message', 'messages']) {
    if (typeof d[k] === 'string' && /not created yet/i.test(d[k]))
      return 'This flow has no steps yet, so there is nothing to publish. Open Builder on its row and draw what it should say first.';
  }
  if (Array.isArray(d.errors)) {
    const bits = d.errors.map((e) => (e && typeof e === 'object' ? String(e.message || '').trim() : String(e || '').trim())).filter(Boolean);
    if (bits.length) return bits.join(' ');
  }
  for (const k of ['message', 'messages', 'error']) {
    if (typeof d[k] === 'string' && d[k].trim()) return d[k].trim();
  }
  return 'SmartGrowth answered HTTP ' + (code || 0) + '.';
}

const ok = (r) => r.error === '' && r.code >= 200 && r.code < 300;

/** Why a call failed, said for a person. */
function failText(r) {
  if (r.error) return 'Could not reach SmartGrowth: ' + r.error;
  if (r.code === 401 || r.code === 403)
    return 'SmartGrowth refused the API token (HTTP ' + r.code + '). Check it under Send Message > More Info.';
  return message(r.data, r.code);
}

/** A bare list, or {data:[...]} — read both ways so a change at their end does not blank a page. */
function listOf(d) {
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

module.exports = {
  DEFAULT_BASE_URL,
  settings, settingsDoc, invalidate, tokenMask,
  request, upload, many, message, ok, failText, listOf, parse,
};
