// SmartGrowth panel — one axios instance for every /sg/* call.
//
// Its own instance on purpose: the global interceptor in utils/adminBase.js
// adds ?base=PY/CH to every request, and WhatsApp is account-wide — a chat or
// a campaign is not "in" a city. Every call also says who is signed in, so the
// backend's logs can name who pressed the button (the admin API has no session).

import axios from 'axios';

// REACT_APP_SG_API_URL lets a dev build point just these screens at a local
// backend (e.g. http://localhost:5005/PPC) while every other admin page keeps
// using REACT_APP_API_URL. Unset in production: both are the same server.
const API_ROOT = process.env.REACT_APP_SG_API_URL || process.env.REACT_APP_API_URL || '';
export const SG_BASE = `${API_ROOT.replace(/\/+$/, '')}/sg`;

const http = axios.create({ baseURL: SG_BASE, timeout: 180000 });

http.interceptors.request.use((cfg) => {
  try {
    const n = localStorage.getItem('adminName') || '';
    if (n) cfg.headers['x-admin-name'] = n;
  } catch (_) { /* storage blocked — the log just says nobody */ }
  return cfg;
});

/** The backend answers { status: 'success' | 'error', message, ... }. An error becomes a throw. */
function unwrap(res) {
  const d = res.data;
  if (d && d.status === 'error') {
    const e = new Error(d.message || 'Something went wrong.');
    e.data = d;
    throw e;
  }
  return d;
}

function rethrow(err) {
  if (err.data) throw err;
  const d = err.response && err.response.data;
  const e = new Error((d && (d.message || d.error)) || err.message || 'Request failed.');
  e.data = d;
  throw e;
}

export const sgGet = (path, params) => http.get(path, { params }).then(unwrap, rethrow);
export const sgPost = (path, body) => http.post(path, body).then(unwrap, rethrow);
export const sgUpload = (path, formData, onProgress) => http.post(path, formData, {
  onUploadProgress: onProgress ? (e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0) : undefined,
}).then(unwrap, rethrow);

/** A URL for a download / print page (opened in a new tab or an <a href>). */
export const sgUrl = (path, params) => {
  const q = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString() : '';
  return SG_BASE + path + (q ? '?' + q : '');
};
