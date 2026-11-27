// Communication > WhatsApp > Chatbots and Flows.
//
// Two different objects, easy to confuse:
//   CHATBOT  a conversation — a starter (a button tap or a word) and the
//            messages the bot answers with. Id: a Mongo ObjectId.
//   FLOW     a FORM Meta draws inside the chat — screens, fields, Submit.
//            Id: Meta's own fifteen-digit number.
//
// Chatbots:  GET  /message/get-chatbot-flow-items?page=&name=&cusId=
//            POST /message/add-chatbot-flow            {flowName, flowStarter}
//            POST /message/publish-chatbot-flow/<id>
//   There is NO delete: /message/delete-chatbot-message removes one message
//   inside a flow and answers "Record not found!" for a flow id, and
//   SmartGrowth's own trash icon does nothing. So there is no button.
//
// Flows:     GET    /api/get-flows
//            POST   /api/create-flow   {name, categories:[one], isEndpointPowered, endpoint}
//            POST   /api/publish-flow/<id>
//            DELETE /api/delete-flow/<id>
//
// The step builder / screen designer is a canvas editor in SmartGrowth's own
// dashboard; Builder links open it.

const express = require('express');
const sg = require('../client');

const router = express.Router();

// NOT the API base: newapp.smartgrowthai.com serves no interface; the dashboard
// (and the only copy of the builders) is a separate host.
const BUILDER_URL = process.env.SMARTGROWTH_BUILDER_URL || 'https://admin.smartgrowthai.com';

const FLOW_CATEGORIES = ['SIGN_UP', 'SIGN_IN', 'APPOINTMENT_BOOKING', 'LEAD_GENERATION', 'CONTACT_US', 'CUSTOMER_SUPPORT', 'SURVEY', 'OTHER'];

const fail = (res, message, extra = {}) => res.json({ status: 'error', message, ...extra });

async function needToken(res) {
  const s = await sg.settings();
  if (!s.apiToken) { fail(res, 'Add your API token in Settings first (Send Message > More Info).'); return false; }
  return true;
}

/** Check the id, call, relay SmartGrowth's own words. */
async function act(res, method, path, id, idRe, which, done) {
  if (!idRe.test(String(id || ''))) return fail(res, which);
  const r = await sg.request(method, path + id, method === 'POST' ? {} : null);
  if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
  if (r.code < 200 || r.code >= 300) return fail(res, sg.message(r.data, r.code));
  res.json({ status: 'success', message: (r.data && typeof r.data.message === 'string') ? r.data.message : done });
}

// ── Chatbots ───────────────────────────────────────────────────────────────

router.get('/sg/chatbots', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const q = String(req.query.q || '').trim();
    const r = await sg.request('GET', '/message/get-chatbot-flow-items?page=' + page + '&name=' + encodeURIComponent(q) + '&cusId=');
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) return fail(res, sg.message(r.data, r.code));
    const d = r.data || {};
    const rows = (Array.isArray(d.data) ? d.data : []).filter((f) => f && typeof f === 'object').map((f) => ({
      id: String(f._id || ''), name: String(f.flowName || ''), starter: String(f.flowStarter || ''),
      status: String(f.status || ''), when: String(f.createdOn || ''),
    }));
    res.json({
      status: 'success', rows,
      page: Number(d.currentPage) || page, pages: Number(d.totalPages) || 1, total: Number(d.totalItems) || rows.length,
      builderUrl: BUILDER_URL,
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/chatbots', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const name = String((req.body || {}).flowName || '').trim();
    const starter = String((req.body || {}).flowStarter || '').trim();
    if (!name) return fail(res, 'Give the flow a name.');
    if (!starter) return fail(res, 'Say what starts it.');
    if (name.length > 100 || starter.length > 100) return fail(res, 'Name and starter are limited to 100 characters each.');
    // The same rule SmartGrowth applies; their own answer is a 400 with a field list.
    if (!/^[A-Za-z0-9 _,-]+$/.test(name) || !/^[A-Za-z0-9 _,-]+$/.test(starter))
      return fail(res, 'Only letters, numbers, spaces, underscores, commas and dashes are allowed.');
    const r = await sg.request('POST', '/message/add-chatbot-flow', { flowName: name, flowStarter: starter });
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) return fail(res, sg.message(r.data, r.code));
    res.json({ status: 'success', message: (r.data && typeof r.data.message === 'string') ? r.data.message : 'Flow created.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/chatbots/publish', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    await act(res, 'POST', '/message/publish-chatbot-flow/', (req.body || {}).id, /^[0-9a-f]{24}$/i, 'Which flow?', 'Flow published.');
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── Flows ──────────────────────────────────────────────────────────────────

router.get('/sg/flows', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const r = await sg.request('GET', '/api/get-flows');
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) return fail(res, sg.message(r.data, r.code));
    const rows = [];
    for (const f of sg.listOf(r.data)) {
      if (!f || typeof f !== 'object' || f.id === undefined) continue;
      // Meta's reasons a form cannot go live, flattened — they are the whole
      // answer to "why will this not publish".
      const errs = [];
      for (const e of Array.isArray(f.validation_errors) ? f.validation_errors : []) {
        if (e && typeof e === 'object') {
          const msg = String(e.message || '').trim();
          const err = String(e.error || '').trim();
          const bit = err && msg && err !== msg ? err + ' — ' + msg : (msg || err);
          if (bit) errs.push(bit);
        } else if (typeof e === 'string' && e.trim()) errs.push(e.trim());
      }
      rows.push({
        id: String(f.id), name: String(f.name || ''), status: String(f.status || ''),
        category: Array.isArray(f.categories) ? f.categories.join(', ') : '', errors: errs,
      });
    }
    res.json({ status: 'success', rows, total: rows.length, categories: FLOW_CATEGORIES, builderUrl: BUILDER_URL });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/flows', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    const name = String((req.body || {}).name || '').trim();
    const cat = String((req.body || {}).category || '').trim();
    if (!name) return fail(res, 'Give the form a name.');
    if (name.length > 100) return fail(res, 'The name is limited to 100 characters.');
    if (!/^[A-Za-z0-9 _-]+$/.test(name)) return fail(res, 'Only letters, numbers, spaces, underscores and dashes are allowed.');
    if (!FLOW_CATEGORIES.includes(cat)) return fail(res, 'Pick a category.');
    const r = await sg.request('POST', '/api/create-flow', { name, categories: [cat], isEndpointPowered: false, endpoint: '' });
    if (r.error) return fail(res, 'Could not reach SmartGrowth: ' + r.error);
    if (r.code < 200 || r.code >= 300) return fail(res, sg.message(r.data, r.code));
    res.json({ status: 'success', message: (r.data && typeof r.data.message === 'string') ? r.data.message : 'Form created.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/flows/publish', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    await act(res, 'POST', '/api/publish-flow/', (req.body || {}).id, /^[0-9]{5,25}$/, 'Which form?', 'Form published.');
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/flows/delete', async (req, res) => {
  try {
    if (!(await needToken(res))) return;
    await act(res, 'DELETE', '/api/delete-flow/', (req.body || {}).id, /^[0-9]{5,25}$/, 'Which form?', 'Form deleted.');
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
