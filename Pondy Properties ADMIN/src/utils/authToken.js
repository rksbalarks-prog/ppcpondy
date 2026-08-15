/**
 * Admin auth token handling for the admin app.
 *
 * The backend issues a signed token at login (POST /verify-otp-login). We:
 *   1. store it in localStorage,
 *   2. attach it as `Authorization: Bearer <token>` on every backend call,
 *   3. clear it + bounce to the login page when the backend reports the token
 *      is invalid/expired (401 with { code: 'TOKEN_INVALID' }).
 *
 * This is what makes the admin session real: without a valid token the
 * dashboard routes (guarded in App.js) are not reachable, and the protected
 * admin-account endpoints reject the request server-side.
 */

import axios from 'axios';

const TOKEN_KEY = 'adminToken';
// BrowserRouter basename is '/process', so the login page lives here.
const LOGIN_PATH = '/process/admin';

export const setAdminToken = (t) => {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch (_) {
    /* ignore storage errors */
  }
};

export const getAdminToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (_) {
    return null;
  }
};

export const clearAdminToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (_) {
    /* ignore storage errors */
  }
};

/** Decode the token payload. No signature check — that is the server's job. */
const decodePayload = (token) => {
  try {
    const body = token.split('.')[0];
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
};

/** True if a token exists and has not expired (client-side check for UX). */
export const isAdminAuthed = () => {
  const token = getAdminToken();
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload) return false;
  // No `exp` → never expires (valid until manual logout). Otherwise check it.
  if (typeof payload.exp === 'number') return Date.now() < payload.exp;
  return true;
};

/** Clear the persisted identity and send the user back to the login page. */
const forceLogout = () => {
  clearAdminToken();
  try {
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('rolePermissions');
  } catch (_) {
    /* ignore */
  }
  // Interceptors run outside the Router, so we use window.location. Guard
  // against redirect loops when we are already on the login page.
  if (!window.location.pathname.endsWith('/admin')) {
    window.location.assign(LOGIN_PATH);
  }
};

let registered = false;

/**
 * Register the request + response interceptors. Idempotent. Call once at app
 * startup (index.js), alongside registerAdminBaseInterceptor.
 */
export const registerAdminAuthInterceptors = () => {
  if (registered) return;
  registered = true;

  const API = process.env.REACT_APP_API_URL || '';

  // Attach the bearer token to every call to our own backend.
  axios.interceptors.request.use((config) => {
    try {
      const url = config.url || '';
      const token = getAdminToken();
      if (token && (!API || url.startsWith(API))) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      /* never let the interceptor break a request */
    }
    return config;
  });

  // If the backend says the token is invalid/expired, log out cleanly. We only
  // react to our distinctive code so other 401s (e.g. wrong OTP at login) do
  // NOT trigger a logout/redirect.
  axios.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      if (status === 401 && code === 'TOKEN_INVALID') {
        forceLogout();
      }
      return Promise.reject(error);
    }
  );
};
