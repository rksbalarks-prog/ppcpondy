// Every number Rent Pondy already knows — signed in, listed a property, or
// posted a tenant requirement — by its last ten digits. The New User Bot
// leaves these out (they are not new), and Campaign Report marks them as
// users rather than outsiders.

const UserLogin = require('../../user/UserModel');
const AddModel = require('../../AddModel');
const BuyerAssistance = require('../../BuyerAssistance/BuyerAssistanceModel');
const { key10 } = require('../util');

const CACHE_MS = 5 * 60000;
let cache = null;
let at = 0;

async function knownNumbersSet(fresh = false) {
  if (!fresh && cache && Date.now() - at < CACHE_MS) return cache;
  const set = new Set();
  const add = (v) => { const k = key10(v); if (k.length === 10) set.add(k); };
  const [logins, owners, tenants] = await Promise.all([
    UserLogin.distinct('phone'), AddModel.distinct('phoneNumber'), BuyerAssistance.distinct('phoneNumber'),
  ]);
  logins.forEach(add); owners.forEach(add); tenants.forEach(add);
  cache = set;
  at = Date.now();
  return set;
}

module.exports = { knownNumbersSet };
