/**
 * City-base scope for the admin app.
 *
 * The admin chooses a scope at login:
 *   'ALL' - see properties / buyers of both cities
 *   'PY'  - Pondicherry only
 *   'CH'  - Chennai only
 *
 * The choice is stored in localStorage and attached as `?base=` to every
 * backend call by a global axios interceptor. The backend treats 'ALL'
 * (and any unrecognised value) as "no city restriction".
 */

import axios from 'axios';

export const ADMIN_BASES = ['ALL', 'PY', 'CH'];
const STORAGE_KEY = 'adminBase';

/** Read the admin's selected base scope. Defaults to 'ALL'. */
export const getAdminBase = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return ADMIN_BASES.includes(v) ? v : 'ALL';
  } catch (e) {
    return 'ALL';
  }
};

/** Persist the admin's base scope ('ALL' | 'PY' | 'CH'). */
export const setAdminBase = (base) => {
  try {
    localStorage.setItem(STORAGE_KEY, ADMIN_BASES.includes(base) ? base : 'ALL');
  } catch (e) {
    /* ignore storage errors */
  }
};

/** Human-readable label for a base scope. */
export const adminBaseLabel = (base) => {
  if (base === 'PY') return 'Pondicherry';
  if (base === 'CH') return 'Chennai';
  return 'All Cities';
};

/**
 * Register a global axios request interceptor that appends `?base=` to every
 * request sent to our backend (REACT_APP_API_URL). Idempotent.
 */
let interceptorRegistered = false;
export const registerAdminBaseInterceptor = () => {
  if (interceptorRegistered) return;
  interceptorRegistered = true;

  const API = process.env.REACT_APP_API_URL || '';

  axios.interceptors.request.use((config) => {
    try {
      const url = config.url || '';
      // Only tag calls to our own backend; leave third-party requests untouched.
      if (API && url.startsWith(API)) {
        config.params = { ...(config.params || {}), base: getAdminBase() };
      }
    } catch (e) {
      /* never let the interceptor break a request */
    }
    return config;
  });
};
