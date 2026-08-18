/**
 * Writes public/sitemap.xml before a build.
 *
 * Two sitemaps serve https://ppcpondy.com:
 *
 *   /sitemap.xml                    <- this file: the static public pages,
 *                                      shipped inside the frontend build so it
 *                                      exists even if the Node backend is down
 *   /PPC/sitemap-properties.xml     <- live, generated from MongoDB by
 *                                      PPC/seo/sitemapRouter.js
 *
 * Run it with `npm run sitemap` (the build script does this automatically).
 * Pass BUILD_SITEMAP_WITH_PROPERTIES=1 to also fetch every active listing from
 * the API and inline it here — useful if you ever need a single self-contained
 * sitemap file, but the live backend route is the better default.
 *
 * No dependencies: plain Node, https + fs.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SITE_URL = (process.env.SEO_SITE_URL || 'https://ppcpondy.com').replace(/\/+$/, '');
const API_URL = process.env.REACT_APP_API_URL || 'https://ppcpondy.com/PPC/PPC';
const WITH_PROPERTIES = process.env.BUILD_SITEMAP_WITH_PROPERTIES === '1';
const OUT = path.join(__dirname, '..', 'public', 'sitemap.xml');

/** Keep in sync with the public entries in src/utils/seoRoutes.js. */
const CORE_PAGES = [
  ['/', '1.0', 'daily'],
  ['/all-property', '0.9', 'hourly'],
  ['/sale-property', '0.9', 'daily'],
  ['/py-property', '0.9', 'daily'],
  ['/chennai-property', '0.9', 'daily'],
  ['/new-property', '0.8', 'hourly'],
  ['/feature-property', '0.8', 'daily'],
  ['/most-viewed', '0.7', 'daily'],
  ['/property-map', '0.7', 'weekly'],
  ['/house-below', '0.8', 'daily'],
  ['/house-average', '0.8', 'daily'],
  ['/plot-below', '0.8', 'daily'],
  ['/land-property', '0.8', 'daily'],
  ['/loan-property', '0.7', 'daily'],
  ['/sort/property-with-location', '0.6', 'daily'],
  ['/sort/bank-loan', '0.6', 'daily'],
  ['/sort/house-below-30L', '0.6', 'daily'],
  ['/sort/house-30L-50L', '0.6', 'daily'],
  ['/sort/plot-below-15L', '0.6', 'daily'],
  ['/sort/agricultural-land', '0.6', 'daily'],
  ['/sort/low-to-high', '0.5', 'daily'],
  ['/sort/high-to-low', '0.5', 'daily'],
  ['/sort/new-to-old', '0.5', 'daily'],
  ['/sort/with-image', '0.5', 'daily'],
  ['/about', '0.5', 'monthly'],
  ['/contact-web', '0.5', 'monthly'],
  ['/our-support', '0.4', 'monthly'],
  ['/business', '0.4', 'monthly'],
  ['/Frequently-Asked-Questions', '0.4', 'monthly'],
  ['/Pricing-Plan', '0.5', 'monthly'],
  ['/buyer-plan', '0.4', 'monthly'],
  ['/points-plans', '0.4', 'monthly'],
  ['/groom', '0.3', 'weekly'],
  ['/bride', '0.3', 'weekly'],
  ['/privacy-policy', '0.2', 'yearly'],
  ['/terms-conditions-web', '0.2', 'yearly'],
  ['/refund-policy', '0.2', 'yearly'],
  ['/shiping-delivery', '0.2', 'yearly'],
];

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const today = new Date().toISOString().split('T')[0];

const urlNode = (loc, lastmod, changefreq, priority) =>
  [
    '  <url>',
    '    <loc>' + esc(loc) + '</loc>',
    '    <lastmod>' + lastmod + '</lastmod>',
    '    <changefreq>' + changefreq + '</changefreq>',
    '    <priority>' + priority + '</priority>',
    '  </url>',
  ].join('\n');

const getJson = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('timeout', function () {
        this.destroy(new Error('timeout fetching ' + url));
      })
      .on('error', reject);
  });

const fetchActiveProperties = async () => {
  const data = await getJson(API_URL + '/fetch-active-users-on-demand');
  const list = Array.isArray(data) ? data : data.properties || data.users || [];
  return list
    .filter((p) => p && p.ppcId)
    .map((p) => ({
      ppcId: p.ppcId,
      lastmod: (p.updatedAt || p.createdAt || today).toString().split('T')[0],
    }));
};

const main = async () => {
  const nodes = CORE_PAGES.map(([p, priority, changefreq]) =>
    urlNode(SITE_URL + p, today, changefreq, priority)
  );

  if (WITH_PROPERTIES) {
    try {
      const props = await fetchActiveProperties();
      props.forEach((p) => {
        nodes.push(urlNode(SITE_URL + '/details/' + p.ppcId, p.lastmod, 'weekly', '0.8'));
      });
      console.log('[sitemap] included ' + props.length + ' active listings');
    } catch (err) {
      // A build must never fail because the API was unreachable — the live
      // backend sitemap still covers the listings.
      console.warn('[sitemap] could not fetch listings (' + err.message + ') — core pages only');
    }
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    nodes.join('\n') +
    '\n</urlset>\n';

  fs.writeFileSync(OUT, xml, 'utf8');
  console.log('[sitemap] wrote ' + OUT + ' (' + nodes.length + ' urls)');
};

main().catch((err) => {
  console.error('[sitemap] failed:', err);
  process.exit(1);
});
