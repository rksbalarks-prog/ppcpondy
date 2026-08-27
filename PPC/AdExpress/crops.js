// Stores a picture of every ad the importer stages.
//
// This is what makes a contact number trustworthy: before an ad can be
// imported, a person confirms the number against the printed ad, and to do that
// they have to see it. The crop is saved next to the issue PDF and served back
// to the admin screen by GET /PPC/adexpress/ads/:id/crop.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const jpeg = require('jpeg-js');
const config = require('./config');

const cropDir = () => path.join(config.storageDir, 'crops');

/** Encode a raw RGBA crop (from boxes.cropRaw) as a JPEG buffer. */
function encode(raw, quality) {
  return jpeg.encode(
    { data: raw.data, width: raw.width, height: raw.height },
    quality || config.tile.quality
  ).data;
}

/** Deterministic file name, so re-reading an issue overwrites rather than piles up. */
function fileNameFor(adKey) {
  return `${crypto.createHash('sha1').update(String(adKey)).digest('hex')}.jpg`;
}

/**
 * Write one ad crop to disk.
 * @returns {Promise<string>} path relative to the backend cwd, stored on the ad
 */
async function save(adKey, jpegBuffer) {
  const dir = cropDir();
  await fsp.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileNameFor(adKey));
  await fsp.writeFile(filePath, jpegBuffer);
  return filePath;
}

const exists = (filePath) => !!filePath && fs.existsSync(filePath);

/** Delete the crops of ads that are being dropped from staging. */
async function removeMany(paths) {
  await Promise.all(
    (paths || []).filter(Boolean).map((p) => fsp.unlink(p).catch(() => {}))
  );
}

module.exports = { encode, save, exists, removeMany, fileNameFor, cropDir };
