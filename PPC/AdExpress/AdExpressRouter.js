const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const XLSX = require('xlsx');

const config = require('./config');
const source = require('./source');
const processor = require('./processor');
const crops = require('./crops');
const schedule = require('./schedule');
const { publishAds } = require('./publish');
const { AdExpressIssue, AdExpressAd } = require('./AdExpressModel');
const { normalizeAmount } = require('./normalize');
// Read-only: used to tell the reviewer "this number is already in Rent Pondy".
const AddModel = require('../AddModel');

const router = express.Router();

/**
 * Adexpress import — admin API.
 *
 *   GET    /PPC/adexpress/status                  is it configured, what is running
 *   GET    /PPC/adexpress/issues                  issues discovered / uploaded
 *   POST   /PPC/adexpress/discover                look for new issues on the site
 *   POST   /PPC/adexpress/upload                  upload an issue PDF by hand
 *   POST   /PPC/adexpress/issues/:id/process      read an issue (OCR)
 *   GET    /PPC/adexpress/issues/:id              one issue + live progress
 *   DELETE /PPC/adexpress/issues/:id              drop a staged issue and its ads
 *   GET    /PPC/adexpress/ads                     staged ads, filtered
 *   GET    /PPC/adexpress/ads/:id/crop            the picture of that printed ad
 *   PATCH  /PPC/adexpress/ads/:id                 correct a field / set status
 *   POST   /PPC/adexpress/ads/:id/confirm         a person vouches for the number
 *   POST   /PPC/adexpress/ads/status              set status on many at once
 *   POST   /PPC/adexpress/import                  publish selected ads
 *   GET    /PPC/adexpress/cron/status             what the nightly job has been doing
 *   POST   /PPC/adexpress/cron/run-now            run the nightly job now
 *   GET    /PPC/adexpress/export                  download the filtered ads as xlsx
 *   GET    /PPC/adexpress/stats                   counters for the header cards
 *
 * Strictly additive: no existing route, model or collection is modified. The
 * one point of contact with the live app is /adexpress/import, which posts to
 * the app's own POST /PPC/bulk-upload-properties — the same path the admin's
 * Excel bulk upload already uses, so imported rows land in PreApproved/Pending
 * exactly like any other bulk upload and can be reverted with the existing
 * bulk-upload tooling.
 */

// ── upload handling ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(config.storageDir, { recursive: true });
    cb(null, config.storageDir);
  },
  filename: (req, file, cb) =>
    cb(null, `upload-${Date.now()}-${file.originalname.replace(/[^\w.-]+/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: config.maxPdfBytes },
  fileFilter: (req, file, cb) => {
    const ok =
      path.extname(file.originalname).toLowerCase() === '.pdf' ||
      file.mimetype === 'application/pdf';
    cb(ok ? null : new Error('Only PDF issue files can be uploaded.'), ok);
  },
});

// ── helpers ────────────────────────────────────────────────────────────────
const fail = (res, code, message) => res.status(code).json({ message });

function guard(handler) {
  return async (req, res) => {
    if (!config.enabled) return fail(res, 503, 'The Adexpress importer is turned off.');
    try {
      await handler(req, res);
    } catch (err) {
      const status = /not found/i.test(err.message) ? 404 : 500;
      return fail(res, status, err.message || 'Adexpress request failed.');
    }
  };
}

// Only the editions this importer reads are accepted; anything else falls back
// to the first enabled one rather than silently staging ads nobody wants.
const editionOf = (v) => {
  const wanted = String(v || '').trim().toLowerCase();
  return config.editions.find((e) => e.toLowerCase() === wanted) || config.editions[0];
};

/** Which of these numbers already exist in the live rentals collection? */
async function existingByPhone(phones) {
  const list = [...new Set(phones.filter(Boolean))];
  if (!list.length) return new Map();
  // Raw collection so the lookup is never narrowed by the city-scope plugin.
  const rows = await AddModel.collection
    .find({ phoneNumber: { $in: list } }, { projection: { phoneNumber: 1, rentId: 1 } })
    .limit(5000)
    .toArray();

  const map = new Map();
  for (const r of rows) {
    const key = String(r.phoneNumber);
    if (!map.has(key)) map.set(key, []);
    if (r.rentId) map.get(key).push(r.rentId);
  }
  return map;
}

/**
 * May this ad be published?
 *
 * A contact number that is wrong is worse than no lead at all, so by default an
 * ad only qualifies once a person has confirmed the number against the picture
 * of the printed ad. With ADEXPRESS_REQUIRE_CONFIRM=false an ad whose
 * independent readings all agreed qualifies too.
 */
function canImport(ad) {
  if (!ad || !ad.primaryPhone) return false;
  if (ad.status === 'imported') return false;
  if (ad.phoneStatus === 'confirmed') return true;
  return !config.requireConfirm && ad.phoneStatus === 'verified';
}

function whyNotImportable(ad) {
  if (!ad.primaryPhone) return 'no phone number';
  if (ad.status === 'imported') return 'already imported';
  if (ad.phoneStatus === 'disputed') return 'the readings of the number disagreed';
  if (ad.phoneStatus === 'unreadable') return 'the number could not be read';
  if (ad.phoneStatus === 'unverified') return 'the number was never double-checked';
  return 'nobody has confirmed the number against the ad yet';
}

// ── status ─────────────────────────────────────────────────────────────────
router.get('/adexpress/status', (req, res) => {
  res.json({
    enabled: config.enabled,
    apiKeyConfigured: !!config.openaiApiKey,
    visionModel: config.visionModel,
    site: config.site,
    deal: config.deal,
    phoneReads: config.phoneReads,
    requireConfirm: config.requireConfirm,
    useBoxes: config.useBoxes,
    editions: config.editions,
    tile: config.tile,
    storageDir: config.storageDir,
    activeJob: processor.currentJob(),
  });
});

// ── issues ─────────────────────────────────────────────────────────────────
router.get(
  '/adexpress/issues',
  guard(async (req, res) => {
    const filter = {};
    if (req.query.edition) filter.edition = editionOf(req.query.edition);
    if (req.query.status) filter.status = String(req.query.status);

    const issues = await AdExpressIssue.find(filter)
      .sort({ issueDate: -1, createdAt: -1 })
      .limit(Math.min(200, Number(req.query.limit) || 60))
      .lean();

    res.json({
      issues: issues.map((i) => ({
        ...i,
        pdfAvailable: !!i.pdfUrl || source.pdfExists(i.pdfPath),
        job: processor.getJob(i._id),
      })),
    });
  })
);

router.get(
  '/adexpress/issues/:id',
  guard(async (req, res) => {
    const issue = await AdExpressIssue.findById(req.params.id).lean();
    if (!issue) throw new Error('Issue not found.');
    res.json({ issue, job: processor.getJob(req.params.id) });
  })
);

router.post(
  '/adexpress/discover',
  guard(async (req, res) => {
    const editions = Array.isArray(req.body?.editions) && req.body.editions.length
      ? req.body.editions.map(editionOf)
      : config.editions;
    const limit = Math.min(30, Number(req.body?.limit) || 10);

    const found = [];
    let added = 0;
    let paywalled = 0;

    for (const edition of [...new Set(editions)]) {
      const issues = await source.discoverIssues({ edition, limit });

      // The category posts lag behind: the current issue lives on the
      // edition's own page and is routinely a week newer than the newest post.
      const current = await source.discoverCurrentIssue(edition).catch(() => null);
      if (current && !issues.some((i) => i.pdfUrl === current.pdfUrl)) issues.unshift(current);

      for (const item of issues) {
        if (item.paywalled) paywalled += 1;
        const update = {
          source: 'site',
          edition: item.edition,
          issueLabel: item.issueLabel,
          issueDate: item.issueDate,
          postId: item.postId,
          postLink: item.postLink,
        };
        if (item.issueNumber) update.issueNumber = item.issueNumber;
        // Never overwrite a PDF link we already have with an empty one.
        if (item.pdfUrl) update.pdfUrl = item.pdfUrl;

        const result = await AdExpressIssue.updateOne(
          { issueKey: item.issueKey },
          { $set: update, $setOnInsert: { issueKey: item.issueKey, status: 'discovered' } },
          { upsert: true }
        );
        if (result.upsertedCount) added += 1;
        found.push(item);
      }
    }

    res.json({
      message:
        `${found.length} issues listed, ${added} new. ` +
        (paywalled
          ? `${paywalled} are subscriber-only on the publisher's site — upload those PDFs to read them.`
          : ''),
      added,
      paywalled,
      issues: found,
    });
  })
);

router.post(
  '/adexpress/upload',
  (req, res, next) =>
    upload.single('pdf')(req, res, (err) => (err ? fail(res, 400, err.message) : next())),
  guard(async (req, res) => {
    if (!req.file) return fail(res, 400, 'No PDF was uploaded.');

    const edition = editionOf(req.body?.edition);
    const issueDate = req.body?.issueDate ? new Date(req.body.issueDate) : new Date();
    if (Number.isNaN(issueDate.getTime())) return fail(res, 400, 'Issue date is not a valid date.');

    const issueKey = source.issueKeyFor(edition, issueDate);
    const label =
      String(req.body?.issueLabel || '').trim() ||
      `Uploaded ${issueDate.toISOString().slice(0, 10)}`;

    // Park the file under the issue's canonical name.
    const finalPath = path.join(config.storageDir, `${issueKey}.pdf`);
    if (path.resolve(finalPath) !== path.resolve(req.file.path)) {
      await fsp.rename(req.file.path, finalPath).catch(async () => {
        await fsp.copyFile(req.file.path, finalPath);
        await fsp.unlink(req.file.path).catch(() => {});
      });
    }

    const issue = await AdExpressIssue.findOneAndUpdate(
      { issueKey },
      {
        $set: {
          source: 'upload',
          edition,
          issueLabel: label,
          issueDate,
          pdfPath: finalPath,
          pdfBytes: req.file.size,
          status: 'downloaded',
          error: '',
        },
        $setOnInsert: { issueKey },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: `Issue "${label}" is ready to read.`, issue });
  })
);

router.post(
  '/adexpress/issues/:id/process',
  guard(async (req, res) => {
    if (!config.openaiApiKey) {
      return fail(res, 400, 'OPENAI_API_KEY is not set on the server, so pages cannot be read.');
    }
    const issue = await AdExpressIssue.findById(req.params.id);
    if (!issue) throw new Error('Issue not found.');
    const running = processor.currentJob();
    if (running) return fail(res, 409, `Already reading "${running.issueLabel || running.issueKey}".`);

    const pages = Array.isArray(req.body?.pages)
      ? req.body.pages.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];

    // Kick the run off and answer straight away; the screen polls for progress.
    processor
      .processIssue(issue, { pages, ocrAll: !!req.body?.ocrAll, by: req.body?.by || '' })
      .catch(() => {
        /* the failure is recorded on the issue and in the job snapshot */
      });

    res.status(202).json({
      message: `Reading "${issue.issueLabel || issue.issueKey}" — this takes a couple of minutes.`,
      issueId: issue._id,
    });
  })
);

router.delete(
  '/adexpress/issues/:id',
  guard(async (req, res) => {
    const issue = await AdExpressIssue.findById(req.params.id);
    if (!issue) throw new Error('Issue not found.');
    const doomed = await AdExpressAd.find({ issue: issue._id, status: { $ne: 'imported' } })
      .select('cropPath')
      .lean();
    await crops.removeMany(doomed.map((a) => a.cropPath));
    const ads = await AdExpressAd.deleteMany({ issue: issue._id, status: { $ne: 'imported' } });
    await source.removePdf(issue.pdfPath);
    await AdExpressIssue.deleteOne({ _id: issue._id });
    res.json({
      message: `Issue removed from staging (${ads.deletedCount} staged ads dropped; imported ones were kept).`,
    });
  })
);

// ── staged ads ─────────────────────────────────────────────────────────────
function adFilter(query) {
  const filter = {};
  if (query.dealType) filter.dealType = String(query.dealType);
  if (query.status) filter.status = { $in: String(query.status).split(',') };
  if (query.edition) filter.edition = editionOf(query.edition);
  if (query.issueId) filter.issue = query.issueId;
  if (query.needsReview === 'true') filter.needsReview = true;
  if (query.bedrooms) filter.bedrooms = String(query.bedrooms);
  if (query.propertyMode) filter.propertyMode = String(query.propertyMode);
  if (query.phoneStatus) filter.phoneStatus = { $in: String(query.phoneStatus).split(',') };

  const min = normalizeAmount(query.minRent);
  const max = normalizeAmount(query.maxRent);
  if (min != null || max != null) {
    filter.rentAmount = {};
    if (min != null) filter.rentAmount.$gte = min;
    if (max != null) filter.rentAmount.$lte = max;
  }

  const q = String(query.q || '').trim();
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { rawText: rx },
      { headline: rx },
      { locality: rx },
      { address: rx },
      { primaryPhone: rx },
      { phones: rx },
    ];
  }
  return filter;
}

router.get(
  '/adexpress/ads',
  guard(async (req, res) => {
    const filter = adFilter(req.query);
    const limit = Math.min(500, Number(req.query.limit) || 100);
    const page = Math.max(1, Number(req.query.page) || 1);

    const [total, ads] = await Promise.all([
      AdExpressAd.countDocuments(filter),
      AdExpressAd.find(filter)
        .sort({ issueDate: -1, pageNo: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const existing = await existingByPhone(ads.map((a) => a.primaryPhone));
    res.json({
      total,
      page,
      limit,
      requireConfirm: config.requireConfirm,
      ads: ads.map((a) => ({
        ...a,
        hasCrop: crops.exists(a.cropPath),
        importable: canImport(a),
        existsInApp: existing.has(a.primaryPhone),
        existingRentIds: existing.get(a.primaryPhone) || [],
      })),
    });
  })
);

/**
 * The picture of the printed ad. This is the evidence a reviewer confirms the
 * phone number against, so it is served straight from the crop written when the
 * issue was read.
 */
router.get(
  '/adexpress/ads/:id/crop',
  guard(async (req, res) => {
    const ad = await AdExpressAd.findById(req.params.id).select('cropPath').lean();
    if (!ad) throw new Error('Ad not found.');
    if (!crops.exists(ad.cropPath)) {
      return fail(res, 404, 'No picture was saved for this ad — re-read the issue to make one.');
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    fs.createReadStream(ad.cropPath).pipe(res);
  })
);

// Fields a reviewer may correct before importing. Everything else is read-only.
const EDITABLE = [
  'dealType', 'headline', 'primaryPhone', 'rentAmount', 'deposit', 'bedrooms',
  'propertyMode', 'propertyType', 'locality', 'address', 'areaSqft', 'floorNo',
  'status', 'note',
];

router.patch(
  '/adexpress/ads/:id',
  guard(async (req, res) => {
    const update = {};
    for (const field of EDITABLE) {
      if (req.body[field] === undefined) continue;
      if (['rentAmount', 'deposit', 'areaSqft'].includes(field)) {
        update[field] = req.body[field] === '' ? null : normalizeAmount(req.body[field]);
      } else {
        update[field] = String(req.body[field]).trim();
      }
    }
    if (!Object.keys(update).length) return fail(res, 400, 'Nothing to update.');

    // Typing a number in is itself an act of confirmation — the reviewer is
    // looking at the ad while they do it — but it must still be a real mobile.
    if (update.primaryPhone !== undefined) {
      const digits = update.primaryPhone.replace(/\D/g, '').slice(-10);
      if (digits && !/^[6-9]\d{9}$/.test(digits)) {
        return fail(res, 400, 'That is not a valid 10-digit Indian mobile number.');
      }
      update.primaryPhone = digits;
      update.phones = digits ? [digits] : [];
      update.phoneStatus = digits ? 'confirmed' : 'unreadable';
      update.confirmedBy = String(req.body.by || '').slice(0, 60);
      update.confirmedAt = new Date();
      update.needsReview = false;
      update.reviewIssues = [];
    }

    const ad = await AdExpressAd.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!ad) throw new Error('Ad not found.');
    res.json({ message: 'Saved.', ad: { ...ad.toObject(), importable: canImport(ad) } });
  })
);

/**
 * A person has read the number off the picture of the ad and vouches for it.
 * This is the only thing that makes an ad importable by default, and the number
 * they type is what gets stored — not what OCR guessed.
 */
router.post(
  '/adexpress/ads/:id/confirm',
  guard(async (req, res) => {
    const ad = await AdExpressAd.findById(req.params.id);
    if (!ad) throw new Error('Ad not found.');
    if (ad.status === 'imported') return fail(res, 400, 'That ad has already been imported.');

    const digits = String(req.body?.phone ?? ad.primaryPhone ?? '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return fail(res, 400, 'Enter the 10-digit mobile number exactly as printed in the ad.');
    }

    ad.primaryPhone = digits;
    if (!ad.phones.includes(digits)) ad.phones = [digits, ...ad.phones.filter((p) => p !== digits)];
    ad.phoneStatus = 'confirmed';
    ad.confirmedBy = String(req.body?.by || '').slice(0, 60);
    ad.confirmedAt = new Date();
    ad.reviewIssues = [];
    ad.needsReview = false;
    if (ad.status === 'new') ad.status = 'shortlisted';
    await ad.save();

    res.json({ message: `${digits} confirmed.`, ad: { ...ad.toObject(), importable: canImport(ad) } });
  })
);

router.post(
  '/adexpress/ads/status',
  guard(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const status = String(req.body?.status || '');
    if (!ids.length) return fail(res, 400, 'No ads selected.');
    if (!['new', 'shortlisted', 'ignored'].includes(status)) {
      return fail(res, 400, 'Status must be new, shortlisted or ignored.');
    }
    const result = await AdExpressAd.updateMany(
      { _id: { $in: ids }, status: { $ne: 'imported' } },
      { $set: { status } }
    );
    res.json({ message: `${result.modifiedCount} ads marked ${status}.` });
  })
);

// ── import into the live app ───────────────────────────────────────────────
router.post(
  '/adexpress/import',
  guard(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return fail(res, 400, 'No ads selected to import.');
    if (ids.length > 500) return fail(res, 400, 'Import at most 500 ads at a time.');

    const ads = await AdExpressAd.find({ _id: { $in: ids }, status: { $ne: 'imported' } }).lean();
    if (!ads.length) return fail(res, 400, 'Those ads are already imported (or no longer staged).');

    // The gate. A phone number read off a scan is a guess until a person has
    // checked it against the printed ad, and a wrong contact number is worse
    // than no lead — so unconfirmed ads are refused outright rather than
    // quietly skipped.
    const importable = ads.filter(canImport);
    const blocked = ads.filter((a) => !canImport(a));

    if (!importable.length) {
      const reasons = [...new Set(blocked.map(whyNotImportable))].join('; ');
      return fail(
        res,
        400,
        `Nothing was imported — none of the selected ads has a confirmed phone number (${reasons}). ` +
          'Open each ad, check the number against the picture of the printed ad, and confirm it.'
      );
    }
    if (blocked.length && req.body?.skipUnconfirmed !== true) {
      const sample = blocked
        .slice(0, 5)
        .map((a) => `${a.headline || a.primaryPhone || 'ad'} (${whyNotImportable(a)})`)
        .join(', ');
      return fail(
        res,
        400,
        `${blocked.length} of the ${ads.length} selected ads have no confirmed phone number: ${sample}. ` +
          'Confirm them, deselect them, or re-send with skipUnconfirmed to import only the confirmed ones.'
      );
    }

    const result = await publishAds(importable, {
      base: req.body?.base,
      defaults: req.body?.defaults && typeof req.body.defaults === 'object' ? req.body.defaults : {},
      addedBy: req.body?.addedBy || 'Adexpress Import',
      addedByRole: req.body?.addedByRole || '',
      forcePreApproved: req.body?.forcePreApproved,
    });

    res.status(201).json({
      message:
        `${result.insertedCount || importable.length} ads imported ` +
        `(${result.preApprovedCount || 0} pre-approved, ${result.pendingCount || 0} pending), ` +
        `${result.cards || 0} detail cards drawn` +
        (blocked.length ? `; ${blocked.length} left behind as unconfirmed.` : '.'),
      skipped: blocked.length,
      cards: result.cards,
      bulkUploadId: result.bulkUploadId,
      fromRentId: result.fromRentId,
      toRentId: result.toRentId,
    });
  })
);

// ── export ─────────────────────────────────────────────────────────────────
router.get(
  '/adexpress/export',
  guard(async (req, res) => {
    const ads = await AdExpressAd.find(adFilter(req.query))
      .sort({ issueDate: -1, pageNo: 1 })
      .limit(5000)
      .lean();

    const sheet = XLSX.utils.json_to_sheet(
      ads.map((a) => ({
        Issue: a.issueLabel,
        Edition: a.edition,
        IssueDate: a.issueDate ? new Date(a.issueDate).toISOString().slice(0, 10) : '',
        Page: a.pageNo,
        Deal: a.dealType,
        Heading: a.headline,
        Phone: a.primaryPhone,
        PhoneStatus: a.phoneStatus,
        ConfirmedBy: a.confirmedBy || '',
        OtherPhones: (a.phones || []).slice(1).join(', '),
        Rent: a.rentAmount ?? '',
        Deposit: a.deposit ?? '',
        Bedrooms: a.bedrooms,
        Mode: a.propertyMode,
        Type: a.propertyType,
        Locality: a.locality,
        Address: a.address,
        AreaSqft: a.areaSqft ?? '',
        Floor: a.floorNo,
        Status: a.status,
        NeedsReview: a.needsReview ? 'yes' : '',
        Text: a.rawText,
      }))
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Adexpress ads');
    const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="adexpress-ads-${Date.now()}.xlsx"`);
    res.send(buffer);
  })
);

// ── scheduled run ──────────────────────────────────────────────────────────
router.get('/adexpress/cron/status', (req, res) => res.json(schedule.state()));

router.post(
  '/adexpress/cron/run-now',
  guard(async (req, res) => {
    if (!config.openaiApiKey) {
      return fail(res, 400, 'OPENAI_API_KEY is not set on the server, so pages cannot be read.');
    }
    // Reading an issue takes minutes, so answer straight away and let the
    // screen poll, exactly like pressing Read on an issue.
    schedule
      .runOnce({ trigger: 'manual', by: req.body?.by || 'Admin' })
      .catch(() => {
        /* the outcome is recorded in the run history */
      });
    res.status(202).json({
      message: 'Looking for the newest issue — this takes a few minutes. Watch the progress bar.',
    });
  })
);

// ── stats ──────────────────────────────────────────────────────────────────
router.get(
  '/adexpress/stats',
  guard(async (req, res) => {
    const readyStatuses = config.requireConfirm ? ['confirmed'] : ['confirmed', 'verified'];
    const [byStatus, byDeal, byPhone, ready, issues, latest] = await Promise.all([
      AdExpressAd.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      AdExpressAd.aggregate([
        { $match: { dealType: config.deal } },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ]),
      AdExpressAd.aggregate([
        { $match: { dealType: config.deal, status: { $ne: 'imported' } } },
        { $group: { _id: '$phoneStatus', n: { $sum: 1 } } },
      ]),
      AdExpressAd.countDocuments({
        dealType: config.deal,
        status: { $nin: ['imported', 'ignored'] },
        phoneStatus: { $in: readyStatuses },
        primaryPhone: { $ne: '' },
      }),
      AdExpressIssue.countDocuments({}),
      AdExpressIssue.findOne({ status: 'processed' }).sort({ issueDate: -1 }).lean(),
    ]);

    const asMap = (rows) => rows.reduce((a, r) => ({ ...a, [r._id || 'unknown']: r.n }), {});
    res.json({
      issues,
      ads: asMap(byStatus),
      deal: config.deal,
      dealAds: asMap(byDeal),
      dealPhones: asMap(byPhone),
      readyToImport: ready,
      requireConfirm: config.requireConfirm,
      latestIssue: latest
        ? { issueLabel: latest.issueLabel, issueDate: latest.issueDate, edition: latest.edition }
        : null,
      activeJob: processor.currentJob(),
    });
  })
);

module.exports = router;
