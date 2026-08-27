// Draws the stand-in "photo" for a property scraped out of the newspaper.
//
// A classified ad has no photograph, so a listing imported from Adexpress would
// otherwise show up in the app with an empty picture slot. Instead we draw a
// card in the style of the printed ad box — a ruled border, a heading strip,
// and the three facts a tenant scans for:
//
//     BHK:    2
//     Floor:  Ground
//     Area:   1200 Sq.ft
//
// It must NOT be the crop of the real newspaper ad: that carries the owner's
// phone number in plain sight, and the app charges points to reveal a contact.
// The crop stays internal to the review screen; only this drawn card is ever
// published as a property photo.
//
// Everything is drawn by hand into an RGBA buffer and encoded with jpeg-js.
// There is no font renderer available in this backend (no canvas, no sharp — see
// the npm-prune notes), so text is stamped from a 5x7 bitmap font scaled up.

const jpeg = require('jpeg-js');
const config = require('./config');

// Classic 5x7 glyphs, five columns per character, bit 0 = top pixel.
// Covers ASCII 0x20-0x7A, which is everything these cards print.
const FONT_FIRST = 0x20;
const FONT = [
  [0x00, 0x00, 0x00, 0x00, 0x00], // (space)
  [0x00, 0x00, 0x5f, 0x00, 0x00], // !
  [0x00, 0x07, 0x00, 0x07, 0x00], // "
  [0x14, 0x7f, 0x14, 0x7f, 0x14], // #
  [0x24, 0x2a, 0x7f, 0x2a, 0x12], // $
  [0x23, 0x13, 0x08, 0x64, 0x62], // %
  [0x36, 0x49, 0x55, 0x22, 0x50], // &
  [0x00, 0x05, 0x03, 0x00, 0x00], // '
  [0x00, 0x1c, 0x22, 0x41, 0x00], // (
  [0x00, 0x41, 0x22, 0x1c, 0x00], // )
  [0x14, 0x08, 0x3e, 0x08, 0x14], // *
  [0x08, 0x08, 0x3e, 0x08, 0x08], // +
  [0x00, 0x50, 0x30, 0x00, 0x00], // ,
  [0x08, 0x08, 0x08, 0x08, 0x08], // -
  [0x00, 0x60, 0x60, 0x00, 0x00], // .
  [0x20, 0x10, 0x08, 0x04, 0x02], // /
  [0x3e, 0x51, 0x49, 0x45, 0x3e], // 0
  [0x00, 0x42, 0x7f, 0x40, 0x00], // 1
  [0x42, 0x61, 0x51, 0x49, 0x46], // 2
  [0x21, 0x41, 0x45, 0x4b, 0x31], // 3
  [0x18, 0x14, 0x12, 0x7f, 0x10], // 4
  [0x27, 0x45, 0x45, 0x45, 0x39], // 5
  [0x3c, 0x4a, 0x49, 0x49, 0x30], // 6
  [0x01, 0x71, 0x09, 0x05, 0x03], // 7
  [0x36, 0x49, 0x49, 0x49, 0x36], // 8
  [0x06, 0x49, 0x49, 0x29, 0x1e], // 9
  [0x00, 0x36, 0x36, 0x00, 0x00], // :
  [0x00, 0x56, 0x36, 0x00, 0x00], // ;
  [0x08, 0x14, 0x22, 0x41, 0x00], // <
  [0x14, 0x14, 0x14, 0x14, 0x14], // =
  [0x00, 0x41, 0x22, 0x14, 0x08], // >
  [0x02, 0x01, 0x51, 0x09, 0x06], // ?
  [0x32, 0x49, 0x79, 0x41, 0x3e], // @
  [0x7e, 0x11, 0x11, 0x11, 0x7e], // A
  [0x7f, 0x49, 0x49, 0x49, 0x36], // B
  [0x3e, 0x41, 0x41, 0x41, 0x22], // C
  [0x7f, 0x41, 0x41, 0x22, 0x1c], // D
  [0x7f, 0x49, 0x49, 0x49, 0x41], // E
  [0x7f, 0x09, 0x09, 0x09, 0x01], // F
  [0x3e, 0x41, 0x49, 0x49, 0x7a], // G
  [0x7f, 0x08, 0x08, 0x08, 0x7f], // H
  [0x00, 0x41, 0x7f, 0x41, 0x00], // I
  [0x20, 0x40, 0x41, 0x3f, 0x01], // J
  [0x7f, 0x08, 0x14, 0x22, 0x41], // K
  [0x7f, 0x40, 0x40, 0x40, 0x40], // L
  [0x7f, 0x02, 0x0c, 0x02, 0x7f], // M
  [0x7f, 0x04, 0x08, 0x10, 0x7f], // N
  [0x3e, 0x41, 0x41, 0x41, 0x3e], // O
  [0x7f, 0x09, 0x09, 0x09, 0x06], // P
  [0x3e, 0x41, 0x51, 0x21, 0x5e], // Q
  [0x7f, 0x09, 0x19, 0x29, 0x46], // R
  [0x46, 0x49, 0x49, 0x49, 0x31], // S
  [0x01, 0x01, 0x7f, 0x01, 0x01], // T
  [0x3f, 0x40, 0x40, 0x40, 0x3f], // U
  [0x1f, 0x20, 0x40, 0x20, 0x1f], // V
  [0x3f, 0x40, 0x38, 0x40, 0x3f], // W
  [0x63, 0x14, 0x08, 0x14, 0x63], // X
  [0x07, 0x08, 0x70, 0x08, 0x07], // Y
  [0x61, 0x51, 0x49, 0x45, 0x43], // Z
  [0x00, 0x7f, 0x41, 0x41, 0x00], // [
  [0x02, 0x04, 0x08, 0x10, 0x20], // backslash
  [0x00, 0x41, 0x41, 0x7f, 0x00], // ]
  [0x04, 0x02, 0x01, 0x02, 0x04], // ^
  [0x40, 0x40, 0x40, 0x40, 0x40], // _
  [0x00, 0x01, 0x02, 0x04, 0x00], // `
  [0x20, 0x54, 0x54, 0x54, 0x78], // a
  [0x7f, 0x48, 0x44, 0x44, 0x38], // b
  [0x38, 0x44, 0x44, 0x44, 0x20], // c
  [0x38, 0x44, 0x44, 0x48, 0x7f], // d
  [0x38, 0x54, 0x54, 0x54, 0x18], // e
  [0x08, 0x7e, 0x09, 0x01, 0x02], // f
  [0x0c, 0x52, 0x52, 0x52, 0x3e], // g
  [0x7f, 0x08, 0x04, 0x04, 0x78], // h
  [0x00, 0x44, 0x7d, 0x40, 0x00], // i
  [0x20, 0x40, 0x44, 0x3d, 0x00], // j
  [0x7f, 0x10, 0x28, 0x44, 0x00], // k
  [0x00, 0x41, 0x7f, 0x40, 0x00], // l
  [0x7c, 0x04, 0x18, 0x04, 0x78], // m
  [0x7c, 0x08, 0x04, 0x04, 0x78], // n
  [0x38, 0x44, 0x44, 0x44, 0x38], // o
  [0x7c, 0x14, 0x14, 0x14, 0x08], // p
  [0x08, 0x14, 0x14, 0x18, 0x7c], // q
  [0x7c, 0x08, 0x04, 0x04, 0x08], // r
  [0x48, 0x54, 0x54, 0x54, 0x20], // s
  [0x04, 0x3f, 0x44, 0x40, 0x20], // t
  [0x3c, 0x40, 0x40, 0x20, 0x7c], // u
  [0x1c, 0x20, 0x40, 0x20, 0x1c], // v
  [0x3c, 0x40, 0x30, 0x40, 0x3c], // w
  [0x44, 0x28, 0x10, 0x28, 0x44], // x
  [0x0c, 0x50, 0x50, 0x50, 0x3c], // y
  [0x44, 0x64, 0x54, 0x4c, 0x44], // z
];

const GLYPH_W = 5;
const GLYPH_H = 7;
const INK = [26, 26, 26];
const PAPER = [255, 255, 255];
const RULE = [17, 17, 17];
const HEADER = [183, 28, 28]; // the red strip Adexpress prints its headings on
const MUTED = [110, 110, 110];

function makeCanvas(width, height, colour = PAPER) {
  const data = Buffer.allocUnsafe(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = colour[0];
    data[i * 4 + 1] = colour[1];
    data[i * 4 + 2] = colour[2];
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}

function fillRect(canvas, x, y, w, h, colour) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(canvas.width, Math.round(x + w));
  const y1 = Math.min(canvas.height, Math.round(y + h));
  for (let j = y0; j < y1; j++) {
    for (let i = x0; i < x1; i++) {
      const p = (j * canvas.width + i) * 4;
      canvas.data[p] = colour[0];
      canvas.data[p + 1] = colour[1];
      canvas.data[p + 2] = colour[2];
      canvas.data[p + 3] = 255;
    }
  }
}

const textWidth = (text, scale, tracking = 1) =>
  String(text).length * (GLYPH_W + tracking) * scale - tracking * scale;

/**
 * Stamp text into the canvas. `bold` re-stamps one pixel to the right, which is
 * how a bitmap font gets a heavier weight without a second glyph set.
 */
function drawText(canvas, text, x, y, scale, colour = INK, { bold = false, tracking = 1 } = {}) {
  let cursor = Math.round(x);
  for (const char of String(text)) {
    const index = char.charCodeAt(0) - FONT_FIRST;
    const glyph = FONT[index];
    if (glyph) {
      for (let col = 0; col < GLYPH_W; col++) {
        for (let row = 0; row < GLYPH_H; row++) {
          if (!(glyph[col] & (1 << row))) continue;
          fillRect(canvas, cursor + col * scale, y + row * scale, scale, scale, colour);
          if (bold) fillRect(canvas, cursor + col * scale + 1, y + row * scale, scale, scale, colour);
        }
      }
    }
    cursor += (GLYPH_W + tracking) * scale;
  }
  return cursor;
}

function drawCentred(canvas, text, y, scale, colour, opts = {}) {
  const w = textWidth(text, scale, opts.tracking == null ? 1 : opts.tracking);
  return drawText(canvas, text, (canvas.width - w) / 2, y, scale, colour, opts);
}

/** Break a string to fit a pixel width, on spaces where it can. */
function wrap(text, scale, maxWidth, maxLines = 2) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, scale) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines);
}

// Only ASCII can be stamped, so Tamil headlines fall back to a neutral title
// rather than printing a row of blanks.
const asciiOnly = (s) => String(s || '').replace(/[^\x20-\x7A]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Draw the property card.
 *
 * @param {object} ad          the staged ad (bedrooms, floorNo, areaSqft, ...)
 * @param {object} opts        { width, height, quality, brand }
 * @returns {Buffer} JPEG
 */
function renderPropertyCard(ad = {}, opts = {}) {
  const width = opts.width || 1000;
  const height = opts.height || 750;
  const canvas = makeCanvas(width, height);

  // Ruled border, the way the paper prints an ad box.
  fillRect(canvas, 0, 0, width, height, PAPER);
  fillRect(canvas, 8, 8, width - 16, 5, RULE);
  fillRect(canvas, 8, height - 13, width - 16, 5, RULE);
  fillRect(canvas, 8, 8, 5, height - 16, RULE);
  fillRect(canvas, width - 13, 8, 5, height - 16, RULE);
  fillRect(canvas, 20, 20, width - 40, 2, RULE);
  fillRect(canvas, 20, height - 22, width - 40, 2, RULE);
  fillRect(canvas, 20, 20, 2, height - 42, RULE);
  fillRect(canvas, width - 22, 20, 2, height - 42, RULE);

  // Heading strip.
  const dealLine =
    ad.dealType === 'rent'
      ? `${(ad.propertyType || 'PROPERTY').toUpperCase()} FOR RENT`
      : `${(ad.propertyType || 'PROPERTY').toUpperCase()} FOR SALE`;
  fillRect(canvas, 34, 46, width - 68, 74, HEADER);
  drawCentred(canvas, asciiOnly(dealLine).slice(0, 30) || 'FOR RENT', 68, 5, PAPER, { bold: true });

  // Only facts the advertisement actually printed get a row — a card full of
  // "Not stated" tells a tenant nothing and looks like a broken listing.
  const rows = [];
  if (ad.bedrooms) rows.push(['BHK', `${ad.bedrooms} BHK`, INK]);
  if (ad.floorNo) rows.push(['Floor', String(ad.floorNo), INK]);
  if (ad.areaSqft) rows.push(['Area', `${Number(ad.areaSqft).toLocaleString('en-IN')} Sq.ft`, INK]);
  // The money line always shows: a figure when the ad printed one, otherwise
  // the next step. A sale card says Price; a rental one says Rent per month.
  const forRent = ad.dealType === 'rent';
  const moneyLabel = forRent ? 'Rent' : 'Price';
  const moneyValue = ad.rentAmount
    ? `Rs.${Number(ad.rentAmount).toLocaleString('en-IN')}${forRent ? '/month' : ''}`
    : 'Call Owner';
  rows.push([moneyLabel, moneyValue, HEADER]);

  const place = asciiOnly(ad.locality || ad.address || '');
  const placeLines = place ? wrap(place, 5, width - 140, 2) : [];

  // Centre the block between the heading strip and the footer, so a card with
  // one row is as well composed as a card with four.
  const rowHeight = 96;
  const placeHeight = placeLines.length ? placeLines.length * 42 + 20 : 0;
  const blockHeight = rows.length * rowHeight + placeHeight;
  const top = 140;
  const bottom = height - 96;
  let y = Math.max(top, Math.round(top + (bottom - top - blockHeight) / 2));

  const labelX = 70;
  const valueX = 330;
  rows.forEach(([label, value, colour], i) => {
    drawText(canvas, `${label}:`, labelX, y, 6, MUTED, { bold: true });
    drawText(canvas, asciiOnly(value), valueX, y - 4, 7, colour, { bold: true });
    y += rowHeight;
    if (i < rows.length - 1) fillRect(canvas, 60, y - 26, width - 120, 1, [225, 225, 225]);
  });

  // Where it is.
  placeLines.forEach((line, i) => drawCentred(canvas, line, y + 6 + i * 42, 5, INK));
  if (placeLines.length) y += placeHeight;

  // Footer carries the brand only. The advertisement's origin is deliberately
  // not printed here — this image is published on the listing.
  const footerY = height - 62;
  fillRect(canvas, 34, footerY - 18, width - 68, 2, [225, 225, 225]);
  // Brand comes from config so this copy can never print the other app's name.
  drawCentred(canvas, asciiOnly(opts.brand || config.publishDefaults.brand), footerY, 4, MUTED);

  return jpeg.encode({ data: canvas.data, width, height }, opts.quality || 90).data;
}

module.exports = { renderPropertyCard, drawText, makeCanvas, textWidth };
