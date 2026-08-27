// Runs one issue end to end: PDF -> page scans -> ad boxes -> verified ad records.
//
//   1. make sure the issue PDF is on disk (download it if it is public)
//   2. lift the page scans out of the PDF                     (pdfImages.js)
//   3. ask the model which pages carry property ads            (vision.triagePage)
//   4. find the ad boxes on those pages from the printed rules (boxes.js)
//   5. read each box ON ITS OWN, then read its phone digits
//      again, independently, until the passes agree             (vision + normalize)
//   6. save a picture of every ad so a person can confirm it    (crops.js)
//
// Step 5 is the point of the whole design. Reading six ads at once, the model
// misread and sometimes invented phone digits; reading one ad at a time and
// requiring three independent passes to agree, it has been exact. Numbers that
// do not reach unanimity are kept as candidates and marked for a human.
//
// Pages are handled strictly one at a time — a decoded page is ~200 MB of RGBA
// and the VPS does not have room for two. Work within a page runs a few at a
// time (config.concurrency).

const fsp = require('fs/promises');
const jpeg = require('jpeg-js');

const config = require('./config');
const { extractJpegPages, extractTextLayer } = require('./pdfImages');
const { tilePage } = require('./tiles');
const { detectAdBoxes, cropRaw } = require('./boxes');
const crops = require('./crops');
const vision = require('./vision');
const { normalizeAd, mergeAds, resolvePhones, adKeyFor } = require('./normalize');
const source = require('./source');
const { AdExpressIssue, AdExpressAd } = require('./AdExpressModel');

// One issue at a time, process-wide. Two concurrent OCR runs would double peak
// memory for no gain — the model calls, not the CPU, are the slow part.
let activeJob = null;
const recentJobs = new Map(); // issueId -> last finished job snapshot

const snapshot = (job) => (job ? { ...job, pages: undefined } : null);

function getJob(issueId) {
  if (activeJob && String(activeJob.issueId) === String(issueId)) return snapshot(activeJob);
  return recentJobs.get(String(issueId)) || null;
}

const currentJob = () => snapshot(activeJob);

/** Run `worker` over `items`, `limit` at a time, preserving order. */
async function pooled(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) || 1 }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

function addUsage(job, usage) {
  if (!usage) return;
  job.promptTokens += Number(usage.prompt_tokens) || 0;
  job.completionTokens += Number(usage.completion_tokens) || 0;
}

/**
 * Read one detected ad box: what is it, and — if it is the kind of ad we would
 * import — what exactly is the phone number.
 */
async function readBox(job, boxJpeg, meta, issueContext) {
  const { ad: rawAd, usage } = await vision.extractAdFromBox(boxJpeg);
  addUsage(job, usage);
  job.boxesRead += 1;
  if (!rawAd) return null; // not a property ad — a job ad, a picture, a rule

  const dealType = String(rawAd.dealType || 'unknown').toLowerCase();
  const wantsVerification =
    config.phoneReads > 0 &&
    (config.verifyDeals.includes('all') || config.verifyDeals.includes(dealType));

  let verification = null;
  if (wantsVerification) {
    job.phase = `confirming a phone number on page ${meta.pageNo}`;
    const passes = await pooled(
      Array.from({ length: config.phoneReads }, (_, i) => i),
      Math.min(config.concurrency, config.phoneReads),
      async (pass) => {
        try {
          const read = await vision.readPhoneDigits(boxJpeg, pass);
          addUsage(job, read.usage);
          return read.numbers;
        } catch (err) {
          job.warnings.push(`page ${meta.pageNo}: a phone reading failed (${err.message})`);
          return null;
        }
      }
    );
    const good = passes.filter(Array.isArray);
    // A failed pass must not be allowed to make agreement easier.
    verification = good.length === config.phoneReads ? resolvePhones(good, rawAd.phones) : null;
    if (verification) {
      job.phonesVerified += verification.phoneStatus === 'verified' ? 1 : 0;
      job.phonesDisputed += verification.phoneStatus === 'disputed' ? 1 : 0;
    }
  }

  const ad = normalizeAd(rawAd, { ...issueContext, pageNo: meta.pageNo }, verification);
  ad.box = meta.box;
  ad.pageWidth = meta.pageWidth;
  ad.pageHeight = meta.pageHeight;
  ad.adKey = adKeyFor(ad);
  ad.cropJpeg = boxJpeg; // written to disk once the ad survives merging
  return ad;
}

/** Fallback for a page whose boxes could not be found: read overlapping tiles. */
async function readPageByTiles(job, pageJpeg, pageNo, issueContext) {
  const { tiles } = tilePage(pageJpeg, config.tile);
  job.tilesTotal += tiles.length;

  const perTile = await pooled(tiles, config.concurrency, async (tile) => {
    try {
      const { ads, usage } = await vision.extractAdsFromTile(tile.jpeg);
      addUsage(job, usage);
      job.tilesDone += 1;
      // No per-ad picture and no second reading here, so nothing from this path
      // is ever treated as a confirmed number.
      return ads.map((raw) => {
        const ad = normalizeAd(raw, { ...issueContext, pageNo }, null);
        ad.cropJpeg = tile.jpeg;
        ad.adKey = adKeyFor(ad);
        return ad;
      });
    } catch (err) {
      job.tilesDone += 1;
      job.warnings.push(`page ${pageNo} crop ${tile.row}${tile.col}: ${err.message}`);
      return [];
    }
  });

  return perTile.flat();
}

/** Read one page: boxes if we can find them, tiles if we cannot. */
async function readPage(job, pageJpeg, pageNo, issueContext, record) {
  let boxes = [];
  let decoded = null;

  if (config.useBoxes) {
    try {
      decoded = jpeg.decode(pageJpeg, { useTArray: true, maxMemoryUsageInMB: 512 });
      boxes = detectAdBoxes(decoded);
    } catch (err) {
      job.warnings.push(`page ${pageNo}: could not scan for ad boxes (${err.message})`);
    }
  }

  record.boxesFound = boxes.length;

  if (boxes.length > config.maxBoxesPerPage) {
    job.warnings.push(
      `page ${pageNo}: ${boxes.length} boxes found, reading the first ${config.maxBoxesPerPage}`
    );
    boxes = boxes.slice(0, config.maxBoxesPerPage);
  }

  if (boxes.length < config.minBoxesPerPage) {
    record.readBy = 'tiles';
    if (config.useBoxes) {
      job.warnings.push(
        `page ${pageNo}: only ${boxes.length} ad boxes found, fell back to reading crops ` +
          '(numbers from this page are not double-checked)'
      );
    }
    return readPageByTiles(job, pageJpeg, pageNo, issueContext);
  }

  record.readBy = 'boxes';
  job.boxesTotal += boxes.length;
  job.phase = `reading ${boxes.length} ads on page ${pageNo}`;

  const results = await pooled(boxes, config.concurrency, async (box) => {
    try {
      const raw = cropRaw(decoded, box, 3);
      const boxJpeg = crops.encode(raw);
      return await readBox(
        job,
        boxJpeg,
        { pageNo, box, pageWidth: decoded.width, pageHeight: decoded.height },
        issueContext
      );
    } catch (err) {
      job.boxesRead += 1;
      job.warnings.push(`page ${pageNo} box at ${box.x},${box.y}: ${err.message}`);
      return null;
    }
  });

  return results.filter(Boolean);
}

/**
 * Process one issue document. Returns a summary; throws only on a failure that
 * stops the whole issue (missing PDF, no readable pages, no API key).
 */
async function processIssue(issueDoc, options = {}) {
  if (!config.enabled) throw new Error('The Adexpress importer is disabled (ADEXPRESS_ENABLED).');
  if (activeJob) {
    throw new Error(
      `Another issue is being read right now (${activeJob.issueLabel || activeJob.issueKey}). Try again when it finishes.`
    );
  }

  const job = {
    issueId: String(issueDoc._id),
    issueKey: issueDoc.issueKey,
    issueLabel: issueDoc.issueLabel,
    status: 'running',
    phase: 'preparing',
    pageNo: 0,
    pageCount: 0,
    pagesToRead: 0,
    pagesRead: 0,
    boxesTotal: 0,
    boxesRead: 0,
    tilesTotal: 0,
    tilesDone: 0,
    adsFound: 0,
    rentAdsFound: 0,
    phonesVerified: 0,
    phonesDisputed: 0,
    newAds: 0,
    duplicateAds: 0,
    promptTokens: 0,
    completionTokens: 0,
    warnings: [],
    error: '',
    startedAt: new Date(),
    finishedAt: null,
    by: options.by || '',
  };
  activeJob = job;

  try {
    // ── 1. PDF on disk ─────────────────────────────────────────────────────
    let pdfPath = issueDoc.pdfPath;
    if (!source.pdfExists(pdfPath)) {
      if (!issueDoc.pdfUrl) {
        throw new Error(
          'This issue has no downloadable PDF (subscriber-only on the publisher\'s site). Upload the PDF to read it.'
        );
      }
      job.phase = 'downloading';
      const dl = await source.downloadPdf(issueDoc.pdfUrl, issueDoc.issueKey);
      pdfPath = dl.filePath;
      issueDoc.pdfPath = dl.filePath;
      issueDoc.pdfBytes = dl.bytes;
    }

    issueDoc.status = 'processing';
    issueDoc.error = '';
    await issueDoc.save();

    // ── 2. page scans ──────────────────────────────────────────────────────
    job.phase = 'reading pdf';
    const buffer = await fsp.readFile(pdfPath);
    let pages = extractJpegPages(buffer);
    const textLayer = pages.length ? '' : extractTextLayer(buffer);

    if (!pages.length && textLayer.length < 200) {
      throw new Error(
        'No readable pages found in this PDF — it is neither a page scan nor a text PDF.'
      );
    }

    const issueContext = {
      issue: issueDoc._id,
      issueKey: issueDoc.issueKey,
      issueLabel: issueDoc.issueLabel,
      issueDate: issueDoc.issueDate,
      edition: issueDoc.edition,
    };

    const collected = [];
    const pageRecords = [];

    if (!pages.length) {
      // Digital-native issue: parse the text layer instead of OCR'ing images.
      job.phase = 'reading text';
      job.pageCount = 1;
      job.pagesToRead = 1;
      const { ads, usage } = await vision.extractAdsFromText(textLayer);
      addUsage(job, usage);
      collected.push(
        ...ads.map((raw) => {
          const ad = normalizeAd(raw, { ...issueContext, pageNo: 0 }, null);
          ad.adKey = adKeyFor(ad);
          return ad;
        })
      );
      job.pagesRead = 1;
      pageRecords.push({
        pageNo: 0,
        hasProperty: true,
        hasRent: true,
        readBy: 'text',
        adsFound: ads.length,
      });
      issueDoc.hasTextLayer = true;
    } else {
      if (pages.length > config.maxPages) {
        job.warnings.push(`Issue has ${pages.length} pages; only the first ${config.maxPages} were read.`);
        pages = pages.slice(0, config.maxPages);
      }
      job.pageCount = pages.length;
      issueDoc.pageCount = pages.length;

      // Explicit page numbers from the caller win over triage.
      const wanted =
        Array.isArray(options.pages) && options.pages.length
          ? new Set(options.pages.map(Number))
          : null;

      for (let i = 0; i < pages.length; i++) {
        const pageNo = i + 1;
        job.pageNo = pageNo;
        const record = { pageNo, boxesFound: 0, adsFound: 0, rentAdsFound: 0, skipped: false };

        try {
          if (wanted && !wanted.has(pageNo)) {
            record.skipped = true;
            pageRecords.push(record);
            continue;
          }

          if (!wanted && !config.ocrAllPages && !options.ocrAll) {
            job.phase = `checking page ${pageNo}`;
            const triage = await vision.triagePage(pages[i].jpeg);
            addUsage(job, triage.usage);
            record.hasProperty = triage.hasProperty;
            record.hasRent = triage.hasRent;
            record.sections = triage.sections;
            if (!triage.hasProperty && !triage.hasRent) {
              record.skipped = true;
              pageRecords.push(record);
              continue;
            }
          }

          job.pagesToRead += 1;
          const ads = await readPage(job, pages[i].jpeg, pageNo, issueContext, record);
          record.adsFound = ads.length;
          record.rentAdsFound = ads.filter((a) => a.dealType === config.deal).length;
          collected.push(...ads);
          job.pagesRead += 1;
        } catch (err) {
          record.error = err.message;
          job.warnings.push(`page ${pageNo}: ${err.message}`);
        }

        pageRecords.push(record);
        // Let the page buffer go before decoding the next one.
        pages[i].jpeg = null;
      }
    }

    // ── 3. merge + store ───────────────────────────────────────────────────
    job.phase = 'saving';
    const merged = mergeAds(collected);
    job.adsFound = merged.length;
    // Counted for whichever side of the paper this app publishes (sale here).
    job.rentAdsFound = merged.filter((a) => a.dealType === config.deal).length;

    for (const ad of merged) {
      const doc = { ...ad };
      const cropJpeg = doc.cropJpeg;
      delete doc.cropJpeg;
      delete doc.tile;

      try {
        // The picture of the ad is what a person confirms the number against,
        // so it is written before the record it belongs to.
        if (cropJpeg) {
          doc.cropPath = await crops.save(doc.adKey, cropJpeg);
        }

        const res = await AdExpressAd.updateOne(
          { adKey: doc.adKey },
          { $setOnInsert: { ...doc, status: 'new' } },
          { upsert: true }
        );
        if (res.upsertedCount) {
          job.newAds += 1;
        } else {
          // Already staged — a re-run must never overwrite the reviewer's
          // corrections or their confirmation, so only the counter moves.
          job.duplicateAds += 1;
          await AdExpressAd.updateOne(
            { adKey: doc.adKey },
            { $max: { seenTimes: doc.seenTimes || 1 } }
          );
        }
      } catch (err) {
        if (err && err.code === 11000) job.duplicateAds += 1;
        else job.warnings.push(`could not save an ad: ${err.message}`);
      }
    }

    // ── 4. finish ──────────────────────────────────────────────────────────
    issueDoc.pages = pageRecords;
    issueDoc.adsFound = job.adsFound;
    issueDoc.rentAdsFound = job.rentAdsFound;
    issueDoc.newAds = job.newAds;
    issueDoc.duplicateAds = job.duplicateAds;
    issueDoc.phonesVerified = job.phonesVerified;
    issueDoc.phonesDisputed = job.phonesDisputed;
    issueDoc.promptTokens = (issueDoc.promptTokens || 0) + job.promptTokens;
    issueDoc.completionTokens = (issueDoc.completionTokens || 0) + job.completionTokens;
    issueDoc.status = 'processed';
    issueDoc.processedAt = new Date();
    issueDoc.processedBy = job.by;
    issueDoc.error = job.warnings.slice(0, 5).join(' • ');
    await issueDoc.save();

    if (!config.keepPdf) {
      await source.removePdf(issueDoc.pdfPath);
      issueDoc.pdfPath = '';
      await issueDoc.save();
    }

    job.status = 'done';
    job.phase = 'finished';
    return job;
  } catch (err) {
    job.status = 'failed';
    job.phase = 'failed';
    job.error = err.message;
    try {
      issueDoc.status = 'failed';
      issueDoc.error = err.message;
      await issueDoc.save();
    } catch {
      /* the original error is what matters */
    }
    throw err;
  } finally {
    job.finishedAt = new Date();
    recentJobs.set(String(issueDoc._id), snapshot(job));
    if (recentJobs.size > 20) recentJobs.delete(recentJobs.keys().next().value);
    activeJob = null;
  }
}

module.exports = { processIssue, getJob, currentJob };
