/**
 * Route -> <head> map for the public site.
 *
 * Why a central map instead of a <Seo> tag in every component: this app has
 * ~130 routes and the overwhelming majority are private account screens
 * (my-*, leads, payments, admin-ish tools) that must NEVER be indexed. Listing
 * the public pages here and defaulting everything else to `noindex` is both
 * less code and the safer default — a new account page added tomorrow is
 * private until someone deliberately gives it copy here.
 *
 * Pages whose head depends on fetched data (property details, buyer
 * assistance) render <Seo> themselves and override whatever this map applied.
 */

/**
 * Public, indexable pages. `path` is matched case-insensitively; a `:param`
 * segment matches any single segment.
 */
const PUBLIC_ROUTES = [
  {
    path: '/',
    title: 'Pondy Properties | Buy, Sell & Rent Property in Pondicherry',
    description:
      'Find houses, flats, plots, villas and commercial property for sale in ' +
      'Pondicherry and Chennai. Verified owner listings with photos, price and ' +
      'location. Post your property free on Pondy Properties.',
  },
  {
    path: '/mobileviews',
    title: 'Property Listings in Pondicherry & Chennai',
    description:
      'Browse the latest property listings in Pondicherry and Chennai — houses, ' +
      'plots, flats and land with photos, prices, area and owner details.',
  },
  {
    path: '/pondicherry',
    title: 'Property for Sale in Pondicherry (Puducherry)',
    description:
      'Houses, plots, flats and land for sale in Pondicherry. Browse verified ' +
      'Puducherry real estate listings with photos, price, area and location.',
    keywords: [
      'property in Pondicherry',
      'Pondicherry real estate',
      'houses for sale in Puducherry',
      'plots for sale in Pondicherry',
      'land for sale in Pondicherry',
    ],
  },
  {
    path: '/chennai',
    title: 'Property for Sale in Chennai',
    description:
      'Houses, flats, plots and land for sale in Chennai. Browse verified ' +
      'Chennai real estate listings with photos, price, area and location.',
    keywords: [
      'property in Chennai',
      'Chennai real estate',
      'flats for sale in Chennai',
      'plots for sale in Chennai',
      'houses for sale in Chennai',
    ],
  },
  {
    path: '/chennai-property',
    title: 'Chennai Properties for Sale',
    description:
      'Every Chennai property currently listed on Pondy Properties — flats, ' +
      'independent houses, plots and land, with price and location details.',
  },
  {
    path: '/py-property',
    title: 'Pondicherry Properties for Sale',
    description:
      'Every Pondicherry (Puducherry) property currently listed on Pondy ' +
      'Properties — houses, plots, flats and agricultural land.',
  },
  {
    path: '/all-property',
    title: 'All Properties for Sale in Pondicherry & Chennai',
    description:
      'The complete Pondy Properties listing feed. Filter by property type, ' +
      'budget, area and location to find your next house, plot or flat.',
  },
  {
    path: '/sale-property',
    title: 'Properties for Sale',
    description:
      'Residential and commercial properties for sale in Pondicherry and ' +
      'Chennai, listed with photos, price, total area and owner contact.',
  },
  {
    path: '/new-property',
    title: 'Newly Listed Properties',
    description:
      'The newest properties added to Pondy Properties. See fresh houses, ' +
      'plots and flats in Pondicherry and Chennai before anyone else.',
  },
  {
    path: '/feature-property',
    title: 'Featured Properties in Pondicherry',
    description:
      'Hand-picked featured properties in Pondicherry and Chennai — premium ' +
      'houses, plots and flats highlighted by Pondy Properties.',
  },
  {
    path: '/most-viewed',
    title: 'Most Viewed Properties',
    description:
      'The properties buyers are looking at most on Pondy Properties this ' +
      'week, across Pondicherry and Chennai.',
  },
  {
    path: '/house-below',
    title: 'Houses Below 30 Lakh in Pondicherry',
    description:
      'Budget houses for sale under Rs.30 lakh in Pondicherry and Chennai. ' +
      'Compare price, area and location on Pondy Properties.',
    keywords: [
      'houses below 30 lakh in Pondicherry',
      'cheap houses in Puducherry',
      'budget homes Pondicherry',
    ],
  },
  {
    path: '/house-average',
    title: 'Houses Between 30 Lakh and 50 Lakh',
    description:
      'Mid-budget houses for sale from Rs.30 lakh to Rs.50 lakh in Pondicherry ' +
      'and Chennai, with photos, area and owner details.',
  },
  {
    path: '/plot-below',
    title: 'Plots Below 15 Lakh in Pondicherry',
    description:
      'Affordable residential plots for sale under Rs.15 lakh in Pondicherry. ' +
      'Compare plot size, approval status and location.',
    keywords: [
      'plots below 15 lakh Pondicherry',
      'cheap plots in Puducherry',
      'residential plots Pondicherry',
    ],
  },
  {
    path: '/land-property',
    title: 'Agricultural Land for Sale in Pondicherry',
    description:
      'Agricultural and farm land for sale in Pondicherry and nearby districts, ' +
      'with total area, price and location details.',
  },
  {
    path: '/loan-property',
    title: 'Bank Loan Approved Properties',
    description:
      'Properties eligible for bank loan in Pondicherry and Chennai. Browse ' +
      'loan-approved houses, flats and plots on Pondy Properties.',
  },
  {
    path: '/property-map',
    title: 'Property Map — Pondicherry & Chennai',
    description:
      'See every listed property on the map. Explore Pondicherry and Chennai ' +
      'real estate by locality, street and neighbourhood.',
  },
  {
    path: '/sort/property-with-location',
    title: 'Properties With Map Location',
    description:
      'Listings that include an exact map location, so you can check the ' +
      'street and neighbourhood before you visit.',
  },
  {
    path: '/sort/bank-loan',
    title: 'Bank Loan Eligible Properties',
    description:
      'Properties where the owner has confirmed bank loan eligibility, in ' +
      'Pondicherry and Chennai.',
  },
  {
    path: '/sort/house-below-30L',
    title: 'Houses Under 30 Lakh',
    description:
      'Every house listed under Rs.30 lakh on Pondy Properties, sorted and ' +
      'ready to compare.',
  },
  {
    path: '/sort/house-30L-50L',
    title: 'Houses From 30 Lakh to 50 Lakh',
    description:
      'Houses priced between Rs.30 lakh and Rs.50 lakh in Pondicherry and ' +
      'Chennai.',
  },
  {
    path: '/sort/plot-below-15L',
    title: 'Plots Under 15 Lakh',
    description:
      'Residential plots listed under Rs.15 lakh in Pondicherry and Chennai.',
  },
  {
    path: '/sort/agricultural-land',
    title: 'Agricultural Land Listings',
    description:
      'Farm and agricultural land for sale, listed with acreage, price and ' +
      'location.',
  },
  {
    path: '/sort/low-to-high',
    title: 'Properties by Price: Low to High',
    description:
      'All listings sorted from the lowest price up — the quickest way to find ' +
      'a property inside your budget.',
  },
  {
    path: '/sort/high-to-low',
    title: 'Properties by Price: High to Low',
    description:
      'Premium and high-value properties in Pondicherry and Chennai, sorted by ' +
      'price from highest down.',
  },
  {
    path: '/sort/new-to-old',
    title: 'Latest Property Listings First',
    description:
      'Every property sorted newest first, so you see today’s listings before ' +
      'older ones.',
  },
  {
    path: '/sort/with-image',
    title: 'Properties With Photos',
    description:
      'Only listings that include real photos of the property, so you can see ' +
      'what you are visiting.',
  },
  {
    path: '/about',
    title: 'About Pondy Properties',
    description:
      'Pondy Properties is Puducherry’s local property marketplace, connecting ' +
      'owners and buyers directly since day one. Learn who we are and how we work.',
  },
  {
    path: '/contact-web',
    title: 'Contact Us',
    description:
      'Contact Pondy Properties — No.89, Aurobindo Street, M.G Road Junction, ' +
      'Puducherry 605001. Call +91 91505 24409 or email inf.ppcpdy@gmail.com.',
  },
  {
    path: '/contactus',
    title: 'Contact Pondy Properties',
    description:
      'Get in touch with the Pondy Properties team for help with listing, ' +
      'buying or verifying a property in Puducherry.',
  },
  {
    path: '/our-support',
    title: 'Our Support Services',
    description:
      'How Pondy Properties supports buyers and owners — listing help, ' +
      'verification, site visits and documentation guidance.',
  },
  {
    path: '/business',
    title: 'Business Opportunity',
    description:
      'Partner with Pondy Properties. Franchise, agent and business ' +
      'opportunities in the Puducherry and Chennai property market.',
  },
  {
    path: '/Frequently-Asked-Questions',
    title: 'Frequently Asked Questions',
    description:
      'Answers about listing a property, contacting owners, plans, payments ' +
      'and account management on Pondy Properties.',
  },
  {
    path: '/Pricing-Plan',
    title: 'Pricing Plans for Property Owners',
    description:
      'Compare Pondy Properties plans for owners and agents — listing limits, ' +
      'featured ads, validity and price.',
  },
  {
    path: '/plans',
    title: 'Property Listing Plans',
    description:
      'Choose a Pondy Properties plan to list and promote your property in ' +
      'Pondicherry and Chennai.',
  },
  {
    path: '/buyer-plan',
    title: 'Buyer Plans',
    description:
      'Buyer plans on Pondy Properties — unlock owner contacts, saved searches ' +
      'and property assistance.',
  },
  {
    path: '/points-plans',
    title: 'Points Plans',
    description:
      'Buy points to view owner contact details and unlock premium listings on ' +
      'Pondy Properties.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description:
      'How Pondy Properties collects, uses and protects your personal data.',
  },
  {
    path: '/privacy-web',
    title: 'Privacy Policy',
    description:
      'How Pondy Properties collects, uses and protects your personal data.',
  },
  {
    path: '/terms-conditions',
    title: 'Terms and Conditions',
    description:
      'The terms governing the use of the Pondy Properties website and app.',
  },
  {
    path: '/terms-conditions-web',
    title: 'Terms and Conditions',
    description:
      'The terms governing the use of the Pondy Properties website and app.',
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy',
    description:
      'Refund and cancellation policy for Pondy Properties plans and paid ' +
      'listings.',
  },
  {
    path: '/RefundPolicy',
    title: 'Refund Policy',
    description:
      'Refund and cancellation policy for Pondy Properties plans and paid ' +
      'listings.',
  },
  {
    path: '/shiping-delivery',
    title: 'Shipping and Delivery Policy',
    description:
      'Service delivery terms for Pondy Properties plans and digital services.',
  },
  {
    path: '/groom',
    title: 'Groom Profiles',
    description:
      'Groom profiles listed by Pondy Classifieds. Browse verified matrimony ' +
      'profiles from Puducherry and Tamil Nadu.',
  },
  {
    path: '/bride',
    title: 'Bride Profiles',
    description:
      'Bride profiles listed by Pondy Classifieds. Browse verified matrimony ' +
      'profiles from Puducherry and Tamil Nadu.',
  },
];

/**
 * Pages that exist for a real person mid-task (checkout, OTP return trips,
 * app-embedded policy screens). They are reachable but pointless in search,
 * and some carry a phone number in the URL — always noindex.
 *
 * Everything not in PUBLIC_ROUTES is noindexed anyway; these are listed only
 * so they still get a sensible title in the browser tab and share sheet.
 */
const PRIVATE_ROUTES = [
  { path: '/login', title: 'Login' },
  { path: '/login/:city', title: 'Login' },
  { path: '/web-login', title: 'Login' },
  { path: '/my-property', title: 'My Properties' },
  { path: '/my', title: 'My Properties' },
  { path: '/my-plan', title: 'My Plan' },
  { path: '/my-profile/:phoneNumber', title: 'My Profile' },
  { path: '/notification', title: 'Notifications' },
  { path: '/leads', title: 'Leads Centre' },
  { path: '/add-form', title: 'Post a Property' },
  { path: '/add-property/:phoneNumber', title: 'Post a Property' },
  { path: '/payment-success', title: 'Payment Successful' },
  { path: '/payment-failure', title: 'Payment Failed' },
  { path: '/about-mobile', title: 'About Pondy Properties' },
  { path: '/refund-mobile', title: 'Refund Policy' },
  { path: '/shiping-delivery-app', title: 'Shipping and Delivery Policy' },
];

/** Normalise a pathname: lower-case, no trailing slash (except root). */
const normalise = (pathname) => {
  const p = String(pathname || '/').toLowerCase();
  const noSlash = p.length > 1 ? p.replace(/\/+$/, '') : p;
  return noSlash || '/';
};

/** Does `pattern` (which may contain :params) match `pathname`? */
const matches = (pattern, pathname) => {
  const a = normalise(pattern).split('/');
  const b = normalise(pathname).split('/');
  if (a.length !== b.length) return false;
  return a.every((seg, i) => seg.startsWith(':') || seg === b[i]);
};

/**
 * Look up the head config for a pathname.
 * Returns `{ title, description, keywords, path, noindex }` — never null.
 */
export const seoForPath = (pathname) => {
  const path = normalise(pathname);

  const pub = PUBLIC_ROUTES.find((r) => matches(r.path, path));
  if (pub) {
    // Canonicalise to the declared spelling, not the visited one. React Router
    // matches case-insensitively and tolerates a trailing slash, so /About/,
    // /about and /ABOUT all render this page — they must all point at one URL,
    // and it has to be the exact spelling used in the sitemap.
    return { ...pub, noindex: false };
  }

  const priv = PRIVATE_ROUTES.find((r) => matches(r.path, path));
  if (priv) {
    return { ...priv, path, noindex: true };
  }

  // Unknown route: keep it out of the index, but still give it a real title.
  return { title: null, description: null, path, noindex: true };
};

/**
 * Routes whose head is produced by the page itself once its data arrives.
 * RouteSeo skips these so it never overwrites a freshly-built listing head
 * with a generic one.
 */
const DATA_DRIVEN = ['/details/:id', '/detail/:id', '/detail-buyer-assistance/:id'];

export const isDataDrivenRoute = (pathname) =>
  DATA_DRIVEN.some((p) => matches(p, pathname));

export const PUBLIC_ROUTE_PATHS = PUBLIC_ROUTES.map((r) => r.path);

export default seoForPath;
