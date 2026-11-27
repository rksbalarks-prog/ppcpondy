// Files that travel to SmartGrowth: what a file really is, a name safe to put
// in a multipart header, and the public link out of whatever wrapper their
// answer comes in.

const MEDIA_IMAGE_MAX = 5 * 1024 * 1024;     //   5 MB — JPG / PNG
const MEDIA_VIDEO_MAX = 16 * 1024 * 1024;    //  16 MB — MP4
const MEDIA_DOC_MAX = 100 * 1024 * 1024;     // 100 MB — PDF

/** What a file IS, judged from its bytes rather than its name. */
function mediaKind(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF)
    return { format: 'IMAGE', word: 'picture', mime: 'image/jpeg', ext: 'jpg', max: MEDIA_IMAGE_MAX };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])))
    return { format: 'IMAGE', word: 'picture', mime: 'image/png', ext: 'png', max: MEDIA_IMAGE_MAX };
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-')
    return { format: 'DOCUMENT', word: 'document', mime: 'application/pdf', ext: 'pdf', max: MEDIA_DOC_MAX };
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp')
    return { format: 'VIDEO', word: 'video', mime: 'video/mp4', ext: 'mp4', max: MEDIA_VIDEO_MAX };
  return null;
}

/** The browser's name, reduced to plain characters, with the extension the bytes earned. */
function safeName(given, ext, fallback) {
  const base = String(given || '').replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
  return base.slice(0, 60) + '.' + ext;
}

/**
 * A public link to the file. Their upload answers `previewUrl`, the media
 * list calls the same field `preview_url`; both are read. Only an absolute
 * http(s) URL — this ends up in an <img> on an admin page.
 */
function mediaUrlOf(d) {
  if (!d || typeof d !== 'object') return '';
  const levels = [d];
  for (const k of ['data', 'file', 'media', 'result']) if (d[k] && typeof d[k] === 'object') levels.push(d[k]);
  for (const lvl of levels)
    for (const k of ['previewUrl', 'preview_url', 'mediaUrl', 'fileUrl', 'url'])
      if (typeof lvl[k] === 'string' && /^https?:\/\//i.test(lvl[k])) return lvl[k];
  return '';
}

/** Meta's id for a message just sent, out of whatever SmartGrowth wrapped it in. */
function wamidOf(d) {
  if (!d || typeof d !== 'object') return '';
  const levels = [d];
  for (const k of ['data', 'response', 'result']) if (d[k] && typeof d[k] === 'object') levels.push(d[k]);
  for (const lvl of levels) {
    if (Array.isArray(lvl.messages) && lvl.messages[0] && typeof lvl.messages[0].id === 'string') return lvl.messages[0].id;
    for (const k of ['wamid', 'messageId', 'id']) if (typeof lvl[k] === 'string' && lvl[k]) return lvl[k];
  }
  return '';
}

module.exports = { MEDIA_IMAGE_MAX, MEDIA_VIDEO_MAX, MEDIA_DOC_MAX, mediaKind, safeName, mediaUrlOf, wamidOf };
