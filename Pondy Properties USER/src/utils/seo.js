/**
 * SEO core helpers for the Pondy Properties public site.
 *
 * The site is a client-rendered CRA app, so every crawlable tag has to be
 * written into <head> at runtime. These helpers *upsert* tags (update the one
 * already in `public/index.html`, create it only when missing) instead of
 * appending — that guarantees exactly one <title>, one description, one
 * canonical, etc., no matter how many routes the user visits in a session.
 *
 * Anything a page does not supply falls back to the site defaults below, so a
 * route that forgets its own copy still ships a sane, non-boilerplate head.
 */

export const SITE = {
  url: 'https://ppcpondy.com',
  name: 'Pondy Properties',
  shortName: 'Pondy Properties',
  twitter: '@pondyproperty',
  logo: 'https://ppcpondy.com/logo512.png',
  // Default social share image. Replace with a purpose-built 1200x630 banner
  // (see SEO.md) — logo512 works but renders as a small square in previews.
  defaultImage: 'https://ppcpondy.com/logo512.png',
  phone: '+91-9150524409',
  landline: '+91-413-2914409',
  email: 'inf.ppcpdy@gmail.com',
  address: {
    street: 'No.89, Aurobindo Street, M.G Road Junction',
    locality: 'Puducherry',
    region: 'Puducherry',
    postalCode: '605001',
    country: 'IN',
  },
  geo: { lat: 11.9339, lng: 79.83 },
  social: [
    'https://www.facebook.com/pondyproperty',
    'https://www.instagram.com/pondy_property',
    'https://www.youtube.com/@pondyclassifieds15',
  ],
  playStore: 'https://play.google.com/store/apps/details?id=com.apps.ppcpondy',
};

export const DEFAULT_TITLE =
  'Pondy Properties | Buy, Sell & Rent Property in Pondicherry and Chennai';

export const DEFAULT_DESCRIPTION =
  'Pondy Properties lists verified houses, plots, flats, villas and commercial ' +
  'property for sale in Pondicherry and Chennai. Browse owner-posted listings ' +
  'with photos, prices and locations, or post your property free.';

export const DEFAULT_KEYWORDS = [
  'Pondy Properties',
  'property in Pondicherry',
  'real estate Pondicherry',
  'houses for sale Pondicherry',
  'plots for sale Puducherry',
  'flats for sale Pondicherry',
  'property in Chennai',
  'buy property Puducherry',
  'sell property Pondicherry',
  'land for sale Pondicherry',
];

/** Title suffix rule: keep short titles branded, never double-brand. */
export const buildTitle = (title) => {
  if (!title) return DEFAULT_TITLE;
  const t = String(title).trim();
  if (!t) return DEFAULT_TITLE;
  if (t.toLowerCase().includes('pondy propert')) return t;
  return t + ' | ' + SITE.shortName;
};

/** Absolute URL for a path (or pass through an already-absolute URL). */
export const absoluteUrl = (pathOrUrl) => {
  if (!pathOrUrl) return SITE.url;
  const s = String(pathOrUrl);
  if (/^https?:\/\//i.test(s)) return s;
  return SITE.url + (s.startsWith('/') ? '' : '/') + s;
};

/** Collapse whitespace and clamp a description to a search-friendly length. */
export const clampDescription = (text, max = 160) => {
  const clean = String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  // Reserve room for the ellipsis so the result never exceeds `max` — the
  // whole point of the clamp is to stay inside Google's snippet budget.
  const cut = clean.slice(0, max - 3);
  const lastSpace = cut.lastIndexOf(' ');
  const kept = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return kept.trim() + '...';
};

/* ------------------------------------------------------------------ */
/* Low-level <head> upserts                                            */
/* ------------------------------------------------------------------ */

const head = () => document.head || document.getElementsByTagName('head')[0];

/**
 * Upsert a <meta> tag. `attr` is 'name' or 'property' (Open Graph uses
 * property, Twitter and standard meta use name). An empty content removes the
 * tag, which is how a route clears a tag the previous route set.
 */
export const setMeta = (attr, key, content) => {
  if (typeof document === 'undefined') return;
  const selector = 'meta[' + attr + '="' + key + '"]';
  let el = document.querySelector(selector);
  if (content === null || content === undefined || content === '') {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    head().appendChild(el);
  }
  el.setAttribute('content', String(content));
};

/** Upsert a <link rel="..."> tag (canonical, alternate, ...). */
export const setLink = (rel, href, extraAttrs = {}) => {
  if (typeof document === 'undefined') return;
  const hreflang = extraAttrs.hreflang;
  const selector = hreflang
    ? 'link[rel="' + rel + '"][hreflang="' + hreflang + '"]'
    : 'link[rel="' + rel + '"]:not([hreflang])';
  let el = document.querySelector(selector);
  if (!href) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    head().appendChild(el);
  }
  Object.keys(extraAttrs).forEach((k) => el.setAttribute(k, extraAttrs[k]));
  el.setAttribute('href', href);
};

/**
 * Upsert a JSON-LD block. Each block carries a `data-seo` id so re-rendering a
 * route replaces its own structured data and never stacks duplicates. The base
 * Organization/WebSite graph in index.html has id "site-graph" and is left
 * alone; pages only manage their own ids.
 */
export const setJsonLd = (id, data) => {
  if (typeof document === 'undefined') return;
  const selector = 'script[type="application/ld+json"][data-seo="' + id + '"]';
  let el = document.querySelector(selector);
  if (!data) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo', id);
    head().appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

/* ------------------------------------------------------------------ */
/* The one call every page makes                                       */
/* ------------------------------------------------------------------ */

/**
 * Apply a full head for the current page.
 *
 * @param {object}   o
 * @param {string}   o.title        Page title (branded automatically).
 * @param {string}   o.description  Meta description / og:description.
 * @param {string}   o.path         Canonical path, e.g. '/details/1234'.
 * @param {string}   o.image        Absolute or site-relative share image.
 * @param {string}   o.type         og:type ('website' | 'article' | 'product').
 * @param {boolean}  o.noindex      True for private/transactional pages.
 * @param {string[]} o.keywords     Optional keyword override.
 * @param {object}   o.jsonLd       Optional page-level structured data.
 * @param {string}   o.jsonLdId     Id for that block (default 'page').
 */
export const applySeo = ({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  keywords,
  jsonLd,
  jsonLdId = 'page',
} = {}) => {
  if (typeof document === 'undefined') return;

  const fullTitle = buildTitle(title);
  const desc = clampDescription(description || DEFAULT_DESCRIPTION);
  const canonical = absoluteUrl(
    path || (typeof window !== 'undefined' ? window.location.pathname : '/')
  );
  const img = absoluteUrl(image || SITE.defaultImage);

  document.title = fullTitle;

  setMeta('name', 'description', desc);
  setMeta(
    'name',
    'keywords',
    (keywords && keywords.length ? keywords : DEFAULT_KEYWORDS).join(', ')
  );

  // Private pages must never be indexed; public pages get the full crawl hints.
  setMeta(
    'name',
    'robots',
    noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  );

  setLink('canonical', canonical);

  // Open Graph (Facebook, WhatsApp, LinkedIn).
  setMeta('property', 'og:site_name', SITE.name);
  setMeta('property', 'og:locale', 'en_IN');
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:image', img);
  setMeta('property', 'og:image:alt', fullTitle);

  // Twitter / X.
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:site', SITE.twitter);
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', img);

  setJsonLd(jsonLdId, jsonLd || null);
};

/* ------------------------------------------------------------------ */
/* Structured-data builders                                            */
/* ------------------------------------------------------------------ */

/** BreadcrumbList from [{ name, path }] — path may be omitted on the last crumb. */
export const buildBreadcrumb = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    ...(item.path ? { item: absoluteUrl(item.path) } : {}),
  })),
});

/** ItemList for a listing/feed page — helps Google understand result pages. */
export const buildItemList = (name, urls = []) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: urls.length,
  itemListElement: urls.map((url, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: absoluteUrl(url),
  })),
});

/** FAQPage from [{ question, answer }]. */
export const buildFaq = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
});
