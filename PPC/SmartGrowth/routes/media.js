// Communication > WhatsApp > Media Library — the files this account has put
// on SmartGrowth. WhatsApp fetches a header picture from a public link, so
// every banner and chat photo was uploaded to SmartGrowth's store, and stays
// there — public, on another company's server — until someone deletes it.
// Their own page deletes one file at a time.
//
//   GET    /upload/get-uploaded-files?page=&limit=&filter=all&sq=&cid=
//          {data[], currentPage, totalPages, totalItems}, never more than 100 a page
//   DELETE /upload/delete-media/<_id>
//          {"message":"Successfully deleted!"}; an id already gone is 400 "Item doesn't exist!"
//
// A delete removes the FILE, not only the row: its link stops working. A file
// that a running or paused Autobot run / New User Bot list still sends is
// refused — that send would go out with no picture and SmartGrowth would
// still answer 200.
//
//   GET  /sg/media           every file, with its kind and whether it may go
//   POST /sg/media/delete    { items: [{id, url, name}] }, at most MEDIA_DELETE_MAX

const express = require('express');
const sg = require('../client');
const { SgMediaDelete, SgRun, SgNuList } = require('../models');
const U = require('../util');

const router = express.Router();
const MEDIA_DELETE_MAX = 50;
const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

const pagePath = (p) => '/upload/get-uploaded-files?page=' + p + '&limit=100&filter=all&sq=&cid=';

function kindOf(name, mime) {
  mime = String(mime || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(name)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|3gp|mov)$/i.test(name)) return 'video';
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'document';
  return 'other';
}

/** url -> what still sends it. */
async function mediaInUse() {
  const used = {};
  for (const r of await SgRun.find({ mediaUrl: { $nin: [null, ''] } }, { name: 1, status: 1, mediaUrl: 1 }).lean())
    used[r.mediaUrl] = 'Autobot run "' + r.name + '" (' + r.status + ')';
  for (const l of await SgNuList.find({ mediaUrl: { $nin: [null, ''] }, status: { $nin: ['done'] } }, { name: 1, status: 1, mediaUrl: 1 }).lean())
    used[l.mediaUrl] = 'New User Bot list "' + l.name + '" (' + l.status + ')';
  return used;
}

router.get('/sg/media', async (req, res) => {
  try {
    const s = await sg.settings();
    if (!s.apiToken) return fail(res, 'Add your API token in Settings first (Send Message > More Info).');
    const first = await sg.request('GET', pagePath(1), null, 30);
    if (first.code !== 200 || !first.data || !Array.isArray(first.data.data)) return fail(res, sg.failText(first));
    const raw = [...first.data.data];
    const pages = Number(first.data.totalPages) || 1;
    let missed = 0;
    if (pages > 1) {
      const rest = await sg.many('GET', Array.from({ length: pages - 1 }, (_, i) => pagePath(i + 2)), 4, 30);
      for (const r of rest) {
        if (r.code !== 200 || !r.data || !Array.isArray(r.data.data)) { missed++; continue; }
        raw.push(...r.data.data);
      }
    }
    // A file uploaded while the pages were read pushes later files a place
    // down, so the same file can arrive on two pages.
    const used = await mediaInUse();
    const seen = new Set();
    const rows = [];
    for (const m of raw) {
      if (!m || !m._id || seen.has(String(m._id))) continue;
      seen.add(String(m._id));
      const name = String(m.file_name || '');
      const url = String(m.preview_url || '');
      rows.push({
        id: String(m._id), name, url, mime: String(m.mime_type || ''), size: Number(m.file_size) || 0,
        at: String(m.createdOn || ''), kind: kindOf(name, m.mime_type), use: used[url] || '',
      });
    }
    const lastDel = await SgMediaDelete.findOne({}).sort({ _id: -1 }).lean();
    res.json({
      status: 'success', rows, total: Number(first.data.totalItems) || rows.length, missed,
      deleted: lastDel ? { count: await SgMediaDelete.countDocuments({}), at: lastDel.createdAt, by: lastDel.deletedByName } : null,
      maxPerRequest: MEDIA_DELETE_MAX,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/media/delete', async (req, res) => {
  try {
    const items = Array.isArray((req.body || {}).items) ? req.body.items : [];
    if (!items.length) return fail(res, 'Nothing was selected.');
    if (items.length > MEDIA_DELETE_MAX) return fail(res, 'At most ' + MEDIA_DELETE_MAX + ' files a request.');
    const used = await mediaInUse();
    const out = [];
    const go = [];
    for (const it of items) {
      const id = String((it && it.id) || '');
      const url = String((it && it.url) || '');
      if (!/^[a-f0-9]{24}$/.test(id)) { out.push({ id, ok: false, message: 'Not a media library id.' }); continue; }
      if (url && used[url]) { out.push({ id, ok: false, message: 'Kept: ' + used[url] + ' still sends it.' }); continue; }
      go.push({ id, url, name: String((it && it.name) || '') });
    }
    const res2 = await sg.many('DELETE', go.map((g) => '/upload/delete-media/' + g.id), 4, 30);
    const by = U.adminName(req);
    const log = [];
    go.forEach((g, i) => {
      const r = res2[i] || { code: 0, data: null, error: 'no answer' };
      const gone = r.code === 400 && r.data && /doesn't exist/i.test(String(r.data.message || ''));
      const okDel = (r.code >= 200 && r.code < 300) || gone;
      out.push({ id: g.id, ok: okDel, message: okDel ? (gone ? 'Was already gone.' : 'Deleted.') : sg.failText(r) });
      if (okDel) log.push({ mediaId: g.id, fileName: g.name.slice(0, 255), url: g.url.slice(0, 255), result: gone ? 'gone' : 'deleted', deletedByName: by });
    });
    // SmartGrowth keeps nothing once a file is gone; this is the only record.
    if (log.length) { try { await SgMediaDelete.insertMany(log); } catch (e) { console.warn('[SmartGrowth] media delete log failed:', e.message); } }
    const n = out.filter((o) => o.ok).length;
    res.json({ status: 'success', results: out, deleted: n, failed: out.length - n });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
