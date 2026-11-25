// The two WhatsApp Flow forms the bot sends: BUYER and SELLER.
//
// A Flow is a form Meta draws inside WhatsApp and hands back in one piece
// (same idea as the Pondicherry Matrimony registration form). The JSON is
// GENERATED here rather than kept as a hand-edited file, so the values the form
// offers and the values forms.js accepts come from ONE list and cannot drift.
//
// Only the mandatory details are asked - the full Add Property / Buyer
// Assistance forms stay on the website. The SELLER form asks exactly what the
// admin's completeness gate needs (propertyMode, propertyType, price,
// totalArea, areaUnit, salesType, postedBy) plus name, city and area, so a
// submission lands in PreApproved, not Pending.
//
// Option values are the REAL distinct values in the live data (the same list
// the AI assistant's system prompt uses), not schema guesses.
//
// A published Flow cannot be edited in Meta. Changing a form means: Upload
// again from the admin page (it goes to the draft), test, Publish.

const CITIES = [
  { id: 'Pondicherry', title: 'Pondicherry' },
  { id: 'Cuddalore', title: 'Cuddalore' },
  { id: 'Villupuram', title: 'Villupuram' },
  { id: 'Chennai', title: 'Chennai' },
  { id: 'Other', title: 'Other' },
];

// Where each city sits, for the property's state / district fields.
const CITY_PLACE = {
  Pondicherry: { state: 'Puducherry', district: 'Puducherry' },
  Cuddalore: { state: 'Tamil Nadu', district: 'Cuddalore' },
  Villupuram: { state: 'Tamil Nadu', district: 'Villupuram' },
  Chennai: { state: 'Tamil Nadu', district: 'Chennai' },
};

const PROPERTY_MODES = [
  { id: 'Residential', title: 'Residential' },
  { id: 'Commercial', title: 'Commercial' },
];

const PROPERTY_TYPES = [
  'Plot', 'House', 'Independent House', 'Apartment', 'Villa', 'Land',
  'Agricultural Land', 'Farm House', 'Commercial Building', 'Guest House',
].map((t) => ({ id: t, title: t }));

const AREA_UNITS = ['Sq.ft', 'Cent', 'Acre', 'Ground', 'Sq.Meter'].map((u) => ({ id: u, title: u }));

const SALES_TYPES = [
  { id: 'New', title: 'New' },
  { id: 'Resale', title: 'Resale' },
];

const POSTED_BY = ['Owner', 'Agent', 'Developer', 'Promoter'].map((p) => ({ id: p, title: p }));

const BEDROOMS = [
  { id: '0', title: 'Not applicable (plot / land)' },
  ...['1', '2', '3', '4', '5'].map((n) => ({ id: n, title: `${n} BHK` })),
  { id: '6', title: '6+ BHK' },
];

// Buyer budget as ranges: one tap instead of two typed numbers.
const BUDGETS = [
  { id: 'b1', title: 'Under ₹20 Lakhs', min: 0, max: 2000000 },
  { id: 'b2', title: '₹20 - 40 Lakhs', min: 2000000, max: 4000000 },
  { id: 'b3', title: '₹40 - 60 Lakhs', min: 4000000, max: 6000000 },
  { id: 'b4', title: '₹60 Lakhs - 1 Crore', min: 6000000, max: 10000000 },
  { id: 'b5', title: '₹1 - 2 Crore', min: 10000000, max: 20000000 },
  { id: 'b6', title: 'Above ₹2 Crore', min: 20000000, max: 1000000000 },
];

const SCREEN = { buyer: 'BUYER', seller: 'SELLER' };
// The form's name in SmartGrowth / Meta. A PUBLISHED form cannot be changed,
// so after changing a form below, bump its _vN here: Upload then makes a new one.
const FLOW_NAMES = { buyer: 'pondyproperty_buyer_v1', seller: 'pondyproperty_seller_v1' };
const TOKEN = { buyer: 'ppbuy-', seller: 'ppsell-' };

const ds = (list) => list.map(({ id, title }) => ({ id, title }));

const dropdown = (name, label, list, required = true) => ({
  type: 'Dropdown', name, label, required, 'data-source': ds(list),
});
const radios = (name, label, list, required = true) => ({
  type: 'RadioButtonsGroup', name, label, required, 'data-source': ds(list),
});
const input = (name, label, extra = {}) => ({
  type: 'TextInput', name, label, 'input-type': 'text', required: true, ...extra,
});

const payloadOf = (names, kind) =>
  names.reduce((p, n) => ({ ...p, [n]: `\${form.${n}}` }), { pp_form: kind });

function buyerFlow() {
  const fields = [
    input('pp_name', 'Your name', { 'max-chars': 60 }),
    dropdown('pp_mode', 'Residential or Commercial', PROPERTY_MODES),
    dropdown('pp_type', 'Property type you want', PROPERTY_TYPES),
    dropdown('pp_budget', 'Your budget', BUDGETS),
    dropdown('pp_bedrooms', 'Bedrooms (optional)', BEDROOMS, false),
    dropdown('pp_city', 'City', CITIES),
    input('pp_area', 'Preferred area / locality', { 'max-chars': 60, 'helper-text': 'e.g. Lawspet, Muthialpet' }),
  ];
  return {
    version: '7.3',
    screens: [{
      id: SCREEN.buyer,
      title: 'Buy a property',
      terminal: true,
      success: true,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextHeading', text: 'What are you looking for?' },
          { type: 'TextBody', text: 'Only the main details. We will call you with matching properties.' },
          ...fields,
          {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': { name: 'complete', payload: payloadOf(fields.map((f) => f.name), 'buyer') },
          },
        ],
      },
    }],
  };
}

function sellerFlow() {
  const fields = [
    input('pp_name', 'Your name', { 'max-chars': 60 }),
    radios('pp_posted_by', 'You are the', POSTED_BY),
    dropdown('pp_mode', 'Residential or Commercial', PROPERTY_MODES),
    dropdown('pp_type', 'Property type', PROPERTY_TYPES),
    radios('pp_sales_type', 'Property is', SALES_TYPES),
    input('pp_price', 'Expected price (₹)', { 'max-chars': 20, 'helper-text': 'e.g. 4500000 or 45 lakhs or 1.2 crore' }),
    input('pp_total_area', 'Total area', { 'input-type': 'number', 'max-chars': 10 }),
    dropdown('pp_area_unit', 'Area unit', AREA_UNITS),
    dropdown('pp_bedrooms', 'Bedrooms (optional)', BEDROOMS, false),
    dropdown('pp_city', 'City', CITIES),
    input('pp_area', 'Area / locality', { 'max-chars': 60, 'helper-text': 'e.g. Lawspet, Muthialpet' }),
  ];
  return {
    version: '7.3',
    screens: [{
      id: SCREEN.seller,
      title: 'Sell your property',
      terminal: true,
      success: true,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextHeading', text: 'Tell us about your property' },
          { type: 'TextBody', text: 'Only the main details. Photos and the rest can be added later.' },
          ...fields,
          {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': { name: 'complete', payload: payloadOf(fields.map((f) => f.name), 'seller') },
          },
        ],
      },
    }],
  };
}

const flowJson = (kind) => (kind === 'buyer' ? buyerFlow() : sellerFlow());

module.exports = {
  flowJson, SCREEN, TOKEN, FLOW_NAMES,
  CITIES, CITY_PLACE, PROPERTY_MODES, PROPERTY_TYPES, AREA_UNITS, SALES_TYPES, POSTED_BY, BEDROOMS, BUDGETS,
};
