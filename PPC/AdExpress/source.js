// Talks to adexpressonline.in — the publisher's site — to find issues and fetch
// the ones that are published openly.
//
// Until Oct 2026 the site ran WordPress and the issue list came from its REST
// API (/wp-json/wp/v2/posts). The rebuilt site has no such API (it 404s); its
// public library page /issues links every open issue as
// /issues/<edition>/<YYYY-MM-DD>, and each issue's PDF is served at
// /api/file/paper/<edition>/<YYYY-MM-DD>/paper.pdf. The date in that path is
// the paper's own date, so issue keys stay the same as before.
//
// Two things this module deliberately does NOT do:
//   * it never touches an issue behind the publisher's subscriber paywall — a
//     paywalled issue is recorded as "subscriber only" so an admin can upload
//     the PDF they legitimately have, and that is the end of it;
//   * it never hammers the site — one request at a time, with a delay between
//     them, under an honest User-Agent.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const config = require('./config');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequestAt = 0;

async function politeFetch(url, init = {}) {
  const wait = config.requestDelayMs - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), config.requestTimeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': config.userAgent,
        Accept: init.accept || 'application/json, text/html;q=0.9, */*;q=0.8',
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function assertEdition(edition) {
  if (!config.editions.includes(edition)) {
    throw new Error(
      `This importer only reads the ${config.editions.join(' / ')} edition of Adexpress.`
    );
  }
}

const decodeEntities = (s) =>
  String(s || '')
    .replace(/&#8211;/g, '-')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();

/**
 * Pull the volume, issue number and real publication date out of an issue PDF's
 * file name.
 *
 * This matters more than it looks. The publisher's post dates drift: the post
 * dated 22 Aug 2026 carries "Vol.41-No.20-15-08-2026", the issue from a week
 * earlier. Trusting the post date labelled last week's paper as this week's and
 * hid the current issue entirely. The file name is the one thing that has been
 * consistent across every issue they have published.
 */
function parseIssueFileName(pdfUrl) {
  const name = decodeURIComponent(String(pdfUrl || '').split('/').pop() || '');
  const m = /Vol[.\-_]?(\d+)[.\-_]*(?:No|N)[._\-]*(\d+)[._\-]+(\d{1,2})[.\-](\d{1,2})[.\-](\d{4})/i.exec(name);
  if (!m) return null;

  const [, volume, issue, day, month, year] = m;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return null;

  return {
    volume: Number(volume),
    issue: Number(issue),
    date,
    label: `Volume ${Number(volume)}, Issue ${String(issue).padStart(2, '0')}`,
  };
}

function issueKeyFor(edition, date) {
  const d = new Date(date);
  const iso = Number.isNaN(d.getTime()) ? 'unknown' : d.toISOString().slice(0, 10);
  return `${String(edition).toLowerCase()}-${iso}`;
}

/**
 * List recent issues of one edition.
 * @returns {Promise<Array<{edition,issueKey,issueLabel,issueDate,postId,postLink,pdfUrl,paywalled}>>}
 */
async function discoverIssues({ edition = 'Pondicherry', limit = 12 } = {}) {
  assertEdition(edition);
  const slug = edition.toLowerCase();

  const res = await politeFetch(`${config.site}/issues`, { accept: 'text/html,*/*' });
  if (!res.ok) throw new Error(`Adexpress site returned ${res.status} for the issue list.`);
  const html = await res.text();

  const linkRe = new RegExp(`/issues/${slug}/(\\d{4}-\\d{2}-\\d{2})`, 'g');
  const dates = [...new Set([...html.matchAll(linkRe)].map((m) => m[1]))]
    .sort()
    .reverse()
    .slice(0, Math.min(50, Math.max(1, limit)));
  if (!dates.length && !/\/issues\//.test(html)) {
    throw new Error('Unexpected response from the Adexpress issue list.');
  }

  const issues = [];
  for (const iso of dates) {
    const issueDate = new Date(`${iso}T00:00:00Z`);
    const postLink = `${config.site}/issues/${slug}/${iso}`;
    const meta = await issueMeta(postLink);
    issues.push({
      edition,
      issueKey: issueKeyFor(edition, issueDate),
      issueLabel: meta ? meta.label : `Issue of ${iso}`,
      issueDate,
      issueNumber: meta ? meta.issue : null,
      postId: null,
      postLink,
      pdfUrl: `${config.site}/api/file/paper/${slug}/${iso}/paper.pdf`,
      paywalled: false,
    });
  }
  return issues;
}

/**
 * Volume / issue number from an issue page's title, e.g.
 * "Adexpress Pondicherry 17 October 2026 — Vol 41 · No 29 | Read Online or PDF".
 */
async function issueMeta(pageUrl) {
  try {
    const res = await politeFetch(pageUrl, { accept: 'text/html,*/*' });
    if (!res.ok) return null;
    const title = decodeEntities((/<title[^>]*>([^<]*)<\/title>/i.exec(await res.text()) || [])[1]);
    const m = /Vol\.?\s*(\d+)\D{1,6}No\.?\s*(\d+)/i.exec(title);
    if (!m) return null;
    return {
      volume: Number(m[1]),
      issue: Number(m[2]),
      label: `Volume ${Number(m[1])}, Issue ${String(m[2]).padStart(2, '0')}`,
    };
  } catch {
    return null;
  }
}

/**
 * The newest open issue of the edition. On the old WordPress site this lived on
 * a separate page ahead of the category posts; on the rebuilt site /issues
 * already lists it first, so this is just the head of that list.
 */
async function discoverCurrentIssue(edition = 'Pondicherry') {
  if (!config.editions.includes(edition)) return null;
  const [newest] = await discoverIssues({ edition, limit: 1 });
  return newest || null;
}


/**
 * Download an issue PDF to the module's storage directory.
 * @returns {Promise<{filePath:string, bytes:number}>}
 */
async function downloadPdf(pdfUrl, issueKey) {
  if (!/^https?:\/\//i.test(pdfUrl)) throw new Error('Issue PDF link is not a valid URL.');

  await fsp.mkdir(config.storageDir, { recursive: true });
  const filePath = path.join(config.storageDir, `${issueKey}.pdf`);

  const res = await politeFetch(pdfUrl, { accept: 'application/pdf,*/*' });
  if (!res.ok) throw new Error(`Could not download the issue PDF (HTTP ${res.status}).`);

  const declared = Number(res.headers.get('content-length') || 0);
  if (declared && declared > config.maxPdfBytes) {
    throw new Error(`Issue PDF is larger than the ${config.maxPdfBytes} byte limit.`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > config.maxPdfBytes) {
    throw new Error(`Issue PDF is larger than the ${config.maxPdfBytes} byte limit.`);
  }
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new Error('That link did not return a PDF.');
  }

  await fsp.writeFile(filePath, buffer);
  return { filePath, bytes: buffer.length };
}

/** Remove a stored PDF once its ads are extracted (when keepPdf is off). */
async function removePdf(filePath) {
  if (!filePath) return;
  try {
    await fsp.unlink(filePath);
  } catch {
    /* already gone — nothing to do */
  }
}

const pdfExists = (filePath) => !!filePath && fs.existsSync(filePath);

module.exports = {
  discoverIssues,
  discoverCurrentIssue,
  parseIssueFileName,
  downloadPdf,
  removePdf,
  pdfExists,
  issueKeyFor,
};
