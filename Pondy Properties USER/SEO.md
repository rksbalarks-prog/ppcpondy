# SEO — Pondy Properties (ppcpondy.com)

What is implemented, how to verify it, and the two server-side steps that still
need someone with VPS access.

---

## 1. What was implemented

### Baseline `<head>` — `public/index.html`

The pre-JavaScript head every crawler and scraper sees. Real title and
description (was "Web site created using create-react-app"), keywords,
canonical, robots directives, geo tags for Puducherry, full Open Graph and
Twitter card tags, preconnects, and a site-wide JSON-LD graph:

- `RealEstateAgent` — name, address, phone, email, service areas, social
  profiles. This is what feeds a Google Business/knowledge panel.
- `WebSite` + `SearchAction` — enables the sitelinks search box.

A `<noscript>` block states what the site is, for the crawlers that never
execute JavaScript at all.

### Per-route `<head>` — `src/Components/RouteSeo.jsx`

Mounted once inside `<BrowserRouter>`. On every navigation it looks the
pathname up in `src/utils/seoRoutes.js` and rewrites title, description,
keywords, canonical, robots and the social tags **in place** — so there is
never a duplicate `<meta name="description">`, which is what happens if you mix
`react-helmet` output with tags already in `index.html`.

`src/utils/seoRoutes.js` holds unique, keyword-targeted copy for ~45 public
pages. **Anything not listed there is `noindex` by default.** That is
deliberate: this app has ~130 routes and the large majority are private account
screens (`/my-*`, `/leads`, payment round-trips, and URLs that carry a phone
number). A new account page added tomorrow is private until someone gives it
copy in that file.

### Per-listing `<head>` — property detail pages

`src/utils/propertySeo.js` turns one property record into:

- **Title** — `3 BHK House for Sale in Lawspet, Puducherry - 45 Lakh`
  (BHK, type, intent, place, price — front-loaded with what people search)
- **Description** — the owner's own text when it is substantial enough,
  otherwise generated from the listing's facts
- **og:image** — the listing's first real photo, so shared links preview the
  property instead of the logo
- **JSON-LD** — `RealEstateListing` with a nested `Accommodation`
  (rooms, floor size, geo coordinates) and an `Offer` carrying the INR price,
  plus a `BreadcrumbList`

Wired into both `DetailProperty.jsx` (`/details/:ppcId`) and `Details.jsx`
(`/detail/:ppcId`) via the `<Seo>` component.

### Structured data elsewhere

- `FAQ.jsx` emits a `FAQPage` graph built from the same array it renders, so
  the rich result can never drift from the visible page.

### Headings — `src/Components/SeoHeading.jsx`

The public pages are built entirely from cards and carousels and declared **no
`<h1>` at all**. Added a visually-hidden (not hidden-from-crawlers) `<h1>` to
the home page, `/all-property` and `/property-map`, using the standard clip
technique. The text states exactly what the page shows.

### `robots.txt`

Was `Disallow:` with nothing else — no sitemap, no protection for private
paths. Now allows the public site, blocks the account/payment/phone-number
routes, keeps the API out of the index while letting `Googlebot-Image` reach
`/PPC/uploads/`, throttles Ahrefs/Semrush, and points to both sitemaps.

### `manifest.json`

Was `"React App" / "Create React App Sample"` — the name Android used for the
installed PWA. Now the real name, description, brand theme colour and a
maskable icon.

### Sitemaps

Two, because they fail independently:

| URL | Source | Contents |
| --- | --- | --- |
| `https://ppcpondy.com/sitemap.xml` | `scripts/generate-sitemap.js`, run by `prebuild` | 38 static public pages |
| `https://ppcpondy.com/PPC/sitemap.xml` | `PPC/seo/sitemapRouter.js`, live from MongoDB | index → core pages + every active listing |

The live one is the important one: it is generated from the properties
collection at request time (30-minute cache), so a listing added today is
discoverable today without redeploying the frontend. It paginates at 20,000
URLs and includes each listing's photos as `<image:image>` for Google Images.

Useful endpoints:

```
GET  /PPC/seo/sitemap-status     how many listings, how many sitemap pages, cache state
POST /PPC/seo/sitemap-refresh    drop the cache (run after a bulk upload)
```

### Server-rendered listing pages — `PPC/seo/prerenderRouter.js`

**This is the piece that fixes shared links.** Googlebot does eventually render
JavaScript, but the bots that matter most for a property marketplace never do:
WhatsApp, Facebook, Twitter/X, LinkedIn and Telegram read the raw HTML once and
stop. Because the site is client-rendered, every listing shared on WhatsApp
today previews as the same generic "Pondy Properties" card.

`GET /PPC/seo/details/:ppcId` returns a complete, self-contained HTML page for
one listing — correct title, description, canonical, the actual property photo
as `og:image`, `RealEstateListing` JSON-LD, and the listing facts as real text.
It works standalone; it becomes automatic once the Apache rule in §3 is added.

```
GET /PPC/seo/preview/:ppcId    the same page plus a JSON dump — use this to
                               check what a bot will see, without a bot
```

---

## 2. Verifying it locally

```bash
cd "Pondy Properties USER"
npm run sitemap        # regenerates public/sitemap.xml
npm start              # then check <head> in devtools on a few routes
```

Things worth checking by hand:

- `/` — one `<meta name="description">`, not two
- `/details/<some-ppcId>` — title contains the BHK/type/place/price, and
  `og:image` is a real photo URL
- `/my-property` — `<meta name="robots" content="noindex, nofollow">`
- View source on `/PPC/seo/details/<ppcId>` — full HTML, no empty `<div id="root">`

Once deployed, the external validators:

- Rich results: <https://search.google.com/test/rich-results>
- Schema: <https://validator.schema.org/>
- Facebook/WhatsApp preview: <https://developers.facebook.com/tools/debug/>
- X/Twitter card: <https://cards-dev.twitter.com/validator>

---

## 3. Remaining server-side steps (needs VPS access)

### 3a. Route bots to the prerendered pages — Apache vhost

Without this, `/PPC/seo/details/:ppcId` exists but nothing sends traffic to it.
Add to the `ppcpondy.com` vhost, **before** the existing SPA fallback rewrite:

```apache
RewriteEngine On

# Link-preview and search bots asking for a property page get the
# server-rendered version; real browsers fall through to the SPA untouched.
RewriteCond %{HTTP_USER_AGENT} (facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|redditbot|Pinterest) [NC]
RewriteRule ^/?details/([0-9]+)/?$ http://127.0.0.1:5006/PPC/seo/details/$1 [P,L]

# Sitemaps at the root, proxied to the live backend generator.
RewriteRule ^/?sitemap-properties\.xml$ http://127.0.0.1:5006/PPC/sitemap-properties.xml [P,L]
```

`[P]` needs `mod_proxy` and `mod_proxy_http` enabled. Verify after reload:

```bash
curl -A "WhatsApp/2.0" https://ppcpondy.com/details/15234 | head -20   # server-rendered
curl -A "Mozilla/5.0"  https://ppcpondy.com/details/15234 | head -20   # SPA index.html
```

### 3b. Submit to Google

1. Add and verify `ppcpondy.com` in [Search Console](https://search.google.com/search-console)
   (DNS TXT record is the least fragile method).
2. Submit both sitemaps: `sitemap.xml` and `PPC/sitemap.xml`.
3. Request indexing for the home page and two or three listings to prime the crawl.
4. Set up a Google Business Profile for the Aurobindo Street office — for
   "property in Pondicherry" style searches, the local pack outranks everything
   organic, and the `RealEstateAgent` JSON-LD already matches the NAP.

---

## 4. Known limits, in priority order

1. **The city feeds are behind login.** `/pondicherry`, `/chennai` and
   `/mobileviews` redirect anonymous visitors to `/login`, so a crawler that
   follows them sees a login page — those are the URLs that would naturally rank
   for "property in Pondicherry". They are deliberately kept out of both
   sitemaps for that reason. Letting anonymous visitors browse the feed
   read-only, and asking for a phone number only at contact/offer time, is the
   single biggest available SEO win. It is a product decision, so it was not
   changed here.

2. **Share image is the logo.** `SITE.defaultImage` points at `logo512.png`,
   which previews as a small square. A purpose-built 1200×630 banner at
   `public/og-image.jpg`, then updating `SITE.defaultImage` and the two
   `og:image` tags in `index.html`, fixes every non-listing page's preview.
   (Listing pages already use a real photo.)

3. **Listing pages are only prerendered for bots that are routed there.**
   Until §3a is added, Googlebot still has to render JavaScript for
   `/details/:ppcId` — it can, but it is slower to index and burns crawl budget.

4. **`react-helmet` is still imported in ~20 files.** Only `AllProperty.jsx`
   and `PropertyMap.jsx` actually rendered it and both were migrated. The
   remaining imports are unused or on `noindex` account pages, so they are
   harmless — but if you add a `<Helmet><title>` to a public page it will fight
   `RouteSeo`. Use `<Seo>` instead.

5. **Two URLs for one listing.** `/detail/:ppcId` and `/details/:ppcId` render
   different components for the same property. Each self-canonicalises, so
   neither is penalised, but consolidating on `/details/` and 301-ing the other
   would concentrate the ranking signal.

6. **`/all-property` state is not in the URL.** Filters and sorting live in
   component state, so there is one indexable URL for every filter combination.
   Moving filters to query parameters would create rankable pages for
   "3 BHK house in Lawspet"-type searches.

---

## 5. Where things live

```
Pondy Properties USER/
  public/index.html               baseline head + site JSON-LD
  public/robots.txt               crawl rules + sitemap pointers
  public/manifest.json            PWA identity
  public/sitemap.xml              generated — do not edit by hand
  scripts/generate-sitemap.js     writes the above; runs on prebuild
  src/utils/seo.js                head upserts, defaults, schema builders
  src/utils/seoRoutes.js          route -> metadata map (edit this to add a page)
  src/utils/propertySeo.js        listing -> title/description/JSON-LD
  src/Components/Seo.jsx          declarative per-page head
  src/Components/RouteSeo.jsx     applies the route map on navigation
  src/Components/SeoHeading.jsx   visually-hidden <h1>

PPC/
  seo/sitemapRouter.js            live XML sitemaps from MongoDB
  seo/prerenderRouter.js          server-rendered listing pages for bots
```

### Adding a new public page

1. Add an entry to `PUBLIC_ROUTES` in `src/utils/seoRoutes.js` (title +
   description; without it the page is `noindex`).
2. Add the same path to `CORE_PAGES` in **both** `PPC/seo/sitemapRouter.js` and
   `scripts/generate-sitemap.js`.
3. Give the page one `<SeoHeading>`.
