// Publishes staged ads into the live app, and gives each one a picture.
//
// Shared by the Import button on the admin screen and by the nightly cron, so
// both behave identically. Three steps:
//
//   1. shape each ad into a bulk-upload row, filling the handful of fields a
//      newspaper ad never states so the row can land in PreApproved;
//   2. hand the rows to the app's OWN POST /PPC/bulk-upload-properties — same
//      Rent-ID allocation, same completeness gate, same revertable batch;
//   3. draw a details card for each new property and attach it as the photo.
//
// Step 3 writes `photos` directly onto the rows this batch just created, keyed
// by their bulkUploadId. That is the one direct write in the module and it is
// deliberately narrow: the bulk endpoint has no photo field, and putting a
// partial payload through the big edit route risks side effects on fields it
// also owns.
//
// The card is drawn, never the newspaper crop — the crop shows the owner's
// phone number, and the app charges points to reveal a contact.

const fsp = require('fs/promises');
const path = require('path');

const config = require('./config');
const { toBulkUploadRow } = require('./normalize');
const { renderPropertyCard } = require('./cardImage');
const { AdExpressAd } = require('./AdExpressModel');
const AddModel = require('../AddModel');

/**
 * The fields the completeness gate in /bulk-upload-properties insists on, that
 * a classified ad routinely leaves out. Filling them is what puts a row in
 * PreApproved instead of Pending — so they are placeholders, not invention: a
 * 0 area says plainly that the paper did not print one, and the drawn card
 * simply omits the row rather than claiming a figure.
 *
 * This app's mandatory set is propertyMode, propertyType, price, totalArea,
 * areaUnit, salesType and postedBy. price defaults to 0 in the schema, so it
 * always counts as present.
 */
function completenessDefaults() {
  return {
    postedBy: config.publishDefaults.postedBy,
    salesType: config.publishDefaults.salesType,
    areaUnit: config.publishDefaults.areaUnit,
    totalArea: 0,
  };
}

/**
 * Build the rows to send. `forcePreApproved` fills the gaps; without it a row
 * that the ad left incomplete drops to Pending, which is the safer default for
 * anyone who would rather see the holes.
 */
function buildRows(ads, { defaults = {}, forcePreApproved = true } = {}) {
  return ads.map((ad) => {
    const filled = forcePreApproved ? { ...completenessDefaults(), ...defaults } : { ...defaults };
    return toBulkUploadRow(ad, filled);
  });
}

/** Draw one card and write it where the app keeps property photos. */
async function writeCard(ad, ppcId) {
  const dir = config.photoDir;
  await fsp.mkdir(dir, { recursive: true });
  const fileName = `adexpress-${ppcId}-${Date.now()}.jpg`;
  const filePath = path.join(dir, fileName);
  await fsp.writeFile(filePath, renderPropertyCard(ad, { brand: config.publishDefaults.brand }));
  // Stored the way every other property photo is: a path relative to the
  // backend's working directory.
  return path.join('uploads', fileName);
}

/**
 * Publish a set of staged ads.
 *
 * @param {Array} ads              staged ad documents (already vetted by the caller)
 * @param {object} options         { base, defaults, addedBy, addedByRole, forcePreApproved, trigger }
 * @returns {Promise<object>}      what the bulk endpoint said, plus card counts
 */
async function publishAds(ads, options = {}) {
  if (!ads.length) return { insertedCount: 0, message: 'Nothing to publish.' };

  const base = String(options.base || config.defaultBase).toUpperCase() === 'CH' ? 'CH' : 'PY';
  const forcePreApproved =
    options.forcePreApproved === undefined ? config.forcePreApproved : !!options.forcePreApproved;
  const rows = buildRows(ads, { defaults: options.defaults || {}, forcePreApproved });

  const response = await fetch(config.importEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rows,
      base,
      addedBy: options.addedBy || 'Adexpress Import',
      addedByRole: options.addedByRole || '',
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Bulk upload rejected the rows (HTTP ${response.status}).`);
  }

  // Rows go in ordered, so the Nth ad got the Nth Rent-ID. The phone number is
  // checked against the stored row before anything is attached to it, so a
  // surprise in that ordering can never put a card on the wrong property.
  let cards = 0;
  const created = result.bulkUploadId
    ? await AddModel.collection
        .find({ bulkUploadId: result.bulkUploadId }, { projection: { ppcId: 1, phoneNumber: 1 } })
        .sort({ ppcId: 1 })
        .toArray()
    : [];

  for (let i = 0; i < created.length && i < ads.length; i++) {
    const row = created[i];
    const ad = ads[i];
    if (!row || !ad || row.phoneNumber !== ad.primaryPhone) continue;
    try {
      const photoPath = await writeCard(ad, row.ppcId);
      await AddModel.collection.updateOne(
        { _id: row._id, bulkUploadId: result.bulkUploadId },
        { $set: { photos: [photoPath] } }
      );
      cards += 1;
      ad.importedListingId = row.ppcId;
    } catch (err) {
      // A missing picture is not worth losing the lead over.
      console.error('[AdExpress] could not draw a card for ppcId', row.ppcId, '-', err.message);
    }
  }

  await AdExpressAd.updateMany(
    { _id: { $in: ads.map((a) => a._id) } },
    {
      $set: {
        status: 'imported',
        importedAt: new Date(),
        importedBy: options.addedBy || 'Adexpress Import',
        bulkUploadId: result.bulkUploadId || '',
      },
    }
  );
  // Record which property each ad became, one by one (they differ per ad).
  await Promise.all(
    ads
      .filter((a) => a.importedListingId)
      .map((a) =>
        AdExpressAd.updateOne({ _id: a._id }, { $set: { importedListingId: a.importedListingId } })
      )
  );

  return { ...result, cards, forcePreApproved, base };
}

module.exports = { publishAds, buildRows, completenessDefaults };
