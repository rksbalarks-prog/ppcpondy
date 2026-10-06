// Re-checks an Adexpress batch that is already live against the CURRENT rules,
// and repairs what those rules have since learned to do better:
//
//   1. takes down rows the current reader rejects as not property at all (job
//      ads, businesses for sale). It goes through the app's own PUT
//      /admin-delete with a reason — the same thing the admin's delete button
//      does — so each one shows in the admin's deleted list and can be restored;
//   2. re-resolves area + pincode where the import left the area blank or filed
//      it on the bare-city fallback (White Town), so area search can find it;
//   3. sets onDemand where the ad printed no price, so the cards read
//      "On Demand" instead of "N/A".
//
// A row someone has edited since the import is left alone: area is only
// rewritten while it is still blank or on the White Town fallback.
//
// Dry run unless --apply is given. Run from the backend folder (it reads .env
// from there), with the server up — step 1 calls the running app:
//
//   node AdExpress/repairBatch.js BULK-1791198566558-538905
//   node AdExpress/repairBatch.js BULK-1791198566558-538905 --apply

const config = require('./config');
const { extractFields } = require('./fields');
const locality = require('./locality');

const DELETE_REASON = 'Adexpress import: not a property ad (job / business for sale)';
const FALLBACK = { area: 'White Town', pinCode: 605001 };

/**
 * What to do with one published row. Pure — no I/O — so it can be checked
 * against downloaded data before anything is applied.
 * @returns {{takeDown: boolean, set: object, unset: object, counts: object, log: string[]}}
 */
function planRepair(ad, row) {
  const tag = `#${row.ppcId}`;
  const plan = { takeDown: false, set: {}, unset: {}, counts: {}, log: [] };

  // 1. Not a property ad at all.
  if (!extractFields(ad.rawText || '')) {
    plan.takeDown = true;
    const text = String(ad.headline || ad.rawText || '').replace(/\s+/g, ' ').slice(0, 70);
    plan.log.push(`${tag}  TAKE DOWN  ${text}`);
    return plan;
  }

  // 2. Area + pincode, only while still untouched since the import.
  const untouched =
    !row.area || (row.area === FALLBACK.area && Number(row.pinCode) === FALLBACK.pinCode);
  if (untouched) {
    const hit = locality.resolveNamedArea(ad.locality, ad.address, ad.rawText);
    if (hit && (hit.area !== row.area || Number(hit.pinCode) !== Number(row.pinCode))) {
      plan.set.area = hit.area;
      if (hit.pinCode) plan.set.pinCode = Number(hit.pinCode);
      plan.counts.areaFixed = 1;
      plan.log.push(`${tag}  AREA       ${row.area || '(blank)'} -> ${hit.area} ${hit.pinCode || ''}`);
    } else if (!hit && row.area === FALLBACK.area) {
      // Filed under White Town only because the ad said "Pondicherry".
      plan.set.area = ad.locality || '';
      plan.unset.pinCode = '';
      plan.counts.areaCleared = 1;
      plan.log.push(`${tag}  AREA       White Town -> (blank): the ad names no area this app knows`);
    }
  }

  // 3. No printed price -> the app's own "On Demand".
  if (ad.rentAmount == null && !row.onDemand && !Number(row.price)) {
    plan.set.onDemand = true;
    plan.counts.onDemand = 1;
  }

  return plan;
}

async function main() {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const { AdExpressAd } = require('./AdExpressModel');
  const AddModel = require('../AddModel');

  const bulkUploadId = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!bulkUploadId || !bulkUploadId.startsWith('BULK-')) {
    console.error('usage: node AdExpress/repairBatch.js <BULK-id> [--apply]');
    process.exit(2);
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const ads = await AdExpressAd.find({ bulkUploadId, importedListingId: { $ne: null } }).lean();
    const listings = await AddModel.collection.find({ bulkUploadId }).toArray();
    const byPpcId = new Map(listings.map((l) => [l.ppcId, l]));

    // Prime the gazetteer the way publish.js does, minus this batch's own rows.
    const pairs = await AddModel.collection
      .find(
        {
          bulkUploadId: { $ne: bulkUploadId },
          pinCode: { $nin: [null, ''] },
          area: { $nin: [null, '', 'undefined'] },
        },
        { projection: { area: 1, pinCode: 1 } }
      )
      .toArray();
    locality.learn(pairs);

    console.log(
      `${apply ? 'APPLYING' : 'DRY RUN'} — batch ${bulkUploadId}: ` +
        `${ads.length} ads, ${listings.length} listings`
    );
    const done = { takenDown: 0, areaFixed: 0, areaCleared: 0, onDemand: 0, skipped: 0 };

    for (const ad of ads.sort((a, b) => a.importedListingId - b.importedListingId)) {
      const row = byPpcId.get(ad.importedListingId);
      if (!row || row.isDeleted || row.status === 'delete') {
        done.skipped += 1;
        continue;
      }

      const plan = planRepair(ad, row);
      for (const line of plan.log) console.log(line);

      if (plan.takeDown) {
        if (apply) {
          const res = await fetch(`${config.apiBase}/admin-delete?ppcId=${row.ppcId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deletionReason: DELETE_REASON }),
          });
          if (!res.ok) throw new Error(`#${row.ppcId}: admin-delete answered HTTP ${res.status}`);
        }
        done.takenDown += 1;
        continue;
      }

      for (const k of Object.keys(plan.counts)) done[k] += plan.counts[k];
      const update = {};
      if (Object.keys(plan.set).length) update.$set = plan.set;
      if (Object.keys(plan.unset).length) update.$unset = plan.unset;
      if (apply && Object.keys(update).length) {
        await AddModel.collection.updateOne({ _id: row._id, bulkUploadId }, update);
      }
    }

    console.log(
      `\n${apply ? 'Done' : 'Would do'}: ${done.takenDown} taken down, ${done.areaFixed} areas fixed, ` +
        `${done.areaCleared} wrong White Town cleared, ${done.onDemand} set On Demand` +
        (done.skipped ? `, ${done.skipped} skipped (already deleted / missing)` : '')
    );
    if (!apply) console.log('Nothing was written. Re-run with --apply to make these changes.');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('repairBatch failed:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { planRepair };
