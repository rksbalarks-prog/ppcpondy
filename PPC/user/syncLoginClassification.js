// One-time sync: copy each phone's admin remark & conversion status onto all of
// its UserLogin records. There is one record per login, and before the fix a
// re-login started blank. Run from the PPC directory:
//
//   node user/syncLoginClassification.js          dry run: count what would change
//   node user/syncLoginClassification.js --live   write the changes
//
// Uses MONGO_URI from .env, like the server. Safe to re-run.

require('dotenv').config();
const mongoose = require('mongoose');
const UserLogin = require('./UserModel');

const live = process.argv.includes('--live');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const phones = (await UserLogin.distinct('phone')).filter(Boolean);
    let phonesChanged = 0;
    let recordsChanged = 0;

    for (const phone of phones) {
      const classification = await UserLogin.getClassification(phone);
      const stale = [];
      if (classification.remarks) stale.push({ remarks: { $ne: classification.remarks } });
      if (classification.conversionStatus) {
        stale.push({ conversionStatus: { $ne: classification.conversionStatus } });
      }
      if (!stale.length) continue;

      const filter = { phone, $or: stale };
      const count = await UserLogin.countDocuments(filter);
      if (!count) continue;

      phonesChanged += 1;
      recordsChanged += count;
      if (live) await UserLogin.updateMany(filter, { $set: classification });
    }

    console.log(
      `${live ? 'Updated' : 'Would update'} ${recordsChanged} login records ` +
      `across ${phonesChanged} of ${phones.length} phones.`
    );
    if (!live && recordsChanged) console.log('Re-run with --live to apply.');
  } finally {
    await mongoose.disconnect();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
