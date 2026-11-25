// A submitted Buyer / Seller form -> the record the website itself would make.
//
// Values are checked against the SAME lists the form offers (flows.js), so a
// hand-crafted or stale submission can never write a value the app does not
// know. Nothing here writes to the database - bot.js hands the result to the
// app's own endpoints.

const F = require('./flows');

const clean = (v, max = 80) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, max));
const pick = (v, list) => {
  const id = clean(v);
  return list.some((o) => o.id === id) ? id : '';
};

/** "4500000" / "45 lakhs" / "45L" / "1.2 crore" / "₹45,00,000" -> 4500000 */
function parsePrice(value) {
  const s = String(value == null ? '' : value).toLowerCase().replace(/[,₹\s]/g, '').replace(/rs\.?/g, '');
  const num = parseFloat((s.match(/\d+(?:\.\d+)?/) || [])[0]);
  if (!Number.isFinite(num) || num <= 0) return null;
  let amount = num;
  if (/(crore|cr)/.test(s)) amount = num * 10000000;
  else if (/(lakh|lac|\d+(\.\d+)?l$)/.test(s)) amount = num * 100000;
  else if (/(thousand|\d+(\.\d+)?k$)/.test(s)) amount = num * 1000;
  amount = Math.round(amount);
  return amount >= 1000 && amount <= 10000000000 ? amount : null;
}

const ten = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

/** Which form this is: the flow_token the bot opened it with, else the static pp_form field. */
function kindOf(form) {
  const token = clean(form.flow_token, 60);
  if (token.startsWith(F.TOKEN.buyer)) return 'buyer';
  if (token.startsWith(F.TOKEN.seller)) return 'seller';
  if (form.pp_form === 'buyer' || form.pp_form === 'seller') return form.pp_form;
  return null;
}

/** -> { ok, missing[], body } for POST /PPC/add-buyerAssistance */
function toBuyerRequest(form, phone) {
  const budget = F.BUDGETS.find((b) => b.id === clean(form.pp_budget));
  const v = {
    baName: clean(form.pp_name, 60),
    propertyMode: pick(form.pp_mode, F.PROPERTY_MODES),
    propertyType: pick(form.pp_type, F.PROPERTY_TYPES),
    city: pick(form.pp_city, F.CITIES),
    area: clean(form.pp_area, 60),
  };
  const missing = Object.keys(v).filter((k) => !v[k]);
  if (!budget) missing.push('budget');
  const bedrooms = pick(form.pp_bedrooms, F.BEDROOMS);
  const place = F.CITY_PLACE[v.city] || {};
  return {
    ok: missing.length === 0,
    missing,
    body: {
      ...v,
      phoneNumber: ten(phone),
      minPrice: budget ? String(budget.min) : '',
      maxPrice: budget ? String(budget.max) : '',
      ...(bedrooms && bedrooms !== '0' ? { bedrooms } : {}),
      ...(place.state ? { state: place.state } : {}),
      ba_postBy: 'User',
      addedBy: 'WhatsApp Bot',
      addedAt: new Date(),
      description: `WhatsApp form: ${budget ? budget.title : ''}`.trim(),
    },
  };
}

/** -> { ok, missing[], row, base } for POST /PPC/bulk-upload-properties */
function toSellerRow(form, phone) {
  const v = {
    ownerName: clean(form.pp_name, 60),
    postedBy: pick(form.pp_posted_by, F.POSTED_BY),
    propertyMode: pick(form.pp_mode, F.PROPERTY_MODES),
    propertyType: pick(form.pp_type, F.PROPERTY_TYPES),
    salesType: pick(form.pp_sales_type, F.SALES_TYPES),
    areaUnit: pick(form.pp_area_unit, F.AREA_UNITS),
    city: pick(form.pp_city, F.CITIES),
    area: clean(form.pp_area, 60),
  };
  const missing = Object.keys(v).filter((k) => !v[k]);
  const price = parsePrice(form.pp_price);
  if (!price) missing.push('price');
  const totalArea = Number(String(form.pp_total_area || '').replace(/[^\d.]/g, ''));
  if (!(totalArea > 0)) missing.push('totalArea');
  const bedrooms = pick(form.pp_bedrooms, F.BEDROOMS);
  const place = F.CITY_PLACE[v.city] || {};
  return {
    ok: missing.length === 0,
    missing,
    base: v.city === 'Chennai' ? 'CH' : 'PY',
    row: {
      ...v,
      salesMode: 'Sale',
      price: price || 0,
      totalArea: totalArea > 0 ? totalArea : 0,
      ...(bedrooms ? { bedrooms } : {}),
      country: 'India',
      ...(place.state ? { state: place.state, district: place.district } : {}),
      phoneNumber: ten(phone),
      description: `${v.propertyType} for sale in ${v.area}${v.city && v.city !== 'Other' ? ', ' + v.city : ''} (via WhatsApp)`,
    },
  };
}

module.exports = { kindOf, toBuyerRequest, toSellerRow, parsePrice, ten };
