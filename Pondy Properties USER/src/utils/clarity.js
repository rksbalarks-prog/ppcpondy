/**
 * Microsoft Clarity — public user-site behaviour tracking.
 * ------------------------------------------------------------------
 * Session replays + heatmaps for ppcpondy.com (the visitor-facing app).
 * Sessions are tied to the logged-in phone number so a recording can be
 * lined up with the same person elsewhere in the admin tools.
 *
 * Pondy Properties runs its OWN Clarity projects, separate from RentPondy's —
 * they are different products with different visitors, and Clarity keeps web
 * and mobile projects apart as well:
 *
 *   y177ztikbz  PPC user site   (web)    ← this file
 *   y178mj1880  PPC mobile app  (mobile) ← PondyPropertiesFlutter
 *
 * SETUP
 *   1. Project ID comes from https://clarity.microsoft.com
 *      (Settings → Overview → "Clarity project ID").
 *   2. It lives in Pondy Properties USER/.env:
 *         REACT_APP_CLARITY_ID=y177ztikbz
 *   3. `npm run build` and upload — CRA bakes REACT_APP_* in at build time,
 *      so changing .env alone does nothing to the live site.
 *
 * With no REACT_APP_CLARITY_ID set, every function is a no-op and no script
 * is downloaded. That keeps local development out of production data.
 *
 * PRIVACY
 *   Property pages show owner phone numbers. Set the masking mode in the
 *   Clarity dashboard (Settings → Masking); per-element overrides work in
 *   any mode:
 *      data-clarity-mask="true"   → never recorded
 *      data-clarity-unmask="true" → always recorded
 *   Password/OTP inputs are never recorded by Clarity.
 */

import { getActiveBase } from './cityBase';

const CLARITY_ID = (process.env.REACT_APP_CLARITY_ID || '').trim();

/** True when a project ID is configured — nothing runs without one. */
export const isClarityEnabled = () => Boolean(CLARITY_ID);

/** Safe call into the global clarity() queue; never throws. */
const call = (...args) => {
  try {
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      window.clarity(...args);
    }
  } catch (e) {
    /* analytics must never break the app */
  }
};

let injected = false;

/**
 * Inject the Clarity tag. Idempotent — safe to call more than once.
 * Called from src/index.js so the very first page view is recorded.
 *
 * This is the same bootstrap as Clarity's copy-paste <script> snippet, done
 * from JS instead. Doing it here rather than in public/index.html is what lets
 * the app call identify() with React state — a raw <head> paste cannot reach
 * redux, and having both would record every session twice.
 */
export const initClarity = () => {
  if (!CLARITY_ID || injected || typeof window === 'undefined') return;
  injected = true;

  // Define the queue stub synchronously so calls made before the tag finishes
  // downloading are replayed once it loads.
  window.clarity =
    window.clarity ||
    function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(script);

  // Returning visitor with a live login (page refresh) — tag them right away.
  identifyUser();
};

/** Attach a custom tag you can filter recordings by in the Clarity UI. */
export const setClarityTag = (key, value) => {
  if (!CLARITY_ID || value === undefined || value === null || value === '') return;
  call('set', String(key), String(value));
};

/** Record a named custom event (becomes a filterable Smart event). */
export const clarityEvent = (name) => {
  if (!CLARITY_ID || !name) return;
  call('event', String(name));
};

/**
 * Flag this session as high-priority so Clarity keeps the recording even
 * when it is sampling. Worth using on payment / lead flows.
 */
export const clarityUpgrade = (reason) => {
  if (!CLARITY_ID) return;
  call('upgrade', String(reason || 'important'));
};

/**
 * Friendly screen name for a path, so the Clarity recordings list reads as
 * page names instead of raw URLs. Mirrors the routes in RouterPage.jsx —
 * add a line here when you add a route.
 */
const STATIC_LABELS = {
  '/': 'Home',
  '/mobileviews': 'Home (Mobile)',
  '/pondicherry': 'Home (Pondicherry)',
  '/chennai': 'Home (Chennai)',
  '/login': 'Login',
  '/construction': 'Under Construction',
  '/my': 'My Properties',
  '/new-property': 'New Property',
  '/add-form': 'Add Property',
  '/edit-form': 'Edit Property',
  '/plans': 'Pricing Plans',
  '/add-plan': 'Add Plan',
  '/about': 'About',
  '/about-mobile': 'About (Mobile)',
  '/interest': 'Interest Status',
  '/my-plan': 'My Plan',
  '/matched-buyers': 'Matched Buyers',
};

const DYNAMIC_LABELS = [
  [/^\/detail\/[^/]+$/, 'Property Detail'],
  [/^\/login\/[^/]+$/, 'Login'],
  [/^\/my-profile\/[^/]+$/, 'My Profile'],
];

export const labelForPath = (pathname) => {
  const path = String(pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (STATIC_LABELS[path]) return STATIC_LABELS[path];
  const dynamic = DYNAMIC_LABELS.find(([re]) => re.test(path));
  return dynamic ? dynamic[1] : path;
};

/**
 * Reduce any stored phone to its last 10 digits.
 *
 * The app writes this key in more than one shape — Login stores `+91XXXXXXXXXX`
 * while other screens store bare 10 digits. Without normalising, the SAME
 * person shows up in Clarity under two different user_phone values and no
 * filter catches both.
 */
const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};

/** Logged-in phone number, or '' when browsing as a guest. */
const readPhone = () => {
  try {
    return normalizePhone(localStorage.getItem('phoneNumber') || '');
  } catch (e) {
    return '';
  }
};

const readDevice = () => {
  try {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  } catch (e) {
    return '';
  }
};

/**
 * Tie the current Clarity session to the logged-in visitor.
 *
 * clarity("identify", customId, customSessionId, customPageId, friendlyName)
 * — customId is hashed by Clarity before storage; friendlyName is what shows
 * in the recordings list. Guests are left unidentified but still recorded,
 * and still get the city/page/device tags below.
 *
 * @param {string} [pageLabel]      friendly page name for this view
 * @param {string} [currentPhone]   authoritative phone from redux. Logging in
 *   does NOT change the URL, so localStorage can still hold the PREVIOUS
 *   visitor's number at the moment this runs. When the caller knows the live
 *   value, it wins.
 */
export const identifyUser = (pageLabel, currentPhone) => {
  if (!CLARITY_ID) return;

  const phone =
    currentPhone !== undefined ? normalizePhone(currentPhone) : readPhone();
  if (phone) {
    call('identify', phone, undefined, pageLabel, phone);
    setClarityTag('user_phone', phone);
  }

  setClarityTag('logged_in', phone ? 'yes' : 'guest');
  setClarityTag('city', getActiveBase());
  setClarityTag('device', readDevice());
  setClarityTag('app_version', process.env.REACT_APP_APP_VERSION);
};

const clarityApi = {
  isClarityEnabled,
  initClarity,
  setClarityTag,
  clarityEvent,
  clarityUpgrade,
  identifyUser,
  labelForPath,
};

export default clarityApi;
