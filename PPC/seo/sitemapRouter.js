/**
 * XML sitemaps for https://ppcpondy.com
 *
 * The public site is a client-rendered SPA, so a crawler has no links to
 * follow until JavaScript runs — the sitemap is how Google discovers the
 * property detail pages at all. It is generated live from MongoDB (rather
 * than written at build time) so a listing added today is discoverable today
 * without redeploying the frontend.
 *
 * Served under the backend prefix:
 *   /PPC/sitemap.xml              sitemap index
 *   /PPC/sitemap-core.xml         static public pages
 *   /PPC/sitemap-properties.xml   every active listing (paginated)
 *
 * Mounted BEFORE SingleSendRouter in server.js — that router's catch-all
 * GET "/:id" would otherwise swallow these paths.
 */

const express = require('express');
const AddModel = require('../AddModel');

const router = express.Router();

const SITE_URL = (process.env.SEO_SITE_URL || 'https://ppcpondy.com').replace(/\/+$/, '');

// Sitemaps.org caps a single file at 50,000 URLs; stay under it with room to
// spare so one page is always one HTTP response.
const PAGE_SIZE = 20000;

// Regenerating means a full scan of the properties collection, so results are
// cached. Search engines re-fetch a sitemap a few times a day at most.
const CACHE_TTL_MS = Number(process.env.SEO_SITEMAP_TTL_MS || 30 * 60 * 1000);
const cache = new Map();

const cached = async (key, producer) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const value = await producer();
  cache.set(key, { at: Date.now(), value });
  return value;
};

/** XML-escape a text node / attribute value. */
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const iso = (d) => {
  const date = d ? new Date(d) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
};

/** Listing photos are stored as paths relative to the backend's /PPC root. */
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

const urlNode = ({ loc, lastmod, changefreq, priority, images }) => {
  const parts = ['  <url>', '    <loc>' + esc(loc) + '</loc>'];
  if (lastmod) parts.push('    <lastmod>' + lastmod + '</lastmod>');
  if (changefreq) parts.push('    <changefreq>' + changefreq + '</changefreq>');
  if (priority) parts.push('    <priority>' + priority + '</priority>');
  (images || []).forEach((img) => {
    parts.push('    <image:image><image:loc>' + esc(img) + '</image:loc></image:image>');
  });
  parts.push('  </url>');
  return parts.join('\n');
};

const urlSet = (nodes) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  nodes.join('\n') +
  '\n</urlset>\n';

const sendXml = (res, xml) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=1800');
  res.send(xml);
};

/**
 * Static public pages. Kept in sync by hand with the public entries in the
 * frontend's src/utils/seoRoutes.js — if you add an indexable route there,
 * add it here too.
 *
 * Deliberately excluded: /pondicherry, /chennai and /mobileviews. Those feeds
 * redirect anonymous visitors to /login, so submitting them would hand Google
 * a login page under a property URL.
 */
const CORE_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/all-property', priority: '0.9', changefreq: 'hourly' },
  { path: '/sale-property', priority: '0.9', changefreq: 'daily' },
  { path: '/py-property', priority: '0.9', changefreq: 'daily' },
  { path: '/chennai-property', priority: '0.9', changefreq: 'daily' },
  { path: '/new-property', priority: '0.8', changefreq: 'hourly' },
  { path: '/feature-property', priority: '0.8', changefreq: 'daily' },
  { path: '/most-viewed', priority: '0.7', changefreq: 'daily' },
  { path: '/property-map', priority: '0.7', changefreq: 'weekly' },
  { path: '/house-below', priority: '0.8', changefreq: 'daily' },
  { path: '/house-average', priority: '0.8', changefreq: 'daily' },
  { path: '/plot-below', priority: '0.8', changefreq: 'daily' },
  { path: '/land-property', priority: '0.8', changefreq: 'daily' },
  { path: '/loan-property', priority: '0.7', changefreq: 'daily' },
  { path: '/sort/property-with-location', priority: '0.6', changefreq: 'daily' },
  { path: '/sort/bank-loan', priority: '0.6', changefreq: 'daily' },
  { path: '/sort/house-below-30L', priority: '0.6', changefreq: 'daily' },
  { path: '/sort/house-30L-50L', priority: '0.6', changefreq: 'daily' },
  { path: '/sort/plot-below-15L', priority: '0.6', changefreq: 'daily' },
  { path: '/sort/agricultural-land', priority: '0.6', changefreq: 'daily' },
  { path: '/sort/low-to-high', priority: '0.5', changefreq: 'daily' },
  { path: '/sort/high-to-low', priority: '0.5', changefreq: 'daily' },
  { path: '/sort/new-to-old', priority: '0.5', changefreq: 'daily' },
  { path: '/sort/with-image', priority: '0.5', changefreq: 'daily' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact-web', priority: '0.5', changefreq: 'monthly' },
  { path: '/our-support', priority: '0.4', changefreq: 'monthly' },
  { path: '/business', priority: '0.4', changefreq: 'monthly' },
  { path: '/Frequently-Asked-Questions', priority: '0.4', changefreq: 'monthly' },
  { path: '/Pricing-Plan', priority: '0.5', changefreq: 'monthly' },
  { path: '/buyer-plan', priority: '0.4', changefreq: 'monthly' },
  { path: '/points-plans', priority: '0.4', changefreq: 'monthly' },
  { path: '/groom', priority: '0.3', changefreq: 'weekly' },
  { path: '/bride', priority: '0.3', changefreq: 'weekly' },
  { path: '/privacy-policy', priority: '0.2', changefreq: 'yearly' },
  { path: '/terms-conditions-web', priority: '0.2', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.2', changefreq: 'yearly' },
  { path: '/shiping-delivery', priority: '0.2', changefreq: 'yearly' },
];

/** Only live, non-deleted listings belong in a sitemap. */
const ACTIVE_QUERY = {
  status: 'active',
  isDeleted: { $ne: true },
  ppcId: { $ne: null },
};

const countActive = () => AddModel.countDocuments(ACTIVE_QUERY);

/* --------------------------------------------------------------- */
/* /PPC/sitemap.xml — the index                                     */
/* --------------------------------------------------------------- */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await cached('index', async () => {
      const total = await countActive();
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const today = iso();

      const entries = ['/PPC/sitemap-core.xml'];
      for (let i = 1; i <= pages; i += 1) {
        entries.push(
          '/PPC/sitemap-properties.xml' + (i === 1 ? '' : '?page=' + i)
        );
      }

      return (
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        entries
          .map(
            (p) =>
              '  <sitemap>\n' +
              '    <loc>' + esc(SITE_URL + p) + '</loc>\n' +
              '    <lastmod>' + today + '</lastmod>\n' +
              '  </sitemap>'
          )
          .join('\n') +
        '\n</sitemapindex>\n'
      );
    });
    sendXml(res, xml);
  } catch (err) {
    console.error('[seo] sitemap index failed:', err.message);
    res.status(500).send('sitemap generation failed');
  }
});

/* --------------------------------------------------------------- */
/* /PPC/sitemap-core.xml — static pages                             */
/* --------------------------------------------------------------- */
router.get('/sitemap-core.xml', (req, res) => {
  const today = iso();
  const nodes = CORE_PAGES.map((p) =>
    urlNode({
      loc: SITE_URL + p.path,
      lastmod: today,
      changefreq: p.changefreq,
      priority: p.priority,
    })
  );
  sendXml(res, urlSet(nodes));
});

/* --------------------------------------------------------------- */
/* /PPC/sitemap-properties.xml — one entry per live listing         */
/* --------------------------------------------------------------- */
router.get('/sitemap-properties.xml', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  try {
    const xml = await cached('props:' + page, async () => {
      const properties = await AddModel.find(ACTIVE_QUERY)
        .select('ppcId updatedAt createdAt photos')
        .sort({ ppcId: 1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean();

      const nodes = properties.map((p) =>
        urlNode({
          loc: SITE_URL + '/details/' + p.ppcId,
          lastmod: iso(p.updatedAt || p.createdAt),
          changefreq: 'weekly',
          priority: '0.8',
          // Google Images indexes listing photos through the sitemap; the
          // first few are enough to associate them with the page.
          images: (p.photos || []).slice(0, 3).map(photoUrl).filter(Boolean),
        })
      );

      return urlSet(nodes);
    });
    sendXml(res, xml);
  } catch (err) {
    console.error('[seo] property sitemap failed:', err.message);
    res.status(500).send('sitemap generation failed');
  }
});

/* --------------------------------------------------------------- */
/* /PPC/seo/sitemap-status — quick health check for the team        */
/* --------------------------------------------------------------- */
router.get('/seo/sitemap-status', async (req, res) => {
  try {
    const total = await countActive();
    res.json({
      siteUrl: SITE_URL,
      activeProperties: total,
      pageSize: PAGE_SIZE,
      propertySitemaps: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      corePages: CORE_PAGES.length,
      cacheTtlMs: CACHE_TTL_MS,
      cachedKeys: Array.from(cache.keys()),
      index: SITE_URL + '/PPC/sitemap.xml',
    });
  } catch (err) {
    res.status(500).json({ message: 'status failed', error: err.message });
  }
});

/** Drop the cache — call after a bulk upload so new listings show up now. */
router.post('/seo/sitemap-refresh', (req, res) => {
  cache.clear();
  res.json({ message: 'sitemap cache cleared' });
});

module.exports = router;
