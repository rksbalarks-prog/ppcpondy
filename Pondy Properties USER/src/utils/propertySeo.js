/**
 * Turns one property record (the `user` object returned by
 * /fetch-data-on-demand) into a search-ready title, description, share image
 * and schema.org graph.
 *
 * Kept separate from `seo.js` so the generic head helpers stay reusable and
 * the listing-specific wording lives in one place — change a phrase here and
 * every property page, share card and rich result follows.
 */

import { SITE, absoluteUrl, clampDescription, buildBreadcrumb } from './seo';

/** Photos are stored as relative paths under the backend's /PPC root. */
export const propertyImageUrls = (property) => {
  const photos = (property && property.photos) || [];
  const urls = photos
    .map((p) =>
      String(p || '')
        .replace(/\\/g, '/')
        // Windows-written paths arrive with doubled separators; a doubled
        // slash in an og:image URL is a 404 on some CDNs, so collapse them.
        .replace(/\/{2,}/g, '/')
        .replace(/^\/+/, '')
        .trim()
    )
    .filter(Boolean)
    .map((p) => (/^https?:\/\//i.test(p) ? p : SITE.url + '/PPC/' + p));
  return Array.from(new Set(urls));
};

/** "45 Lakh" / "1.2 Crore" / "85,00,000" — short enough for a <title>. */
export const formatIndianPrice = (value) => {
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
  return new Intl.NumberFormat('en-IN').format(n);
};

/** Most specific human-readable locality we can build from the address parts. */
export const propertyLocation = (property = {}) => {
  const parts = [
    property.area,
    property.nagar,
    property.city,
    property.district,
  ]
    .map((p) => String(p || '').trim())
    .filter(Boolean);
  // Drop repeats such as city === district ("Puducherry, Puducherry").
  const seen = new Set();
  const unique = parts.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.slice(0, 2).join(', ');
};

/**
 * "3 BHK House for Sale in Lawspet, Puducherry - 45 Lakh"
 * Front-loads the terms people actually search for: BHK, type, intent, place.
 */
export const propertyTitle = (property = {}) => {
  const bits = [];
  const beds = String(property.bedrooms || '').trim();
  if (beds && /^\d+$/.test(beds)) bits.push(beds + ' BHK');
  else if (beds) bits.push(beds);

  const type = String(property.propertyType || 'Property').trim();
  bits.push(type);

  const mode = String(property.propertyMode || '').trim();
  bits.push(mode ? 'for ' + mode : 'for Sale');

  const place = propertyLocation(property);
  if (place) bits.push('in ' + place);

  const head = bits.join(' ');
  const price = property.onDemand ? '' : formatIndianPrice(property.price);
  return price ? head + ' - ' + price : head;
};

/** Meta description: the owner's words when usable, else generated facts. */
export const propertyDescription = (property = {}) => {
  const own = clampDescription(property.description, 155);
  if (own && own.length >= 70) return own;

  const facts = [];
  const beds = String(property.bedrooms || '').trim();
  if (beds) facts.push(beds + ' BHK');
  if (property.propertyType) facts.push(String(property.propertyType));
  if (property.totalArea) {
    facts.push(
      String(property.totalArea) + ' ' + String(property.areaUnit || 'sq.ft')
    );
  }
  if (property.facing) facts.push(String(property.facing) + ' facing');
  if (String(property.bankLoan || '').toLowerCase() === 'yes') {
    facts.push('bank loan available');
  }
  if (property.propertyApproved) facts.push(String(property.propertyApproved) + ' approved');

  const place = propertyLocation(property);
  const price = property.onDemand ? 'Price on request' : formatIndianPrice(property.price);

  const sentence =
    (facts.length ? facts.join(', ') : 'Property') +
    (place ? ' in ' + place : '') +
    (price ? '. ' + (property.onDemand ? price : 'Price ' + price) : '') +
    '. PPC ID ' + (property.ppcId || '') +
    '. View photos, location and owner contact on Pondy Properties.';

  return clampDescription(sentence, 160);
};

/** Keyword set built from the listing's own attributes. */
export const propertyKeywords = (property = {}) => {
  const type = String(property.propertyType || 'property').toLowerCase();
  const mode = String(property.propertyMode || 'sale').toLowerCase();
  const place = propertyLocation(property) || 'Pondicherry';
  const beds = String(property.bedrooms || '').trim();
  const out = [
    type + ' for ' + mode + ' in ' + place,
    type + ' in ' + place,
    'property for ' + mode + ' in ' + place,
    'real estate ' + place,
    'Pondy Properties',
  ];
  if (beds) out.unshift(beds + ' BHK ' + type + ' in ' + place);
  return out;
};

/**
 * schema.org graph for a listing. `RealEstateListing` is the type Google
 * documents for property pages; the nested `Product`/`Offer` carries the price
 * so the result can show it, and `Accommodation` carries rooms/area.
 */
export const propertyJsonLd = (property = {}, canonicalPath) => {
  const images = propertyImageUrls(property);
  const url = absoluteUrl(canonicalPath || '/details/' + property.ppcId);
  const price = Number(property.price) || 0;
  const place = propertyLocation(property);

  const graph = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': url,
    url,
    name: propertyTitle(property),
    description: propertyDescription(property),
    ...(images.length ? { image: images.slice(0, 8) } : {}),
    ...(property.createdAt ? { datePosted: new Date(property.createdAt).toISOString() } : {}),
    ...(property.ppcId ? { identifier: String(property.ppcId) } : {}),
    provider: {
      '@type': 'RealEstateAgent',
      name: SITE.name,
      url: SITE.url,
      telephone: SITE.phone,
    },
  };

  const address = {
    '@type': 'PostalAddress',
    ...(property.streetName ? { streetAddress: String(property.streetName) } : {}),
    addressLocality: String(property.city || property.district || 'Puducherry'),
    addressRegion: String(property.state || 'Puducherry'),
    ...(property.pinCode ? { postalCode: String(property.pinCode) } : {}),
    addressCountry: 'IN',
  };

  const coords = property.locationCoordinates || {};
  const lat = Number(coords.latitude || coords.lat);
  const lng = Number(coords.longitude || coords.lng);

  graph.about = {
    '@type': 'Accommodation',
    name: propertyTitle(property),
    address,
    ...(lat && lng
      ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } }
      : {}),
    ...(property.bedrooms && /^\d+$/.test(String(property.bedrooms))
      ? { numberOfRooms: Number(property.bedrooms) }
      : {}),
    ...(property.totalArea
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: Number(property.totalArea) || String(property.totalArea),
            unitText: String(property.areaUnit || 'SQFT'),
          },
        }
      : {}),
  };

  if (price > 0 && !property.onDemand) {
    graph.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
      ...(place ? { areaServed: place } : {}),
    };
  }

  return graph;
};

/** Breadcrumb trail shown in Google results for a listing. */
export const propertyBreadcrumb = (property = {}, canonicalPath) => {
  const city = String(property.city || property.district || 'Pondicherry').trim();
  const type = String(property.propertyType || 'Property').trim();
  return buildBreadcrumb([
    { name: 'Home', path: '/' },
    { name: 'Properties in ' + city, path: '/all-property' },
    { name: type + ' - PPC ' + (property.ppcId || ''), path: canonicalPath },
  ]);
};

/** Everything a detail page needs, in one call. */
export const buildPropertySeo = (property, canonicalPath) => {
  if (!property) return null;
  const path = canonicalPath || '/details/' + property.ppcId;
  const images = propertyImageUrls(property);
  return {
    title: propertyTitle(property),
    description: propertyDescription(property),
    keywords: propertyKeywords(property),
    path,
    image: images[0] || SITE.defaultImage,
    type: 'article',
    jsonLd: [propertyJsonLd(property, path), propertyBreadcrumb(property, path)],
  };
};
