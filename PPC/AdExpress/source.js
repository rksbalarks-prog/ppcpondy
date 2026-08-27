// Talks to adexpressonline.in — the publisher's site — to find issues and fetch
// the ones that are published openly.
//
// The site runs WordPress, so the issue list comes from its public REST API
// (/wp-json/wp/v2/posts) rather than from scraping rendered HTML: fewer
// requests, nothing to re-learn when they restyle the site, and the response
// tells us plainly whether an issue is public.
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

/** Resolve the WordPress category id for an edition, by slug, with a fallback. */
async function categoryId(edition) {
  if (!config.editions.includes(edition)) {
    throw new Error(
      `This importer only reads the ${config.editions.join(' / ')} edition of Adexpress.`
    );
  }
  const known = config.categories[edition];
  try {
    const res = await politeFetch(
      `${config.site}/wp-json/wp/v2/categories?slug=${encodeURIComponent(edition.toLowerCase())}`
    );
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list[0]?.id) return list[0].id;
    }
  } catch {
    /* fall through to the configured id */
  }
  if (!known) throw new Error(`Unknown Adexpress edition "${edition}".`);
  return known;
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
  const catId = await categoryId(edition);
  const perPage = Math.min(50, Math.max(1, limit));
  const url =
    `${config.site}/wp-json/wp/v2/posts?categories=${catId}&per_page=${perPage}` +
    `&_fields=id,date,link,title,content`;

  const res = await politeFetch(url);
  if (!res.ok) throw new Error(`Adexpress site returned ${res.status} for the issue list.`);
  const posts = await res.json();
  if (!Array.isArray(posts)) throw new Error('Unexpected response from the Adexpress issue list.');

  return posts.map((post) => {
    const html = post?.content?.rendered || '';
    // The issue PDF is linked from the page image at the top of the post.
    const pdfUrl = (html.match(/https:\/\/[^"'\s]+?\.pdf/i) || [])[0] || '';
    const paywalled =
      !pdfUrl && (/jetpack-paywall/i.test(html) || /Subscribe to keep reading/i.test(html));

    const clean = pdfUrl ? pdfUrl.replace(/&#0?38;/g, '&') : '';
    const fromName = clean ? parseIssueFileName(clean) : null;
    const issueDate = fromName ? fromName.date : post.date ? new Date(post.date) : null;

    return {
      edition,
      issueKey: issueKeyFor(edition, issueDate),
      issueLabel:
        decodeEntities(post?.title?.rendered).replace(/^Adexpress\s+\w+\s+/i, '') ||
        (fromName ? fromName.label : ''),
      issueDate,
      issueNumber: fromName ? fromName.issue : null,
      postId: post.id,
      postLink: post.link || '',
      pdfUrl: clean,
      paywalled,
    };
  });
}

/**
 * The edition's "your local issues" page, which carries the CURRENT issue —
 * often a week ahead of the newest category post. Without this the importer
 * simply never sees the paper that came out this week.
 */
async function discoverCurrentIssue(edition = 'Pondicherry') {
  if (!config.editions.includes(edition)) return null;

  const url = `${config.site}/your-local-issues-2/${edition.toLowerCase()}/`;
  const res = await politeFetch(url, { accept: 'text/html,*/*' });
  if (!res.ok) return null;

  const html = await res.text();
  const pdfUrl = (html.match(/https:\/\/[^"'\s]+?\.pdf/i) || [])[0];
  if (!pdfUrl) return null;

  const fromName = parseIssueFileName(pdfUrl);
  if (!fromName) return null;

  const heading = decodeEntities((html.match(/<h[12][^>]*>([^<]{3,90})<\/h[12]>/g) || [])
    .map((h) => h.replace(/<[^>]*>/g, ''))
    .find((h) => /volume|vol|N\.\d/i.test(h)) || '');

  return {
    edition,
    issueKey: issueKeyFor(edition, fromName.date),
    issueLabel: fromName.label,
    issueDate: fromName.date,
    issueNumber: fromName.issue,
    postId: null,
    postLink: url,
    pdfUrl,
    paywalled: false,
    heading,
  };
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
