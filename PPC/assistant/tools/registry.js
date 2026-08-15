// Tool registry. Each tool declares an OpenAI function schema plus either:
//   - execute(phone, args)  for READ tools (run immediately), or
//   - proposal(phone, args) for WRITE tools (return an action proposal; the
//     frontend Confirm chip POSTs to the canonical endpoint — the model never
//     writes unilaterally).
//
// `phone` is always the verified session phone injected by the orchestrator.
// Any phoneNumber the model puts in args is ignored.
//
// Domain: Pondy Properties is a SALE marketplace. Listings are keyed by `ppcId`
// and priced with `price` (plain rupees), not `rentId`/`rentalAmount`.

const { apiGet, apiGetCached } = require('./httpClient');
const config = require('../config');
const { safeDetail } = require('../sanitize');
const { getSettingsSync } = require('../settings');

// ── helpers ──────────────────────────────────────────────────────────────────
const norm = (v) => String(v ?? '').trim().toLowerCase();
const PONDY = ['pondy', 'pondicherry', 'puducherry', 'pudhucherry', 'pondi'];

// Digits-only phone, which is what the app's routes use in a URL segment.
const digitsOf = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

function cityMatches(prop, wanted) {
  const w = norm(wanted);
  if (!w) return true;
  const hay = [prop.city, prop.area, prop.district].map(norm).join(' ');
  if (PONDY.includes(w) || w.includes('pond') || w.includes('pudu')) {
    return PONDY.some((s) => hay.includes(s));
  }
  return hay.includes(w);
}

// `price` is a Number in the schema, but /fetch-active-users-on-demand rewrites it
// to the literal string "On Demand" when the listing is priced on request. Such a
// listing can never satisfy a min/max filter, so return null and let the caller
// decide (it excludes them only when a price filter was actually given).
function priceOf(p) {
  const n = Number(p.price);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Live `bedrooms` values are inconsistent — most rows are plain "2"/"3", but a
// meaningful slice was entered as "3 BHK". Compare on the leading digits so both
// forms match; anything non-numeric (e.g. "No" on a plot) falls back to the text.
function bedroomKey(v) {
  const s = norm(v);
  const m = s.match(/\d+/);
  return m ? m[0] : s;
}

function matchProperty(p, f) {
  if (!cityMatches(p, f.city)) return false;
  if (f.area && !norm(p.area).includes(norm(f.area)) && !norm(p.city).includes(norm(f.area))) return false;
  if (f.bedrooms && bedroomKey(p.bedrooms) !== bedroomKey(f.bedrooms)) return false;
  if (f.propertyType && !norm(p.propertyType).includes(norm(f.propertyType))) return false;
  if (f.propertyMode && !norm(p.propertyMode).includes(norm(f.propertyMode))) return false;
  if (f.postedBy && !norm(p.postedBy).includes(norm(f.postedBy))) return false;
  const price = priceOf(p);
  if (f.minPrice != null && (price == null || price < f.minPrice)) return false;
  if (f.maxPrice != null && (price == null || price > f.maxPrice)) return false;
  return true;
}

function leanCard(p) {
  return {
    ppcId: p.ppcId,
    propertyType: p.propertyType,
    propertyMode: p.propertyMode,
    bedrooms: p.bedrooms,
    price: p.onDemand || p.price === 'On Demand' ? 'On Demand' : p.price,
    area: p.area,
    city: p.city,
    furnished: p.furnished,
    totalArea: p.totalArea,
    areaUnit: p.areaUnit,
    postedBy: p.postedBy,
  };
}

// Owner contact is paywalled (points), so the AI must never read what a user would
// have to spend points to see. `safeDetail` is an ALLOWLIST (only known-safe display
// fields survive) plus a recursive PII scrub — see sanitize.js.
const detailCard = safeDetail;

function pickList(data) {
  return data?.users || data?.data || data?.properties || (Array.isArray(data) ? data : []);
}

// ── READ tools ───────────────────────────────────────────────────────────────
const readTools = {
  search_properties: {
    kind: 'read',
    description:
      'Search live properties FOR SALE by filters. Returns lean cards. Use this whenever the user asks to find/see properties. Prices are plain rupees (1 lakh = 100000, 1 crore = 10000000).',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City e.g. "Pondicherry" or "Chennai". Pondy synonyms are handled.' },
        area: { type: 'string', description: 'Locality/area e.g. "White Town", "Lawspet".' },
        minPrice: { type: 'number', description: 'Minimum sale price in INR (plain rupees, not lakhs).' },
        maxPrice: { type: 'number', description: 'Maximum sale price in INR (plain rupees, not lakhs). "50 lakhs" = 5000000.' },
        bedrooms: { type: 'string', description: 'Number of bedrooms as a string: "1".."6".' },
        propertyType: { type: 'string', description: 'e.g. Individual House, Individual Villa, Apartment, Flat, Plot, Land, Agricultural Land, Commercial Building, Commercial Shop.' },
        propertyMode: { type: 'string', description: 'Sale, Rent or Lease. This app is mainly Sale.' },
        postedBy: { type: 'string', description: 'Owner, Agent or Builder.' },
        limit: { type: 'number', description: 'Max results to return (default 8, max 15).' },
      },
    },
    async execute(phone, args = {}) {
      const limit = Math.min(Math.max(1, Number(args.limit) || 8), 15);

      // Preferred path once deployed in-process with the DB: the lean indexed
      // endpoint does the filtering/paging in Mongo (fast). Off by default.
      if (config.useLeanSearch) {
        const data = await apiGet('/assistant/search-properties', {
          city: args.city, area: args.area, bedrooms: args.bedrooms,
          propertyType: args.propertyType, propertyMode: args.propertyMode,
          postedBy: args.postedBy, minPrice: args.minPrice, maxPrice: args.maxPrice,
          limit,
        });
        return {
          count: data.count, showing: data.showing, results: data.results || [],
          filtersApplied: args,
        };
      }

      // Default path: fetch the on-demand active list once (cached) and filter in
      // this Node layer.
      const data = await apiGetCached('/fetch-active-users-on-demand', {});
      const all = pickList(data);
      const filters = {
        city: args.city, area: args.area, bedrooms: args.bedrooms,
        propertyType: args.propertyType, propertyMode: args.propertyMode,
        postedBy: args.postedBy,
        minPrice: args.minPrice != null ? Number(args.minPrice) : null,
        maxPrice: args.maxPrice != null ? Number(args.maxPrice) : null,
      };
      const matched = all.filter((p) => matchProperty(p, filters));
      return {
        count: matched.length,
        showing: Math.min(limit, matched.length),
        totalActive: all.length,
        filtersApplied: filters,
        results: matched.slice(0, limit).map(leanCard),
      };
    },
  },

  get_property_details: {
    kind: 'read',
    description: 'Get full details for one property by its ppcId (owner contact is excluded — that requires points).',
    parameters: {
      type: 'object',
      properties: { ppcId: { type: 'number', description: 'The property ppcId.' } },
      required: ['ppcId'],
    },
    async execute(phone, args = {}) {
      const data = await apiGet(`/property/${encodeURIComponent(args.ppcId)}`);
      const prop = data?.property || data?.data || data;
      return { property: detailCard(prop) };
    },
  },

  list_areas: {
    kind: 'read',
    description: 'List known area/locality names, optionally filtered by a search prefix.',
    parameters: {
      type: 'object',
      properties: { search: { type: 'string', description: 'Substring to filter areas.' } },
    },
    async execute(phone, args = {}) {
      const data = await apiGet('/areas', { search: args.search || '' });
      return { areas: (data?.data || data?.areas || []).slice(0, 60) };
    },
  },

  list_cities: {
    kind: 'read',
    description: 'List known city names, optionally filtered by a search prefix.',
    parameters: {
      type: 'object',
      properties: { search: { type: 'string', description: 'Substring to filter cities.' } },
    },
    async execute(phone, args = {}) {
      const data = await apiGet('/cities', { search: args.search || '' });
      return { cities: (data?.data || data?.cities || []).slice(0, 60) };
    },
  },

  get_my_points_balance: {
    kind: 'read',
    description:
      "Get the current user's points balance. ALWAYS call this before helping with owner " +
      "contact: it returns `balance`, the `revealCost` for one owner contact, and " +
      "`hasEnoughPoints` (true if they can afford it now).",
    parameters: { type: 'object', properties: {} },
    async execute(phone) {
      const data = await apiGet(`/points-balance/${encodeURIComponent(phone)}`);
      const balance = Number(data?.balance) || 0;
      const revealCost = getSettingsSync().contactRevealPoints;
      return { ...data, balance, revealCost, hasEnoughPoints: balance >= revealCost };
    },
  },

  get_my_favourites: {
    kind: 'read',
    description: "Get the properties the current user has saved as favourites.",
    parameters: { type: 'object', properties: {} },
    async execute(phone) {
      // /get-favorite-owner 404s (rather than returning an empty list) when the
      // user has saved nothing, so treat that as "no favourites" instead of an error.
      let data;
      try {
        data = await apiGet('/get-favorite-owner', { phoneNumber: phone });
      } catch (e) {
        if (e?.response?.status === 404) return { count: 0, favourites: [] };
        throw e;
      }
      const list = pickList(data);
      return { count: Array.isArray(list) ? list.length : 0, favourites: (list || []).slice(0, 20).map(leanCard) };
    },
  },
};

// ── WRITE tools (proposal only — never executed by the model) ─────────────────
const writeTools = {
  send_interest: {
    kind: 'write',
    description: "Register the user's interest in a property (notifies the owner). Requires confirmation.",
    parameters: {
      type: 'object',
      properties: { ppcId: { type: 'number', description: 'The property ppcId.' } },
      required: ['ppcId'],
    },
    proposal(phone, args = {}) {
      return {
        tool: 'send_interest',
        method: 'POST',
        endpoint: '/send-interests',
        body: { phoneNumber: phone, ppcId: args.ppcId },
        label: `Send interest on property #${args.ppcId}`,
        summary: 'The owner will be notified that you are interested.',
      };
    },
  },

  report_property: {
    kind: 'write',
    description: 'Report a property (e.g. already sold, wrong info, fraud). Requires confirmation.',
    parameters: {
      type: 'object',
      properties: {
        ppcId: { type: 'number', description: 'The property ppcId.' },
        selectReasons: {
          type: 'string',
          enum: ['Already Sold', 'Wrong Information', 'Not Responding', 'Fraud', 'Duplicate Ads', 'Other'],
          description: 'Preset report reason.',
        },
        reason: { type: 'string', description: 'Optional free-text comment.' },
      },
      required: ['ppcId', 'selectReasons'],
    },
    proposal(phone, args = {}) {
      return {
        tool: 'report_property',
        method: 'POST',
        endpoint: '/report-property',
        body: { phoneNumber: phone, ppcId: args.ppcId, selectReasons: args.selectReasons, reason: args.reason || args.selectReasons },
        label: `Report property #${args.ppcId} — ${args.selectReasons}`,
        summary: 'Our team will review this report.',
      };
    },
  },

  request_contact_owner: {
    kind: 'write',
    description: "Reveal the owner's contact for a property. This SPENDS the user's points. Requires confirmation.",
    parameters: {
      type: 'object',
      properties: {
        ppcId: { type: 'number', description: 'The property ppcId.' },
        points: { type: 'number', description: 'Points to spend (defaults to the configured cost).' },
      },
      required: ['ppcId'],
    },
    proposal(phone, args = {}) {
      // /points-deduct rejects a missing/zero `points` with "positive points are
      // required", so always send a concrete positive cost (the admin-configured
      // reveal price). It records the listing under the legacy `rentId` field —
      // Details.jsx posts the ppcId there too, so match that exactly.
      const points = Number(args.points) > 0 ? Number(args.points) : getSettingsSync().contactRevealPoints;
      return {
        tool: 'request_contact_owner',
        method: 'POST',
        endpoint: '/points-deduct',
        body: { phoneNumber: phone, rentId: args.ppcId, ppcId: args.ppcId, points, reason: 'view-owner-contact' },
        label: `Reveal owner contact for #${args.ppcId}`,
        summary: `This spends ${points} points to unlock the owner's phone number.`,
        spendsMoney: true,
      };
    },
  },
};

// ── NAVIGATE tools (proposal only — open an app page; no server write) ─────────
// Like write tools they never execute; the proposal carries a `navigate` route the
// frontend turns into a button. Used to hand the user off to a full app form.
//
// The user app's routes take the phone number as a path segment
// (/buyer-assistance/:phoneNumber, /add-property/:phoneNumber), so the route is
// built here from the VERIFIED session phone rather than trusting the client.
const navTools = {
  offer_buyer_assistance: {
    kind: 'navigate',
    description:
      "Offer to register the user's buying requirement as a Buyer Assistance request. " +
      'Call this ONLY when search_properties found no matching listing (even after relaxing filters), ' +
      'so the user can be alerted when a matching property is posted. Shows an "Add Buyer Assistance" ' +
      'button that opens the buyer-assistance form (prefilled with what they asked for).',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City e.g. "Pondicherry" or "Chennai".' },
        area: { type: 'string', description: 'Locality/area e.g. "White Town", "Lawspet".' },
        minPrice: { type: 'number', description: 'Minimum budget in INR (plain rupees).' },
        maxPrice: { type: 'number', description: 'Maximum budget in INR (plain rupees).' },
        bedrooms: { type: 'string', description: 'Number of bedrooms as a string: "1".."6".' },
        propertyType: { type: 'string', description: 'e.g. Apartment, Individual House, Plot, Land.' },
        propertyMode: { type: 'string', description: 'Sale, Rent or Lease.' },
      },
    },
    proposal(phone, args = {}) {
      // Map the assistant's search filters onto the Buyer Assistance form fields.
      const prefill = {
        city: args.city || '',
        area: args.area || '',
        minPrice: args.minPrice != null ? String(args.minPrice) : '',
        maxPrice: args.maxPrice != null ? String(args.maxPrice) : '',
        bedrooms: args.bedrooms || '',
        propertyType: args.propertyType || '',
        propertyMode: args.propertyMode || '',
      };
      return {
        tool: 'offer_buyer_assistance',
        kind: 'navigate',
        navigate: `/buyer-assistance/${digitsOf(phone)}`,
        cta: 'addBuyer',
        prefill,
        label: 'Add Buyer Assistance request',
        summary: "Register your requirement — we'll alert you when a matching property is listed.",
        note: 'An "Add Buyer Assistance" button is now shown. Ask the user to tap it to open the form and register their requirement; do NOT claim it is already submitted.',
      };
    },
  },

  offer_add_property: {
    kind: 'navigate',
    description:
      "Offer to post/list the user's OWN property for sale. Call this when the user (as an owner/seller) " +
      'says they want to add, post, list, put up, advertise, sell or upload their property/house/plot/land/shop. ' +
      'Shows an "Add Property" button that opens the post-property form.',
    parameters: {
      type: 'object',
      properties: {
        propertyType: { type: 'string', description: 'e.g. Individual House, Apartment, Plot, Land, Commercial Shop.' },
        city: { type: 'string', description: 'City e.g. "Pondicherry" or "Chennai".' },
        area: { type: 'string', description: 'Locality/area e.g. "White Town", "Lawspet".' },
      },
    },
    proposal(phone, args = {}) {
      const prefill = {
        propertyType: args.propertyType || '',
        city: args.city || '',
        area: args.area || '',
      };
      return {
        tool: 'offer_add_property',
        kind: 'navigate',
        navigate: `/add-property/${digitsOf(phone)}`,
        cta: 'addProperty',
        prefill,
        label: 'Add / Post your property',
        summary: 'Open the form to list your property for sale.',
        note: 'An "Add Property" button is now shown. Ask the user to tap it to open the post-property form; do NOT claim the property is posted.',
      };
    },
  },

  offer_points_purchase: {
    kind: 'navigate',
    description:
      "Open the Points pricing page so the user can BUY points. Call this whenever the user " +
      "wants an owner's contact/number/phone but does NOT have enough points to unlock it " +
      "(check get_my_points_balance first — hasEnoughPoints is false / balance is 0). Shows a " +
      "prominent 'Buy Points' button. This is the key call-to-action: an owner contact can ONLY " +
      "be unlocked with points.",
    parameters: {
      type: 'object',
      properties: {
        ppcId: { type: 'number', description: 'The property the user wanted contact for (optional).' },
      },
    },
    proposal(phone, args = {}) {
      return {
        tool: 'offer_points_purchase',
        kind: 'navigate',
        navigate: '/points-plans',
        cta: 'buyPoints',
        prefill: { ppcId: args.ppcId != null ? String(args.ppcId) : '' },
        label: 'Buy points to unlock owner contact',
        summary: "Owner contacts are unlocked with points. Tap to see the points plans.",
        spendsMoney: false,
        note: 'A "Buy Points" button is now shown. STRONGLY and warmly urge the user to tap it — ' +
          'without points they cannot view any owner contact. Do NOT reveal or promise a number.',
      };
    },
  },
};

const allTools = { ...readTools, ...writeTools, ...navTools };

function getTool(name) {
  return allTools[name] || null;
}

// Schemas handed to the model. Both read and write tools are advertised; the
// orchestrator decides read=execute vs write=propose.
function openaiToolSchemas() {
  return Object.entries(allTools).map(([name, t]) => ({
    type: 'function',
    function: { name, description: t.description, parameters: t.parameters },
  }));
}

module.exports = { getTool, openaiToolSchemas, readTools, writeTools, navTools, allTools };
