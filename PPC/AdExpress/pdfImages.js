// Dependency-free PDF readers for the Adexpress issue files.
//
// The publisher's PDFs are page scans: each page is one full-page baseline JPEG
// stored verbatim as a /DCTDecode image XObject, with no text layer at all
// (`pdftotext` returns 4 bytes on a 10-page issue). That makes extraction easy
// and cheap — the JPEG bytes inside the PDF *are* a JPEG file, so we can lift
// them out with a small parser instead of pulling in poppler, canvas or sharp
// (deliberately not re-added to this backend; see the npm-prune notes).
//
//   extractJpegPages(buffer)  -> [{ width, height, jpeg: Buffer }]  page scans
//   extractTextLayer(buffer)  -> string                             '' when scanned
//
// Both are defensive: a malformed or unexpected PDF yields an empty result
// rather than throwing, and the caller decides what to do about it.

const zlib = require('zlib');

// "12 0 obj" — object headers, matched on the latin1 view of the buffer so
// string offsets line up 1:1 with the binary.
const OBJ_RE = /(\d+)\s+(\d+)\s+obj\b/g;
const BACKSLASH = String.fromCharCode(92);

/**
 * Pull every JPEG-encoded image XObject out of a PDF, in document order.
 * Duplicate streams (the same scan referenced from several pages) are returned
 * once.
 */
function extractJpegPages(buffer) {
  const pages = [];
  if (!Buffer.isBuffer(buffer) || buffer.length < 32) return pages;

  const latin = buffer.toString('latin1');
  const seen = new Set();
  OBJ_RE.lastIndex = 0;

  let m;
  while ((m = OBJ_RE.exec(latin)) !== null) {
    const objStart = m.index;
    // The dictionary is always short; 4 KB is far more than a scan's image dict.
    const head = latin.slice(objStart, Math.min(objStart + 4096, latin.length));
    const streamAt = head.indexOf('stream');
    if (streamAt < 0) continue;

    const dict = head.slice(0, streamAt);
    if (!/\/Subtype\s*\/Image/.test(dict)) continue;
    if (!/\/DCTDecode/.test(dict)) continue;

    // Stream data starts after the `stream` keyword and its EOL.
    let p = objStart + streamAt + 'stream'.length;
    if (buffer[p] === 0x0d) p++;
    if (buffer[p] === 0x0a) p++;

    const lengthMatch = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
    let end;
    if (lengthMatch) {
      end = p + parseInt(lengthMatch[1], 10);
    } else {
      // /Length given as an indirect reference — fall back to the terminator.
      const idx = buffer.indexOf('endstream', p, 'latin1');
      end = idx > 0 ? idx : buffer.length;
    }
    if (end <= p || end > buffer.length) continue;

    const jpeg = buffer.subarray(p, end);
    // SOI marker; anything else means we mis-parsed and should skip it.
    if (jpeg.length < 128 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) continue;

    const key = `${jpeg.length}:${jpeg.subarray(0, 48).toString('hex')}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const width = Number((dict.match(/\/Width\s+(\d+)/) || [])[1]) || 0;
    const height = Number((dict.match(/\/Height\s+(\d+)/) || [])[1]) || 0;

    pages.push({ width, height, jpeg: Buffer.from(jpeg) });
  }

  return pages;
}

/**
 * Collect the literal strings out of a PDF content stream. Walks the text by
 * hand (rather than with a regex) so escaped parens inside a literal do not
 * end it early.
 */
function pdfLiterals(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] !== '(') {
      i++;
      continue;
    }
    let depth = 1;
    let j = i + 1;
    let buf = '';
    while (j < s.length) {
      const ch = s[j];
      if (ch === BACKSLASH) {
        buf += s[j + 1] || '';
        j += 2;
        continue;
      }
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) break;
      }
      buf += ch;
      j++;
    }
    if (buf) out.push(buf);
    i = j + 1;
  }
  return out;
}

/**
 * Best-effort text-layer read: inflate the FlateDecode streams and collect the
 * literal strings shown by Tj / TJ operators. Adexpress issues are pure scans so
 * this normally returns '', but a future digital-native issue would be caught
 * here and could be parsed straight from text instead of OCR'd.
 */
function extractTextLayer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 32) return '';
  const latin = buffer.toString('latin1');
  const chunks = [];
  let total = 0;
  OBJ_RE.lastIndex = 0;

  let m;
  while ((m = OBJ_RE.exec(latin)) !== null) {
    const objStart = m.index;
    const head = latin.slice(objStart, Math.min(objStart + 2048, latin.length));
    const streamAt = head.indexOf('stream');
    if (streamAt < 0) continue;

    const dict = head.slice(0, streamAt);
    if (/\/Subtype\s*\/Image/.test(dict)) continue;
    if (!/\/FlateDecode/.test(dict)) continue;

    let p = objStart + streamAt + 'stream'.length;
    if (buffer[p] === 0x0d) p++;
    if (buffer[p] === 0x0a) p++;

    const lengthMatch = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
    const endIdx = buffer.indexOf('endstream', p, 'latin1');
    const end = lengthMatch ? p + parseInt(lengthMatch[1], 10) : endIdx > 0 ? endIdx : -1;
    if (end <= p || end > buffer.length) continue;

    let inflated;
    try {
      inflated = zlib.inflateSync(buffer.subarray(p, end)).toString('latin1');
    } catch {
      continue; // not a content stream we can read — fine, skip it
    }
    if (!/\bT[jJ]\b/.test(inflated)) continue;

    const line = pdfLiterals(inflated).join(' ').trim();
    if (!line) continue;
    chunks.push(line);
    total += line.length;
    if (total > 200000) break; // plenty for a decision
  }

  return chunks.join('\n').replace(/[ \t]+/g, ' ').trim();
}

module.exports = { extractJpegPages, extractTextLayer };
