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
 * This route returns a complete, self-contained HTML page for one listing:
 * correct <title>, description, canonical, Open Graph image (the actual
 * property photo), schema.org RealEstateListing, and the listing facts as real
 * text. Point bots at it with a user-agent rewrite in the Apache vhost (see
 * SEO.md) — humans keep getting the SPA untouched, and anyone who does open
 * this URL directly gets a readable page with a link into the app.
 *
 *   GET /PPC/seo/details/:ppcId
 *   GET /PPC/seo/preview/:ppcId    same page, plus a debug JSON dump
 */

const express = require('express');
const AddModel = require('../AddModel');

const router = express.Router();

const SITE_URL = (process.env.SEO_SITE_URL || 'https://ppcpondy.com').replace(/\/+$/, '');
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

const renderPage = (p) => {
  const canonical = SITE_URL + '/details/' + p.ppcId;
  const images = Array.from(new Set((p.photos || []).map(photoUrl).filter(Boolean)));
  const title = titleOf(p);
  const description = descriptionOf(p);
  const ogImage = images[0] || SITE_URL + '/logo512.png';
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
    '<!DOCTYPE html>\n' +
    '<html lang="en-IN">\n' +
    '<head>\n' +
    '<meta charset="utf-8" />\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<title>' + esc(title) + ' | ' + SITE_NAME + '</title>\n' +
    '<meta name="description" content="' + esc(description) + '" />\n' +
    '<meta name="robots" content="index, follow, max-image-preview:large" />\n' +
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
    '<script type="application/ld+json">' +
    jsonLdScript(jsonLdOf(p, canonical, images)) +
    '</script>\n' +
    '<style>body{font-family:Inter,Arial,sans-serif;margin:0;padding:24px;color:#1b1b1b;max-width:900px}' +
    'h1{font-size:22px;margin:0 0 8px}table{border-collapse:collapse;width:100%;margin:16px 0}' +
    'th,td{border:1px solid #e3eef0;padding:8px 10px;text-align:left;font-size:14px}' +
    'th{background:#f6fafb;width:180px}img{max-width:100%;height:auto;border-radius:8px;margin:4px 0}' +
    '.price{font-size:20px;font-weight:700;color:#004E9D}a.cta{display:inline-block;margin-top:16px;' +
    'background:#004E9D;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none}</style>\n' +
    '</head>\n' +
    '<body>\n' +
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
    ' &middot; +91 91505 24409</small></p>\n' +
    '</body>\n</html>\n'
  );
};

const findActive = (ppcId) =>
  AddModel.findOne({
    ppcId: Number(ppcId),
    isDeleted: { $ne: true },
  }).lean();

router.get('/seo/details/:ppcId', async (req, res) => {
  try {
    const property = await findActive(req.params.ppcId);
    if (!property) {
      res
        .status(404)
        .header('Content-Type', 'text/html; charset=utf-8')
        .send(
          '<!DOCTYPE html><html lang="en-IN"><head><meta charset="utf-8">' +
            '<title>Property not found | ' + SITE_NAME + '</title>' +
            '<meta name="robots" content="noindex"></head><body>' +
            '<h1>This property is no longer listed</h1>' +
            '<p><a href="' + SITE_URL + '/all-property">Browse current listings</a></p>' +
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
    const property = await findActive(req.params.ppcId);
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
