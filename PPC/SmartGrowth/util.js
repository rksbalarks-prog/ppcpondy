// Numbers, clocks and small shared rules for the SmartGrowth panel.

const DEFAULT_COUNTRY_CODE = '91';

/**
 * A pasted block of numbers, split into candidates. NOT on whitespace:
 * "+91 93615 46021" split on spaces yields "+91", which then went out as the
 * number 9191. Newline, comma and semicolon separate numbers; a token longer
 * than fifteen digits is several numbers on one line, split on spaces after all.
 */
function splitNumbers(raw) {
  const out = [];
  for (let chunk of String(raw || '').split(/[\r\n,;]+/)) {
    chunk = chunk.trim();
    if (!chunk) continue;
    if (chunk.replace(/\D+/g, '').length > 15) {
      for (const piece of chunk.split(/\s+/)) if (piece.trim()) out.push(piece);
      continue;
    }
    out.push(chunk);
  }
  return out;
}

/**
 * A number in the shape WhatsApp routes on, or "". Digits only, leading
 * zeros off (a trunk prefix), and the country code in front of anything ten
 * digits or shorter. Anything longer already carries its code and is left
 * alone — "helpfully" prefixing 917094422941 would break the sends that work.
 */
function normalisePhone(raw, countryCode) {
  let d = String(raw === undefined || raw === null ? '' : raw).replace(/\D+/g, '');
  d = d.replace(/^0+/, '');
  if (!d) return '';
  const cc = String(countryCode || '').replace(/\D+/g, '') || DEFAULT_COUNTRY_CODE;
  if (d.length <= 10) d = cc + d;
  return d;
}

/** Digits only — "+91 82204 37673" and "918220437673" are one number. */
const digits = (raw) => String(raw === undefined || raw === null ? '' : raw).replace(/\D+/g, '');

/** The last ten digits — how a number is stored for blocks and look-ups. */
function key10(raw) {
  const d = digits(raw);
  return d.length > 10 ? d.slice(-10) : d;
}

/** One number written the same way every time for the send log: 91 + ten digits. */
function key91(raw) {
  const d = digits(raw);
  if (!d) return '';
  if (d.length === 10) return '91' + d;
  if (d.length > 12 && d.startsWith('91')) return d.slice(-12);
  return d;
}

/** A ten-digit Indian mobile we would actually send to (6-9 first). */
const isMobile10 = (d) => /^[6-9]\d{9}$/.test(String(d || ''));

// ── India time ─────────────────────────────────────────────────────────────
// The office lives in Asia/Kolkata; the VPS clock does not, and "today" for a
// daily cap must be the office's today.
const IST_OFFSET_MS = 330 * 60 * 1000;

function istParts(date = new Date()) {
  const t = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(),
    h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds(), dow: t.getUTCDay(),
  };
}

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' in India. */
function istToday(date = new Date()) {
  const p = istParts(date);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Midnight this morning in India, as a Date. */
function istDayStart(date = new Date()) {
  const p = istParts(date);
  return new Date(Date.UTC(p.y, p.m - 1, p.d) - IST_OFFSET_MS);
}

/** 'YYYY-MM-DD' (India) -> the Date of its midnight / last millisecond. */
function istDateStart(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}
function istDateEnd(ymd) {
  return new Date(istDateStart(ymd).getTime() + 86400000 - 1);
}

/** 'YYYY-MM-DD HH:MM:SS' in India, for notes and exports. */
function istStamp(date = new Date()) {
  if (!date) return '';
  const p = istParts(new Date(date));
  return `${p.y}-${pad(p.m)}-${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`;
}

/** Days between two 'YYYY-MM-DD' strings (b - a). */
function dayDiff(a, b) {
  return Math.round((istDateStart(b) - istDateStart(a)) / 86400000);
}

/** Is it inside these sending hours (India)? 0..24 means always. */
function inHours(from, to) {
  from = Number(from) || 0;
  to = to === undefined || to === null ? 24 : Number(to);
  if (from <= 0 && to >= 24) return true;
  const h = istParts().h;
  return h >= from && h < to;
}

/** "9am-8pm". */
function hoursLabel(from, to) {
  const f = (h) => {
    h = Number(h) || 0;
    if (h === 0 || h === 24) return '12am';
    if (h === 12) return '12pm';
    return h < 12 ? h + 'am' : (h - 12) + 'pm';
  };
  return f(from) + '-' + f(to === undefined ? 24 : to);
}

/** 'YYYYMMDD-HHMMSS' in India. */
function istCompact(date = new Date()) {
  const p = istParts(date);
  return `${p.y}${pad(p.m)}${pad(p.d)}-${pad(p.h)}${pad(p.mi)}${pad(p.s)}`;
}

// ── Who is asking ──────────────────────────────────────────────────────────
// The admin API has no session; the screens send the signed-in name along so
// every log can say who pressed the button.
function adminName(req) {
  const n = (req.get && (req.get('x-admin-name') || '')) || (req.body && req.body.adminName) || '';
  return String(n).trim().slice(0, 100);
}

/** The login half of an automatic campaign name, safe to put in a URL. */
function campaignWho(req) {
  return adminName(req).replace(/[^A-Za-z0-9]+/g, '') || 'admin';
}

/** Name it for me: who sent it, and when. */
function autoCampaignName(req) {
  return campaignWho(req) + '-' + istCompact();
}

/** A link Meta can actually fetch: absolute, and http(s). */
function isPublicUrl(url) {
  url = String(url || '').trim();
  if (!/^https?:\/\//i.test(url)) return false;
  try { new URL(url); return true; } catch (_) { return false; }
}

function niceBytes(n) {
  n = Number(n) || 0;
  if (n >= 1048576) return (Math.round((n / 1048576) * 10) / 10) + ' MB';
  if (n >= 1024) return Math.round(n / 1024) + ' KB';
  return n + ' bytes';
}

const clampInt = (v, min, max, dflt) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
};

const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** "+91XXXXXXXXXX" for exports. */
function e164(raw) {
  const d = digits(raw);
  if (!d) return String(raw || '');
  return '+' + (d.length === 10 ? '91' + d : d);
}

/** CSV with a BOM, so Excel reads Tamil names. */
function toCsv(head, rows) {
  const cell = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

module.exports = {
  DEFAULT_COUNTRY_CODE,
  splitNumbers, normalisePhone, digits, key10, key91, isMobile10,
  istParts, istToday, istDayStart, istDateStart, istDateEnd, istStamp, istCompact, dayDiff,
  inHours, hoursLabel,
  adminName, campaignWho, autoCampaignName,
  isPublicUrl, niceBytes, clampInt, escRe, sleep, e164, toCsv,
};
