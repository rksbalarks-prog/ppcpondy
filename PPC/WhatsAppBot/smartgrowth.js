// SmartGrowth API client - the same calls the Pondicherry Matrimony bot makes.
//
// SmartGrowth is an official WhatsApp Business (Cloud API) provider. Its
// /api/send-raw-message is a straight passthrough to Meta, so the bot can send
// reply buttons and Flow forms. Nothing has to be configured at SmartGrowth's
// end (no webhook): the bot polls.
//
//   GET  /api/get-my-chats?from=&tn=            conversations [{from, lastUpdated}]
//   GET  /api/user-chats/<phone>                {messages:[{from, wamid, body, createdOn}]}
//   GET  /message/get-flow-response?...         {data:[{from, wamid, data:{...form, flow_token}}]}
//   POST /api/send-raw-message                  a Meta message payload
//   GET  /api/get-flows                         {data:[{id, name, status, validation_errors}]}
//   POST /api/create-flow                       {name, categories:[one]}
//   POST /api/update-flow-json/<id>             the Flow JSON
//   POST /api/publish-flow/<id>

const axios = require('axios');

async function sg(settings, method, path, body, timeout = 40000) {
  const base = String(settings.baseUrl || 'https://newapp.smartgrowthai.com').replace(/\/+$/, '');
  try {
    const res = await axios({
      method,
      url: base + path,
      data: body,
      timeout,
      headers: { Accept: 'application/json', Authorization: `Bearer ${settings.apiToken}` },
      validateStatus: () => true,
    });
    const ok = res.status >= 200 && res.status < 300;
    return { ok, code: res.status, data: res.data, error: ok ? '' : sgMessage(res.data, res.status) };
  } catch (err) {
    return { ok: false, code: 0, data: null, error: err.message };
  }
}

function sgMessage(d, code) {
  if (d && typeof d === 'object') {
    const m = d.message || d.error || (d.error && d.error.message);
    if (m) return typeof m === 'string' ? m : JSON.stringify(m);
  }
  if (typeof d === 'string' && d.trim()) return d.slice(0, 200);
  return `HTTP ${code}`;
}

// A bare list or {data:[...]} - read both ways so a change at their end does
// not silently empty a list.
const rows = (d) => (Array.isArray(d) ? d : d && Array.isArray(d.data) ? d.data : []);

module.exports = { sg, rows };
