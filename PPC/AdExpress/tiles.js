// Cuts a scanned newspaper page into overlapping crops for the vision model.
//
// Why crop at all: OpenAI's vision input scales a "high detail" image so its
// shortest side is 768px before reading it. A whole Adexpress page is
// 1440x2184, so sending it whole squeezes 5 columns of 8pt classified type into
// 768px and phone digits stop being legible. Cutting the page into a 3x4 grid
// keeps each crop at roughly its native resolution, which is what took recall
// on a real issue page from about half the ad boxes to nearly all of them.
//
// Crops overlap slightly so an ad box sitting on a grid line is still whole in
// at least one crop; the extractor de-duplicates the repeats afterwards.
//
// jpeg-js is pure JavaScript — no native build, nothing to compile on the VPS.

const jpeg = require('jpeg-js');

// A decoded page is width * height * 4 bytes. 40 MP would be 160 MB of RGBA,
// far beyond anything this publisher produces, so refuse it rather than let the
// process get OOM-killed.
const MAX_PIXELS = 40 * 1000 * 1000;

/**
 * @param {Buffer} pageJpeg      one full-page scan
 * @param {object} opts          { cols, rows, overlap, quality }
 * @returns {{width:number,height:number,tiles:Array<{row:number,col:number,x:number,y:number,width:number,height:number,jpeg:Buffer}>}}
 */
function tilePage(pageJpeg, opts = {}) {
  const cols = Math.max(1, opts.cols || 3);
  const rows = Math.max(1, opts.rows || 4);
  const overlap = Math.min(0.25, Math.max(0, opts.overlap == null ? 0.06 : opts.overlap));
  const quality = Math.min(100, Math.max(40, opts.quality || 88));

  const raw = jpeg.decode(pageJpeg, { useTArray: true, maxMemoryUsageInMB: 512 });
  if (!raw || !raw.width || !raw.height) throw new Error('Page image could not be decoded.');
  if (raw.width * raw.height > MAX_PIXELS) {
    throw new Error(`Page image is too large to tile (${raw.width}x${raw.height}).`);
  }

  const cellW = Math.floor(raw.width / cols);
  const cellH = Math.floor(raw.height / rows);
  const tiles = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.max(0, Math.floor(c * cellW - cellW * overlap));
      const y = Math.max(0, Math.floor(r * cellH - cellH * overlap));
      const w = Math.min(raw.width - x, Math.ceil(cellW * (1 + 2 * overlap)));
      const h = Math.min(raw.height - y, Math.ceil(cellH * (1 + 2 * overlap)));
      if (w < 16 || h < 16) continue;

      const out = Buffer.allocUnsafe(w * h * 4);
      for (let j = 0; j < h; j++) {
        // One row of the crop is contiguous in the source, so copy it wholesale
        // instead of pixel by pixel.
        const srcStart = ((y + j) * raw.width + x) * 4;
        raw.data.copy
          ? raw.data.copy(out, j * w * 4, srcStart, srcStart + w * 4)
          : out.set(raw.data.subarray(srcStart, srcStart + w * 4), j * w * 4);
      }

      tiles.push({
        row: r,
        col: c,
        x,
        y,
        width: w,
        height: h,
        jpeg: jpeg.encode({ data: out, width: w, height: h }, quality).data,
      });
    }
  }

  return { width: raw.width, height: raw.height, tiles };
}

module.exports = { tilePage };
