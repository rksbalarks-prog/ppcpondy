import { useEffect, useState, useCallback } from "react";
import axios from "axios";

/**
 * Sidebar counts hook
 *
 * Fetches counts for all list-type sidebar items in parallel and caches them
 * in localStorage with a 5-minute TTL so navigation stays instant.
 *
 * Returns an object keyed by sidebar permission name (matches `can(...)` keys
 * in Sidebar.jsx), with `undefined` for endpoints that haven't responded yet
 * and a number once available. Render `count ?? ""` to hide the badge until
 * data arrives.
 */

const CACHE_KEY = "sidebarCounts";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Each entry maps a sidebar permission key → endpoint + extractor.
// The extractor receives the response body and must return a number, or null
// if the count can't be determined. Endpoints are fetched in parallel; one
// failing endpoint never blocks the others.
const COUNT_SOURCES = {
  // ── PPC Property ────────────────────────────────────────────────
  "Approved Property": {
    url: "/fetch-active-users-datas-all",
    extract: (d) => (Array.isArray(d?.users) ? d.users.length : null),
  },
  "PreApproved Property": {
    url: "/properties/pre-approved-all",
    extract: (d) => (Array.isArray(d?.users) ? d.users.length : null),
  },
  "Pending Property": {
    url: "/properties/pending",
    extract: (d) => (Array.isArray(d?.users) ? d.users.length : null),
  },
  "Removed Property": {
    url: "/properties/deleted",
    extract: (d) =>
      Array.isArray(d?.data)
        ? d.data.filter((p) => p.status === "delete").length
        : null,
  },
  "Feature Property": {
    url: "/fetch-all-featured-properties",
    extract: (d) => {
      // Try common shapes — endpoint may return an array directly or wrapped
      if (Array.isArray(d)) return d.length;
      if (Array.isArray(d?.data)) return d.data.length;
      if (Array.isArray(d?.users)) return d.users.length;
      if (Array.isArray(d?.properties)) return d.properties.length;
      return null;
    },
  },
  "Paid Property": {
    url: "/fetch-all-paid-plans",
    extract: (d) => {
      if (Array.isArray(d)) return d.length;
      if (Array.isArray(d?.data)) return d.data.length;
      if (Array.isArray(d?.users)) return d.users.length;
      return null;
    },
  },
  "Free Property": {
    url: "/fetch-all-free-plans",
    extract: (d) => {
      if (Array.isArray(d)) return d.length;
      if (Array.isArray(d?.data)) return d.data.length;
      if (Array.isArray(d?.users)) return d.users.length;
      return null;
    },
  },

  // ── Buyer Assistant ─────────────────────────────────────────────
  "Buyer Active Assistant": {
    url: "/baActive-buyerAssistance-all-plans",
    extract: (d) => {
      if (Array.isArray(d)) return d.length;
      if (Array.isArray(d?.data)) return d.data.length;
      if (Array.isArray(d?.users)) return d.users.length;
      return null;
    },
  },
  "Pending Assistant": {
    url: "/fetch-buyerAssistance-pending",
    extract: (d) => {
      if (Array.isArray(d)) return d.length;
      if (Array.isArray(d?.data)) return d.data.length;
      if (Array.isArray(d?.users)) return d.users.length;
      return null;
    },
  },
  "Expired Assistant": {
    url: "/expired-buyer-plan-assitant",
    extract: (d) => {
      if (Array.isArray(d)) return d.length;
      if (Array.isArray(d?.data)) return d.data.length;
      if (Array.isArray(d?.users)) return d.users.length;
      return null;
    },
  },
  "Removed Buyer Assistant": {
    url: "/fetch-buyerAssistance-removed",
    extract: (d) => {
      if (Array.isArray(d)) return d.length;
      if (Array.isArray(d?.data)) return d.data.length;
      if (Array.isArray(d?.users)) return d.users.length;
      return null;
    },
  },
};

// Read cached counts if still fresh; otherwise return empty object.
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.ts !== "number" ||
      Date.now() - parsed.ts > CACHE_TTL_MS
    )
      return {};
    return parsed.counts || {};
  } catch (_) {
    return {};
  }
};

const writeCache = (counts) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), counts })
    );
  } catch (_) {
    // localStorage quota — silently skip caching
  }
};

const useSidebarCounts = () => {
  // Seed with cached values so badges render immediately on remount.
  const [counts, setCounts] = useState(() => readCache());

  const fetchAll = useCallback(async () => {
    const base = process.env.REACT_APP_API_URL;
    if (!base) return;

    const entries = Object.entries(COUNT_SOURCES);

    // Fire every request in parallel; allSettled so one failure doesn't
    // cancel the rest.
    const results = await Promise.allSettled(
      entries.map(([, { url }]) => axios.get(`${base}${url}`))
    );

    const next = { ...readCache() };
    results.forEach((r, i) => {
      const [key, { extract }] = entries[i];
      if (r.status === "fulfilled") {
        const n = extract(r.value?.data);
        if (typeof n === "number" && Number.isFinite(n)) next[key] = n;
      }
      // On failure, keep the previous cached value (if any) so a stale badge
      // is preferable to no badge.
    });

    setCounts(next);
    writeCache(next);
  }, []);

  useEffect(() => {
    // If cache is fresh we already seeded — skip the network round-trip.
    const cached = readCache();
    if (Object.keys(cached).length > 0) return;
    fetchAll();
  }, [fetchAll]);

  return { counts, refresh: fetchAll };
};

export default useSidebarCounts;
