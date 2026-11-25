/**
 * Server-rendered listing pages for crawlers and link-preview bots.
 *
 * The public site is a client-rendered SPA: the HTML Apache returns for
 * /details/1234 contains only the generic <head> from index.html and an empty
 * <div id="root">. Googlebot eventually renders the JavaScript, but the bots
 * that matter most for a property marketplace never do —
 * WhatsApp, Facebook, Twitter/X, LinkedIn and Telegram read the raw HTML once
 * and stop. Today every shared listing therefore previews as the same generic
 * "Pondy Properties" card.
 *
 * Two ways to serve a listing:
 *
 *   GET /PPC/seo/shell/details/:ppcId   the SPA's own index.html with this
 *       listing's <head> (title, description, canonical, Open Graph image,
 *       schema.org RealEstateListing) written in, and the facts as text in
 *       <noscript>. Apache sends EVERY request for /details/:id and
 *       /detail/:id here (see SEO.md) — people get the normal app, and every
 *       crawler and link-preview bot gets the same document with the right
 *       head. No user-agent sniffing, so nothing that looks like cloaking.
 *   GET /PPC/seo/details/:ppcId         a complete, self-contained HTML page
 *       for one listing (used when the SPA's index.html can't be read).
 *   GET /PPC/seo/preview/:ppcId         that page, plus a debug JSON dump
 *
 * Only `status: 'active'` listings are indexable. Expired, sold, pending and
 * removed listings still render (owners and old shared links land on them)
 * but carry `noindex`, and a ppcId that doesn't exist is a real 404.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const AddModel = require('../AddModel');

const router = express.Router();

const SITE_URL = (process.env.SEO_SITE_URL || 'https://pondyproperty.com').replace(/\/+$/, '');
const SITE_NAME = 'Pondy Properties';

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Serialise JSON-LD for embedding in an inline <script> element.
 *
 * The payload carries owner-written text (the property description), so a
 * listing containing the characters that end a script tag would otherwise
 * close the block and inject markup into the page. Escaping every '<' as
 * \u003c is still valid JSON, parses identically, and cannot terminate the
 * element.
 */
const jsonLdScript = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const photoUrl = (p) => {
  const clean = String(p || '')
    .replace(/\\/g, '/')
    // Windows-written paths arrive with doubled separators; a doubled slash
    // in an image URL 404s on some setups, so collapse them.
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .trim();
  if (!clean) return '';
  return /^https?:\/\//i.test(clean) ? clean : SITE_URL + '/PPC/' + clean;
};

/** 4500000 -> "45 Lakh", 12000000 -> "1.2 Crore". */
const formatPrice = (value) => {
  const n = Number(value);
  if (!n || Number.isNaN(n) || n <= 0) return '';
  if (n >= 10000000) {
    const cr = n / 10000000;
    return (cr % 1 === 0 ? cr : cr.toFixed(2).replace(/\.?0+$/, '')) + ' Crore';
  }
  if (n >= 100000) {
    const l = n / 100000;
    return (l % 1 === 0 ? l : l.toFixed(2).replace(/\.?0+$/, '')) + ' Lakh';
  }
  return n.toLocaleString('en-IN');
};

/**
 * Address fields that carry no information. Real listings hold "Others",
 * "N/A" and whitespace-only strings, and "Plot for Sale in Others" is worse
 * than saying nothing about the locality at all.
 */
const PLACEHOLDER = /^(others?|none|n\/?a|nil|null|-+|test)$/i;

const locationOf = (p) => {
  const parts = [p.area, p.nagar, p.city, p.district]
    .map((x) => String(x || '').trim())
    .filter((x) => x && !PLACEHOLDER.test(x));
  const seen = new Set();
  return parts
    .filter((x) => {
      const k = x.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 2)
    .join(', ');
};

/**
 * "2 BHK" from the messy real values of `bedrooms`.
 *
 * Live data holds null, "0", "No", plain numbers and already-formatted
 * strings like "3 BHK". Anything that is not a positive room count has to
 * disappear entirely — a plot titled "0 BHK Plot" reads as broken.
 */
const bedroomLabel = (raw) => {
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return '';
  if (/bhk/i.test(s)) return s.replace(/\s+/g, ' ').replace(/bhk/i, 'BHK');
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n <= 0) return '';
  return n + ' BHK';
};

// `propertyMode` is usually a category (Residential, Commercial) but is
// sometimes the intent itself (Sale). Only the latter belongs after "for".
const INTENT = /^(sale|rent|lease|resale)$/i;

const titleOf = (p) => {
  const bits = [];
  const beds = bedroomLabel(p.bedrooms);
  if (beds) bits.push(beds);
  const mode = String(p.propertyMode || '').trim();
  const isIntent = INTENT.test(mode);
  if (mode && !isIntent) bits.push(mode);
  bits.push(String(p.propertyType || 'Property').trim());
  bits.push('for ' + (isIntent ? mode : 'Sale'));
  const place = locationOf(p);
  if (place) bits.push('in ' + place);
  const price = p.onDemand ? '' : formatPrice(p.price);
  return bits.join(' ') + (price ? ' - ' + price : '');
};

const clamp = (text, max) => {
  const clean = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  // Reserve room for the ellipsis so the result never exceeds `max`.
  const cut = clean.slice(0, max - 3);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim() + '...';
};

const descriptionOf = (p) => {
  const own = clamp(p.description, 155);
  if (own && own.length >= 70) return own;
  const facts = [];
  const beds = bedroomLabel(p.bedrooms);
  if (beds) facts.push(beds);
  const mode = String(p.propertyMode || '').trim();
  if (mode && !INTENT.test(mode)) facts.push(mode);
  if (p.propertyType) facts.push(String(p.propertyType));
  if (p.totalArea) facts.push(String(p.totalArea) + ' ' + String(p.areaUnit || 'sq.ft'));
  if (p.facing) facts.push(String(p.facing) + ' facing');
  if (String(p.bankLoan || '').toLowerCase() === 'yes') facts.push('bank loan available');
  const place = locationOf(p);
  const price = p.onDemand ? 'Price on request' : formatPrice(p.price);
  const core =
    (facts.length ? facts.join(', ') : 'Property') +
    (place ? ' in ' + place : '') +
    (price ? '. ' + (p.onDemand ? price : 'Price ' + price) : '') +
    '. PPC ID ' + (p.ppcId || '') + '.';
  // Append the call to action only when it fits whole, so a listing never
  // ends mid-phrase ("...owner contact on...").
  const tail = ' View photos, location and owner contact on ' + SITE_NAME + '.';
  return clamp(core.length + tail.length <= 160 ? core + tail : core, 160);
};

const jsonLdOf = (p, canonical, images) => {
  const price = Number(p.price) || 0;
  const coords = p.locationCoordinates || {};
  const lat = Number(coords.latitude || coords.lat);
  const lng = Number(coords.longitude || coords.lng);

  const graph = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': canonical,
    url: canonical,
    name: titleOf(p),
    description: descriptionOf(p),
    identifier: String(p.ppcId || ''),
    provider: {
      '@type': 'RealEstateAgent',
      name: SITE_NAME,
      url: SITE_URL,
      telephone: '+91-9150524409',
    },
    about: {
      '@type': 'Accommodation',
      name: titleOf(p),
      address: {
        '@type': 'PostalAddress',
        addressLocality: String(p.city || p.district || 'Puducherry'),
        addressRegion: String(p.state || 'Puducherry'),
        addressCountry: 'IN',
      },
    },
  };
  if (images.length) graph.image = images.slice(0, 8);
  if (p.createdAt) graph.datePosted = new Date(p.createdAt).toISOString();
  if (lat && lng) {
    graph.about.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  }
  if (price > 0 && !p.onDemand) {
    graph.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: canonical,
    };
  }
  return graph;
};

/** Same trail the SPA builds (src/utils/propertySeo.js propertyBreadcrumb). */
const breadcrumbOf = (p, canonical) => {
  const city = String(p.city || p.district || 'Pondicherry').trim();
  const type = String(p.propertyType || 'Property').trim();
  const crumbs = [
    ['Home', SITE_URL + '/'],
    ['Properties in ' + city, SITE_URL + '/all-property'],
    [type + ' - PPC ' + (p.ppcId || ''), canonical],
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, item], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item,
    })),
  };
};

/** Only live listings belong in search results. */
const isLive = (p) => p.status === 'active';

const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const ROBOTS_NOINDEX = 'noindex, follow';

/** The visible facts table — same fields the SPA shows, minus owner contact. */
const FACT_FIELDS = [
  ['Property Mode', 'propertyMode'],
  ['Property Type', 'propertyType'],
  ['Bedrooms', 'bedrooms'],
  ['Total Area', null],
  ['Property Age', 'propertyAge'],
  ['Facing', 'facing'],
  ['Ownership', 'ownership'],
  ['Approved By', 'propertyApproved'],
  ['Bank Loan', 'bankLoan'],
  ['Negotiation', 'negotiation'],
  ['Car Parking', 'carParking'],
  ['Furnished', 'furnished'],
  ['Number of Floors', 'numberOfFloors'],
  ['Posted By', 'postedBy'],
];

/** Listing facts as plain HTML — the standalone page body and the SPA's <noscript>. */
const renderFacts = (p, title, description, images) => {
  const canonical = SITE_URL + '/details/' + p.ppcId;
  const place = locationOf(p);
  const price = p.onDemand ? 'Price on request' : formatPrice(p.price);

  const rows = FACT_FIELDS.map(([label, key]) => {
    const value =
      label === 'Total Area'
        ? p.totalArea
          ? String(p.totalArea) + ' ' + String(p.areaUnit || '')
          : ''
        : p[key];
    if (!value || String(value).trim() === '') return '';
    return '<tr><th>' + esc(label) + '</th><td>' + esc(value) + '</td></tr>';
  })
    .filter(Boolean)
    .join('\n      ');

  const gallery = images
    .slice(0, 6)
    .map(
      (src, i) =>
        '<img src="' + esc(src) + '" alt="' + esc(title + ' - photo ' + (i + 1)) +
        '" width="480" loading="lazy" />'
    )
    .join('\n      ');

  return (
    '  <h1>' + esc(title) + '</h1>\n' +
    (place ? '  <p>' + esc(place) + '</p>\n' : '') +
    (price ? '  <p class="price">' + esc(price) + '</p>\n' : '') +
    '  <p>' + esc(description) + '</p>\n' +
    (rows ? '  <table>\n      ' + rows + '\n  </table>\n' : '') +
    (p.description
      ? '  <h2>About this property</h2>\n  <p>' + esc(p.description) + '</p>\n'
      : '') +
    (gallery ? '  <h2>Photos</h2>\n      ' + gallery + '\n' : '') +
    '  <p><a class="cta" href="' + esc(canonical) + '">View full details on ' +
    SITE_NAME + '</a></p>\n' +
    '  <p><small>PPC ID ' + esc(p.ppcId) + ' &middot; ' + SITE_NAME +
    ' &middot; +91 91505 24409</small></p>\n'
  );
};

const renderPage = (p) => {
  const canonical = SITE_URL + '/details/' + p.ppcId;
  const images = Array.from(new Set((p.photos || []).map(photoUrl).filter(Boolean)));
  const title = titleOf(p);
  const description = descriptionOf(p);
  const ogImage = images[0] || SITE_URL + '/logo512.png';

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="en-IN">\n' +
    '<head>\n' +
    '<meta charset="utf-8" />\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<title>' + esc(title) + ' | ' + SITE_NAME + '</title>\n' +
    '<meta name="description" content="' + esc(description) + '" />\n' +
    '<meta name="robots" content="' + (isLive(p) ? ROBOTS_INDEX : ROBOTS_NOINDEX) + '" />\n' +
    '<link rel="canonical" href="' + esc(canonical) + '" />\n' +
    '<meta property="og:site_name" content="' + SITE_NAME + '" />\n' +
    '<meta property="og:type" content="article" />\n' +
    '<meta property="og:locale" content="en_IN" />\n' +
    '<meta property="og:title" content="' + esc(title) + '" />\n' +
    '<meta property="og:description" content="' + esc(description) + '" />\n' +
    '<meta property="og:url" content="' + esc(canonical) + '" />\n' +
    '<meta property="og:image" content="' + esc(ogImage) + '" />\n' +
    '<meta property="og:image:alt" content="' + esc(title) + '" />\n' +
    '<meta name="twitter:card" content="summary_large_image" />\n' +
    '<meta name="twitter:title" content="' + esc(title) + '" />\n' +
    '<meta name="twitter:description" content="' + esc(description) + '" />\n' +
    '<meta name="twitter:image" content="' + esc(ogImage) + '" />\n' +
    (isLive(p)
      ? '<script type="application/ld+json">' +
        jsonLdScript([jsonLdOf(p, canonical, images), breadcrumbOf(p, canonical)]) +
        '</script>\n'
      : '') +
    '<style>body{font-family:Inter,Arial,sans-serif;margin:0;padding:24px;color:#1b1b1b;max-width:900px}' +
    'h1{font-size:22px;margin:0 0 8px}table{border-collapse:collapse;width:100%;margin:16px 0}' +
    'th,td{border:1px solid #e3eef0;padding:8px 10px;text-align:left;font-size:14px}' +
    'th{background:#f6fafb;width:180px}img{max-width:100%;height:auto;border-radius:8px;margin:4px 0}' +
    '.price{font-size:20px;font-weight:700;color:#004E9D}a.cta{display:inline-block;margin-top:16px;' +
    'background:#004E9D;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none}</style>\n' +
    '</head>\n' +
    '<body>\n' +
    renderFacts(p, title, description, images) +
    '</body>\n</html>\n'
  );
};

const NOT_FOUND_TITLE = 'Property not found';
const NOT_FOUND_HTML =
  '<h1>This property is no longer listed</h1>' +
  '<p><a href="' + SITE_URL + '/all-property">Browse current listings</a></p>';

const findListing = (ppcId) =>
  AddModel.findOne({
    ppcId: Number(ppcId),
    isDeleted: { $ne: true },
  }).lean();

/* --------------------------------------------------------------- */
/* The SPA shell with a listing's head written in                   */
/* --------------------------------------------------------------- */

/**
 * The user app's built index.html. On the VPS the backend lives in
 * public_html/PPC and the user build in public_html, so it is two levels up
 * from this file. Re-read whenever the file changes, so a frontend deploy
 * needs no backend restart.
 */
const SPA_INDEX =
  process.env.SEO_SPA_INDEX || path.join(__dirname, '..', '..', 'index.html');
let shellCache = { mtimeMs: 0, html: null };

const readShell = () => {
  try {
    const { mtimeMs } = fs.statSync(SPA_INDEX);
    if (mtimeMs !== shellCache.mtimeMs) {
      shellCache = { mtimeMs, html: fs.readFileSync(SPA_INDEX, 'utf8') };
    }
    return shellCache.html;
  } catch (err) {
    return null;
  }
};

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const metaRe = (attr, key) =>
  new RegExp('<meta\\s+' + attr + '="' + reEsc(key) + '"[^>]*>', 'i');
const CANONICAL_RE = /<link\s+rel="canonical"[^>]*>/i;

// Replacements use a function so `$` in listing text is never read as a
// replacement pattern.
const upsert = (html, re, tag) =>
  re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', () => tag + '</head>');

const setMeta = (html, attr, key, content) =>
  content
    ? upsert(html, metaRe(attr, key), '<meta ' + attr + '="' + key + '" content="' + esc(content) + '"/>')
    : html.replace(metaRe(attr, key), '');

/**
 * Write a page's head into the SPA shell. Tags the shell already has are
 * replaced in place; missing ones are added. The SPA's own head code
 * (src/utils/seo.js) finds these same tags by the same selectors once it
 * boots, so nothing is duplicated.
 */
const injectHead = (html, { title, description, robots, canonical, image, imageAlt, jsonLd, body }) => {
  let out = html.replace(/<title>[^<]*<\/title>/i, () => '<title>' + esc(title) + '</title>');
  out = setMeta(out, 'name', 'description', description);
  out = setMeta(out, 'name', 'robots', robots);
  // index.html's static googlebot tag would contradict a noindex.
  out = setMeta(out, 'name', 'googlebot', null);
  out = canonical
    ? upsert(out, CANONICAL_RE, '<link rel="canonical" href="' + esc(canonical) + '"/>')
    : out.replace(CANONICAL_RE, '');
  out = setMeta(out, 'property', 'og:type', 'article');
  out = setMeta(out, 'property', 'og:title', title);
  out = setMeta(out, 'property', 'og:description', description);
  out = setMeta(out, 'property', 'og:url', canonical);
  out = setMeta(out, 'property', 'og:image', image);
  out = setMeta(out, 'property', 'og:image:alt', imageAlt);
  out = setMeta(out, 'name', 'twitter:title', title);
  out = setMeta(out, 'name', 'twitter:description', description);
  out = setMeta(out, 'name', 'twitter:image', image);
  if (jsonLd) {
    // Same data-seo id the listing page uses, so the SPA replaces it in place.
    const script =
      '<script type="application/ld+json" data-seo="property">' + jsonLdScript(jsonLd) + '</script>';
    out = out.replace('</head>', () => script + '</head>');
  }
  if (body) {
    out = /<noscript>[\s\S]*?<\/noscript>/i.test(out)
      ? out.replace(/<noscript>[\s\S]*?<\/noscript>/i, () => '<noscript>' + body + '</noscript>')
      : out.replace('<div id="root">', () => '<noscript>' + body + '</noscript><div id="root">');
  }
  return out;
};

const sendHtml = (res, status, html) =>
  res
    .status(status)
    .header('Content-Type', 'text/html; charset=utf-8')
    // Same freshness as index.html itself: it names the current JS bundle.
    .header('Cache-Control', 'no-cache')
    .send(html);

router.get('/seo/shell/details/:ppcId', async (req, res) => {
  const shell = readShell();
  let property;
  try {
    property = await findListing(req.params.ppcId);
  } catch (err) {
    // Never break the page for people over an SEO lookup.
    console.error('[seo] shell lookup failed:', err.message);
    if (shell) return sendHtml(res, 200, shell);
    return res.status(500).send('lookup failed');
  }

  if (!shell) {
    console.error('[seo] SPA index.html not readable at', SPA_INDEX);
    return property
      ? sendHtml(res, 200, renderPage(property))
      : sendHtml(res, 404, '<!DOCTYPE html><title>' + NOT_FOUND_TITLE + '</title>' + NOT_FOUND_HTML);
  }

  if (!property) {
    // The SPA still boots and shows its own "not found" state.
    return sendHtml(
      res,
      404,
      injectHead(shell, {
        title: NOT_FOUND_TITLE + ' | ' + SITE_NAME,
        description: 'This property is no longer listed on ' + SITE_NAME + '.',
        robots: ROBOTS_NOINDEX,
        body: NOT_FOUND_HTML,
      })
    );
  }

  const canonical = SITE_URL + '/details/' + property.ppcId;
  const images = Array.from(new Set((property.photos || []).map(photoUrl).filter(Boolean)));
  const title = titleOf(property);
  const description = descriptionOf(property);
  const live = isLive(property);
  return sendHtml(
    res,
    200,
    injectHead(shell, {
      title: title + ' | ' + SITE_NAME,
      description,
      robots: live ? ROBOTS_INDEX : ROBOTS_NOINDEX,
      canonical,
      image: images[0] || SITE_URL + '/logo512.png',
      imageAlt: title,
      jsonLd: live ? [jsonLdOf(property, canonical, images), breadcrumbOf(property, canonical)] : null,
      body: renderFacts(property, title, description, images),
    })
  );
});

router.get('/seo/details/:ppcId', async (req, res) => {
  try {
    const property = await findListing(req.params.ppcId);
    if (!property) {
      res
        .status(404)
        .header('Content-Type', 'text/html; charset=utf-8')
        .send(
          '<!DOCTYPE html><html lang="en-IN"><head><meta charset="utf-8">' +
            '<title>' + NOT_FOUND_TITLE + ' | ' + SITE_NAME + '</title>' +
            '<meta name="robots" content="noindex"></head><body>' +
            NOT_FOUND_HTML +
            '</body></html>'
        );
      return;
    }
    res.header('Content-Type', 'text/html; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=900');
    res.send(renderPage(property));
  } catch (err) {
    console.error('[seo] prerender failed:', err.message);
    res.status(500).send('prerender failed');
  }
});

/** Same render plus the raw record — for checking what a bot will see. */
router.get('/seo/preview/:ppcId', async (req, res) => {
  try {
    const property = await findListing(req.params.ppcId);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    const canonical = SITE_URL + '/details/' + property.ppcId;
    const images = Array.from(
      new Set((property.photos || []).map(photoUrl).filter(Boolean))
    );
    return res.json({
      canonical,
      title: titleOf(property) + ' | ' + SITE_NAME,
      description: descriptionOf(property),
      ogImage: images[0] || SITE_URL + '/logo512.png',
      imageCount: images.length,
      jsonLd: jsonLdOf(property, canonical, images),
      html: renderPage(property),
    });
  } catch (err) {
    return res.status(500).json({ message: 'preview failed', error: err.message });
  }
});

module.exports = router;
