// Who an Autobot run can reach — Rent Pondy's people, not matrimony members.
//
// PM_Matri_Admin filtered pm_registration by gender and plan. Here the people
// are spread over three collections, so a SEGMENT says which of them, and
// PLAN narrows it by whether the number has ever paid us:
//
//   all              every verified sign-in (UserLogin), not banned/deleted
//   owners           anybody with a listing (AddModel)
//   owners_active    ... with an approved (active) listing
//   owners_pending   ... with a listing waiting (pending / incomplete)
//   owners_expired   ... with an expired listing
//   no_property      signed in, never listed anything
//   tenants          anybody with a tenant requirement (BuyerAssistance)
//   tenants_active   ... with an approved requirement
//
// "Paid" is all three roads — PaymentPayU (listing, by rentId),
// PaymentPayUBuyer and PointsPayU (by phone) — because asking only the first
// calls every tenant who bought a plan "free".
//
// Every entry is a ten-digit Indian mobile, never blocked: the count on
// screen is the number of people a run will actually message.

const UserLogin = require('../../user/UserModel');
const AddModel = require('../../AddModel');
const BuyerAssistance = require('../../BuyerAssistance/BuyerAssistanceModel');
const PaymentPayU = require('../../PayU/PayUModel');
const PaymentPayUBuyer = require('../../PayuBuyer/PayuBuyerModel');
const { PointsPayU } = require('../../Points/PointsModel');
const { blocks } = require('../guards');
const U = require('../util');

const SEGMENTS = {
  all: 'Every signed-in user',
  owners: 'Owners — anyone with a listing',
  owners_active: 'Owners with an approved listing',
  owners_pending: 'Owners with a listing waiting (pending / incomplete)',
  owners_expired: 'Owners with an expired listing',
  no_property: 'Signed in, never listed a property',
  tenants: 'Tenants — anyone with a requirement',
  tenants_active: 'Tenants with an approved requirement',
};

/** The fields a template blank may be filled with. */
const FIELDS = {
  first_name: 'First name',
  full_name: 'Full name',
  mobile: 'Their mobile number',
  rent_id: 'Rent ID (latest listing)',
  ra_id: 'Tenant RA ID',
  area: 'Area (latest listing / requirement)',
};

const LIVE_STATUSES = { owners_active: ['active'], owners_pending: ['pending', 'incomplete'], owners_expired: ['expired'] };

// The lists are rebuilt at most this often: a run asks every minute, and the
// people behind a segment do not change that fast.
const CACHE_MS = 120000;
const cache = new Map();

const ten = (p) => { const k = U.key10(p); return U.isMobile10(k) ? k : ''; };

/** phone -> { name, rentId, area, since } for everybody with a listing. */
async function ownerMap(statuses) {
  const where = { isDeleted: { $ne: true }, phoneNumber: { $nin: [null, ''] } };
  if (statuses) where.status = { $in: statuses };
  const rows = await AddModel.find(where).select('phoneNumber ownerName rentId area city createdAt').sort({ createdAt: 1 }).lean();
  const m = new Map();
  for (const r of rows) {
    const k = ten(r.phoneNumber);
    if (!k) continue;
    const o = m.get(k) || { since: r.createdAt };
    // Latest listing wins for name / rent id; first one is "since".
    o.name = r.ownerName || o.name || '';
    o.rentId = r.rentId !== undefined ? r.rentId : o.rentId;
    o.area = r.area || r.city || o.area || '';
    m.set(k, o);
  }
  return m;
}

async function tenantMap(onlyActive) {
  const where = { isDeleted: { $ne: true }, phoneNumber: { $nin: [null, ''] } };
  if (onlyActive) where.ra_status = 'raActive';
  const rows = await BuyerAssistance.find(where).select('phoneNumber raName tenantName Ra_Id area city createdAt').sort({ createdAt: 1 }).lean();
  const m = new Map();
  for (const r of rows) {
    const k = ten(r.phoneNumber);
    if (!k) continue;
    const o = m.get(k) || { since: r.createdAt };
    o.name = r.tenantName || r.raName || o.name || '';
    o.raId = r.Ra_Id !== undefined ? r.Ra_Id : o.raId;
    o.area = r.area || r.city || o.area || '';
    m.set(k, o);
  }
  return m;
}

async function loginMap() {
  const rows = await UserLogin.find({ otpStatus: 'verified', status: { $nin: ['banned', 'deleted'] }, deletedDate: null })
    .select('phone loginDate createdAt').sort({ _id: 1 }).lean();
  const m = new Map();
  for (const r of rows) {
    const k = ten(r.phone);
    if (k && !m.has(k)) m.set(k, { since: r.loginDate || r.createdAt || null, name: '' });
  }
  return m;
}

/** Every number that has ever paid, by any of the three roads. */
async function paidSet() {
  const set = new Set();
  const [buyer, points, listing] = await Promise.all([
    PaymentPayUBuyer.distinct('phone', { payustatususer: 'paid', removed: { $ne: true } }),
    PointsPayU.distinct('phone', { payustatususer: 'paid' }),
    PaymentPayU.distinct('rentId', { payustatususer: 'paid', removed: { $ne: true } }),
  ]);
  for (const p of buyer) { const k = ten(p); if (k) set.add(k); }
  for (const p of points) { const k = ten(p); if (k) set.add(k); }
  if (listing.length) {
    for (const r of await AddModel.find({ rentId: { $in: listing } }).select('phoneNumber').lean()) {
      const k = ten(r.phoneNumber);
      if (k) set.add(k);
    }
  }
  return set;
}

async function build(segment) {
  if (segment === 'owners') return ownerMap(null);
  if (LIVE_STATUSES[segment]) return ownerMap(LIVE_STATUSES[segment]);
  if (segment === 'tenants') return tenantMap(false);
  if (segment === 'tenants_active') return tenantMap(true);
  const logins = await loginMap();
  if (segment === 'no_property') {
    const owners = await ownerMap(null);
    for (const k of owners.keys()) logins.delete(k);
    return logins;
  }
  // 'all': sign-ins, with names filled from listings / requirements where known.
  const [owners, tenants] = await Promise.all([ownerMap(null), tenantMap(false)]);
  for (const [k, o] of logins) {
    const ow = owners.get(k);
    const tn = tenants.get(k);
    o.name = (ow && ow.name) || (tn && tn.name) || '';
    if (ow) { o.rentId = ow.rentId; o.area = ow.area; }
    if (tn) { o.raId = tn.raId; o.area = o.area || tn.area; }
  }
  return logins;
}

/**
 * The audience: [{ phone, name, rentId, raId, area, since }], oldest first,
 * never blocked, narrowed by plan.
 */
async function list(segment, plan) {
  segment = SEGMENTS[segment] ? segment : 'all';
  plan = plan === 'paid' || plan === 'free' ? plan : '';
  const key = segment + '|' + plan;
  // The block list is applied on every read, not cached with the people: a
  // number blocked a minute ago must not still be in a run's audience.
  const blocked = await blocks.all();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.rows.filter((r) => !blocked.has(r.phone));

  const m = await build(segment);
  const paid = plan ? await paidSet() : null;
  const rows = [];
  for (const [phone, o] of m) {
    if (plan === 'paid' && !paid.has(phone)) continue;
    if (plan === 'free' && paid.has(phone)) continue;
    rows.push({ phone, name: o.name || '', rentId: o.rentId, raId: o.raId, area: o.area || '', since: o.since || null });
  }
  rows.sort((a, b) => (a.since ? new Date(a.since).getTime() : 0) - (b.since ? new Date(b.since).getTime() : 0));
  cache.set(key, { at: Date.now(), rows });
  return rows.filter((r) => !blocked.has(r.phone));
}

function forget() { cache.clear(); }

/** One person by number — a test run, or "who is this" for the form. */
async function findOne(typed) {
  const k = ten(typed);
  if (!k) return null;
  const [owner, tenant, login] = await Promise.all([
    AddModel.findOne({ phoneNumber: { $in: [k, '+91' + k, '91' + k] }, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).select('ownerName rentId area city').lean(),
    BuyerAssistance.findOne({ phoneNumber: k, isDeleted: { $ne: true } }).sort({ createdAt: -1 }).select('raName tenantName Ra_Id area city').lean(),
    UserLogin.findOne({ phone: k }).select('status otpStatus').lean(),
  ]);
  return {
    phone: k,
    name: (owner && owner.ownerName) || (tenant && (tenant.tenantName || tenant.raName)) || '',
    rentId: owner ? owner.rentId : undefined,
    raId: tenant ? tenant.Ra_Id : undefined,
    area: (owner && (owner.area || owner.city)) || (tenant && (tenant.area || tenant.city)) || '',
    known: !!(owner || tenant || login),
    blocked: await blocks.isBlocked(k),
  };
}

/** One person's value for a blank: a field name, or "text:" and a literal. */
function fieldValue(spec, p) {
  spec = String(spec || '');
  if (!spec) return '';
  if (spec.startsWith('text:')) return spec.slice(5);
  const name = String(p.name || '').replace(/\s+/g, ' ').trim();
  switch (spec) {
    case 'first_name': return name ? name.split(' ')[0] : 'there';
    case 'full_name': return name || 'there';
    case 'mobile': return p.phone ? '91' + U.key10(p.phone) : '';
    case 'rent_id': return p.rentId !== undefined && p.rentId !== null ? String(p.rentId) : '';
    case 'ra_id': return p.raId !== undefined && p.raId !== null ? String(p.raId) : '';
    case 'area': return String(p.area || '');
    default: return '';
  }
}

/**
 * Values for {{1}} {{2}} ... in order. Anything unmapped is an empty string
 * rather than dropped: Meta counts the parameters, and a short list is
 * refused outright with "(#132000) Number of parameters does not match".
 */
function varsFor(varMap, p) {
  const map = varMap && typeof varMap === 'object' ? varMap : {};
  const keys = Object.keys(map).map(Number).filter((n) => n >= 1);
  const high = keys.length ? Math.max(...keys) : 0;
  const out = [];
  for (let i = 1; i <= high; i++) out.push(fieldValue(map[String(i)], p));
  return out;
}

module.exports = { SEGMENTS, FIELDS, list, forget, findOne, fieldValue, varsFor, paidSet, ownerMap, tenantMap, loginMap };
