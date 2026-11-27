// POST /send/campaign — the one call every template message goes through.
//
// Field names are SmartGrowth's own, from their Campaign API docs
// (/home/campaign-api-docs in their dashboard), confirmed on PM's account:
//
//   bodyParams    the body's {{1}} {{2}} ... — NOT `variables` (Meta answered
//                 "(#132000) Number of parameters does not match" to every guess)
//   headerParams  the header's own {{1}}, counted separately by Meta; never
//                 merged into bodyParams
//   mediaUrl      the header file — must be publicly fetchable, Meta fetches it
//   filename      a document's display name

const sg = require('./client');
const { SgCampaignLog } = require('./models');
const { isPublicUrl } = require('./util');

/**
 * The header's file and its own {{1}}, read and checked once for every send
 * mode — single, bulk, sheet and the template sent from Chats cannot disagree
 * about what a header needs.
 */
function headerFields(b) {
  const mediaUrl = String(b.mediaUrl || '').trim();
  if (mediaUrl && !isPublicUrl(mediaUrl))
    return { error: 'The header file’s link has to be a full http:// or https:// address that anyone can open — WhatsApp fetches it itself. Upload the file instead if you have no public link for it.' };
  const hp = Array.isArray(b.headerParams) ? b.headerParams.map(String).filter((x) => x.trim() !== '') : [];
  return { mediaUrl, fileName: String(b.fileName || '').trim(), headerParams: hp };
}

function payload({ templateId, apiCode, campaignName, phones, bodyParams, headerParams, mediaUrl, fileName }) {
  const p = { templateId: String(templateId), apiCode, campaignName, phoneNumbers: phones };
  // Meta refuses a parameter with no text in it, so a value the data did not
  // have (no area on a listing, no name) goes as "-" rather than failing the send.
  const body = (bodyParams || []).map((v) => (String(v === undefined || v === null ? '' : v).trim() === '' ? '-' : String(v)));
  if (body.length) p.bodyParams = body;
  const head = (headerParams || []).map(String).filter((x) => x !== '');
  if (head.length) p.headerParams = head;
  if (mediaUrl) {
    p.mediaUrl = String(mediaUrl).trim();
    if (fileName) p.filename = String(fileName).trim();
  }
  return p;
}

/** Send one template to one or more numbers. Answers the client's { code, data, error } plus ok/msg. */
async function sendTemplate(opts) {
  const s = await sg.settings();
  const r = await sg.request('POST', '/send/campaign', payload({ ...opts, apiCode: s.apiCode }));
  const okSend = sg.ok(r);
  const msg = (r.data && typeof r.data.message === 'string') ? r.data.message : (r.error || 'HTTP ' + r.code);
  return { ...r, okSend, msg };
}

/** One row per send in the Recent Campaigns log. Never fatal. */
async function logCampaign({ templateId, templateName, campaignName, phones, vars, r, ok, by }) {
  try {
    await SgCampaignLog.create({
      templateId, templateName, campaignName,
      phoneNumbers: phones, phoneCount: phones.length,
      variables: vars && vars.length ? vars : undefined,
      httpCode: r.code, status: ok ? 'success' : 'failed',
      response: String(r.body || r.error || '').slice(0, 2000),
      createdByName: by || '',
    });
  } catch (e) {
    console.warn('[SmartGrowth] campaign log failed:', e.message);
  }
}

module.exports = { headerFields, payload, sendTemplate, logCampaign };
