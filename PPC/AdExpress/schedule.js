// Nightly job: pick up the newest Pondicherry issue, read it, publish the ads.
//
//   1. ask adexpressonline.in for the latest issues
//   2. take the newest one that has a public PDF and has not been read yet
//   3. run it through the reader (boxes -> per-ad OCR -> phone verification)
//   4. publish the rent ads whose number every reading agreed on
//
// Step 4 is the compromise worth being explicit about. The admin screen refuses
// to import a number until a person has confirmed it against the printed ad —
// a cron has nobody to ask. So it publishes only ads whose independent readings
// were unanimous, and everything else (disagreements, unreadable numbers) is
// left in the review queue for a human. Those rows land in **PreApproved**,
// which is itself a staffed review step before a listing goes live, so a person
// still sees every one of them. Set ADEXPRESS_CRON_MIN_PHONE=confirmed to make
// the cron publish nothing at all until someone has confirmed it by hand.
//
// Wiring, in server.js:
//     import adExpressSchedule from './AdExpress/schedule.js';
//     adExpressSchedule.start();

const cron = require('node-cron');

const config = require('./config');
const source = require('./source');
const processor = require('./processor');
const { publishAds } = require('./publish');
const { AdExpressIssue, AdExpressAd } = require('./AdExpressModel');

const LOG = '[AdExpressCron]';

let task = null;
let running = false;

// Last few runs, so the admin screen can show what the schedule has been doing.
const history = [];
let armedAt = null;

function record(entry) {
  history.unshift({ ...entry, at: new Date() });
  if (history.length > 20) history.pop();
  return entry;
}

const state = () => ({
  enabled: config.cron.enabled,
  armed: !!task,
  armedAt,
  cron: config.cron.expression,
  timezone: config.cron.timezone,
  autoPublish: config.cron.autoPublish,
  minPhoneStatus: config.cron.minPhoneStatus,
  running,
  lastRuns: history.slice(0, 10),
});

/** node-cron rejects a bad expression by throwing; check before arming. */
function cronIsValid(expression) {
  try {
    return typeof cron.validate === 'function' ? cron.validate(expression) : true;
  } catch {
    return false;
  }
}

/**
 * Find the newest issue worth reading: published openly, and either never read
 * or read but still without any staged ads.
 */
async function findLatestUnread() {
  const edition = config.editions[0];
  const listed = await source.discoverIssues({ edition, limit: config.cron.lookBack });

  // The newest paper is published on the edition's own page before it appears
  // as a category post, so ask there first — otherwise the job reads last
  // week's issue and calls it done.
  const current = await source.discoverCurrentIssue(edition).catch(() => null);
  if (current && !listed.some((i) => i.pdfUrl === current.pdfUrl)) listed.unshift(current);

  // Newest first, by the date in the PDF's own file name.
  const ordered = listed
    .filter((i) => i.pdfUrl)
    .sort((a, b) => new Date(b.issueDate || 0) - new Date(a.issueDate || 0));

  for (const item of ordered) {
    const existing = await AdExpressIssue.findOne({ issueKey: item.issueKey });
    if (existing && existing.status === 'processed') continue;
    if (existing && existing.status === 'processing') continue;

    const issue = await AdExpressIssue.findOneAndUpdate(
      { issueKey: item.issueKey },
      {
        $set: {
          source: 'site',
          edition: item.edition,
          issueLabel: item.issueLabel,
          issueDate: item.issueDate,
          postId: item.postId,
          postLink: item.postLink,
          pdfUrl: item.pdfUrl,
        },
        $setOnInsert: { issueKey: item.issueKey, status: 'discovered' },
      },
      { upsert: true, new: true }
    );
    return issue;
  }

  return null;
}

/** Which staged ads this run is allowed to publish. */
async function publishableAds(issue) {
  const allowed =
    config.cron.minPhoneStatus === 'confirmed' ? ['confirmed'] : ['confirmed', 'verified'];

  return AdExpressAd.find({
    issue: issue._id,
    dealType: config.deal,
    status: { $nin: ['imported', 'ignored'] },
    phoneStatus: { $in: allowed },
    primaryPhone: { $ne: '' },
  }).lean();
}

/**
 * One full cycle. Safe to call directly (the "Run now" button does).
 * @param {object} options { trigger: 'cron' | 'manual', by }
 */
async function runOnce(options = {}) {
  if (running) return record({ trigger: options.trigger, skipped: 'a run is already in progress' });
  if (processor.currentJob()) {
    return record({ trigger: options.trigger, skipped: 'an issue is being read right now' });
  }

  running = true;
  const started = Date.now();
  try {
    const issue = await findLatestUnread();
    if (!issue) {
      return record({
        trigger: options.trigger,
        ok: true,
        skipped: 'no new issue with a public PDF',
      });
    }

    console.log(`${LOG} reading ${issue.issueLabel || issue.issueKey}`);
    const job = await processor.processIssue(issue, { by: options.by || 'Adexpress cron' });

    let published = null;
    if (config.cron.autoPublish) {
      const ads = await publishableAds(issue);
      if (ads.length) {
        published = await publishAds(ads, {
          base: config.defaultBase,
          addedBy: options.by || 'Adexpress cron',
          addedByRole: 'cron',
          forcePreApproved: config.forcePreApproved,
        });
        console.log(`${LOG} ${published.message || ''}`.trim());
      }
    }

    const held = await AdExpressAd.countDocuments({
      issue: issue._id,
      dealType: config.deal,
      status: { $nin: ['imported', 'ignored'] },
    });

    return record({
      trigger: options.trigger,
      ok: true,
      issueKey: issue.issueKey,
      issueLabel: issue.issueLabel,
      adsFound: job.adsFound,
      rentAdsFound: job.rentAdsFound,
      phonesVerified: job.phonesVerified,
      phonesDisputed: job.phonesDisputed,
      published: published ? published.insertedCount || 0 : 0,
      preApproved: published ? published.preApprovedCount || 0 : 0,
      pending: published ? published.pendingCount || 0 : 0,
      cards: published ? published.cards || 0 : 0,
      bulkUploadId: published ? published.bulkUploadId : null,
      heldForReview: held,
      seconds: Math.round((Date.now() - started) / 1000),
    });
  } catch (err) {
    console.error(`${LOG} run failed:`, err.message);
    return record({
      trigger: options.trigger,
      ok: false,
      error: err.message,
      seconds: Math.round((Date.now() - started) / 1000),
    });
  } finally {
    running = false;
  }
}

/** Arm the schedule. Safe to call once at boot; repeat calls are ignored. */
function start() {
  if (task) return { started: true, already: true };

  if (!config.enabled || !config.cron.enabled) {
    console.log(`${LOG} disabled — the newest issue will not be picked up automatically`);
    return { started: false, reason: 'disabled' };
  }
  if (!config.openaiApiKey) {
    console.log(`${LOG} asleep — OPENAI_API_KEY is not set, so pages cannot be read`);
    return { started: false, reason: 'not-configured' };
  }
  if (!cronIsValid(config.cron.expression)) {
    console.error(`${LOG} invalid ADEXPRESS_CRON "${config.cron.expression}" — not armed`);
    return { started: false, reason: 'invalid-cron' };
  }

  task = cron.schedule(config.cron.expression, () => runOnce({ trigger: 'cron' }), {
    timezone: config.cron.timezone,
  });
  armedAt = new Date();

  console.log(
    `${LOG} armed — "${config.cron.expression}" ${config.cron.timezone}, ` +
      `${config.editions.join('/')}, ` +
      (config.cron.autoPublish
        ? `publishing ${config.cron.minPhoneStatus === 'confirmed' ? 'confirmed' : 'unanimously read'} numbers`
        : 'staging only')
  );

  return { started: true, cron: config.cron.expression, timezone: config.cron.timezone };
}

/** Stop the schedule (used by tests / graceful shutdown). */
function stop() {
  if (task) {
    task.stop();
    task = null;
    armedAt = null;
  }
}

module.exports = { start, stop, runOnce, state };
