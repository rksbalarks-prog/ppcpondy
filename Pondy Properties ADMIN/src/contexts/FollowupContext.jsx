import React, {
  createContext, useContext, useEffect, useMemo, useState, useCallback, useRef,
} from 'react';
import axios from 'axios';

/*
 * FollowupContext
 * ----------------
 * Loads the four follow-up lists once for the whole dashboard and exposes a
 * set of phone-number Sets (owner / tenant / visitor / ring). Components like
 * <PhoneCell /> use these Sets to colour the number red (no follow-up) or
 * green (follow-up exists) and to drive double-click navigation.
 *
 * - Backed by a module-level cache so the lists survive component remounts
 *   while the user clicks around the dashboard.
 * - `refresh()` is called automatically after a navigation that may have
 *   created a follow-up (the create pages / quick modal call
 *   window.dispatchEvent(new Event('followups-updated')) on success).
 *
 * Buckets map to the Login Report's "Remark Status":
 *   owner   = seller   → /followup-list        (FollowUp, keyed by ppcId)
 *   tenant  = buyer    → /followup-list-buyer   (FollowUpBuyer, keyed by ba_id)
 *   visitor = visitor  → /visitor-followup-list (VisitorFollowUp, phone-only)
 *   ring    = ring     → /ring-followup-list    (RingFollowUp, phone-only)
 */

const API = process.env.REACT_APP_API_URL;

// Normalize phone: strip non-digits and any leading country code.
// We compare the trailing 10 digits so "+91 9876543210", "91-98765 43210"
// and "9876543210" all collapse to the same key.
export const normalizePhone = (raw) => {
  if (raw === null || raw === undefined) return '';
  const digits = String(raw).replace(/\D+/g, '');
  if (!digits) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
};

// Module-level cache so we don't refetch on every page navigation.
let cache = {
  ownerPhones: new Set(),
  tenantPhones: new Set(),
  visitorPhones: new Set(),
  ringPhones: new Set(),
  loaded: false,
  promise: null,
};

const fetchOnce = async () => {
  if (cache.loaded) return cache;
  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    const safeGet = (url) => axios.get(url).then(r => r.data).catch(() => null);
    const [ownerRes, tenantRes, visitorRes, ringRes] = await Promise.all([
      safeGet(`${API}/followup-list`),
      safeGet(`${API}/followup-list-buyer`),
      safeGet(`${API}/visitor-followup-list`),
      safeGet(`${API}/ring-followup-list`),
    ]);

    const collectPhones = (res) => {
      const set = new Set();
      const arr = Array.isArray(res?.data) ? res.data : [];
      arr.forEach((f) => {
        const p = normalizePhone(f?.phoneNumber || f?.phone);
        if (p) set.add(p);
      });
      return set;
    };

    const ownerPhones = collectPhones(ownerRes);
    const tenantPhones = collectPhones(tenantRes);
    const visitorPhones = collectPhones(visitorRes);
    const ringPhones = collectPhones(ringRes);

    cache = { ownerPhones, tenantPhones, visitorPhones, ringPhones, loaded: true, promise: null };
    return cache;
  })();

  return cache.promise;
};

const Ctx = createContext({
  ownerPhones: new Set(),
  tenantPhones: new Set(),
  visitorPhones: new Set(),
  ringPhones: new Set(),
  loaded: false,
  refresh: () => {},
  hasFollowup: () => false,
});

export const FollowupProvider = ({ children }) => {
  const [state, setState] = useState({
    ownerPhones: cache.ownerPhones,
    tenantPhones: cache.tenantPhones,
    visitorPhones: cache.visitorPhones,
    ringPhones: cache.ringPhones,
    loaded: cache.loaded,
  });

  // Track mount so we don't setState after unmount during the initial fetch.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async () => {
    const c = await fetchOnce();
    if (!mountedRef.current) return;
    setState({
      ownerPhones: new Set(c.ownerPhones),
      tenantPhones: new Set(c.tenantPhones),
      visitorPhones: new Set(c.visitorPhones),
      ringPhones: new Set(c.ringPhones),
      loaded: true,
    });
  }, []);

  const refresh = useCallback(async () => {
    cache = { ownerPhones: new Set(), tenantPhones: new Set(), visitorPhones: new Set(), ringPhones: new Set(), loaded: false, promise: null };
    await load();
  }, [load]);

  useEffect(() => {
    if (!state.loaded) load();
    const onUpdate = () => refresh();
    window.addEventListener('followups-updated', onUpdate);
    return () => window.removeEventListener('followups-updated', onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFollowup = useCallback((phone, type) => {
    const p = normalizePhone(phone);
    if (!p) return false;
    if (type === 'owner') return state.ownerPhones.has(p);
    if (type === 'tenant') return state.tenantPhones.has(p);
    if (type === 'visitor') return state.visitorPhones.has(p);
    if (type === 'ring') return state.ringPhones.has(p);
    // fallback (e.g. type 'any'): any bucket counts as "has follow-up"
    return state.ownerPhones.has(p) || state.tenantPhones.has(p) || state.visitorPhones.has(p) || state.ringPhones.has(p);
  }, [state]);

  const value = useMemo(() => ({
    ownerPhones: state.ownerPhones,
    tenantPhones: state.tenantPhones,
    visitorPhones: state.visitorPhones,
    ringPhones: state.ringPhones,
    loaded: state.loaded,
    refresh,
    hasFollowup,
  }), [state, refresh, hasFollowup]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useFollowups = () => useContext(Ctx);
