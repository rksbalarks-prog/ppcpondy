// Admin "WhatsApp Bot" (Buyer / Seller forms). Mounted under /PPC, BEFORE
// SingleSendRouter (its catch-all GET "/:id").
//
//   GET  /PPC/wa-bot/settings                 settings (token masked) + last run + form status
//   PUT  /PPC/wa-bot/settings                 save settings (a blank token keeps the saved one)
//   POST /PPC/wa-bot/run        {dry}         one poll now; dry = read only, sends nothing
//   GET  /PPC/wa-bot/leads?days=&kind=&page=  what the bot did + counts
//   GET  /PPC/wa-bot/flows/:kind/json         the generated form JSON (buyer | seller)
//   POST /PPC/wa-bot/flows/:kind/upload       create the form in SmartGrowth if needed, upload the JSON (draft)
//   POST /PPC/wa-bot/flows/:kind/publish      publish it in Meta -> every customer gets it
//   POST /PPC/wa-bot/handoff  {phone, wamid}  SHARED NUMBER: PM's bot asks whether a message is ours
//                                             (components/PondyPropertyShare.php) -> {taken, why}

const express = require('express');
const { WaBotSettings, WaBotSeen, getSettings } = require('./models');
const { sg, rows } = require('./smartgrowth');
const { runOnce, handoff } = require('./bot');
const F = require('./flows');
const assistantConfig = require('../assistant/config');
const { getSettings: getAssistantSettings } = require('../assistant/settings');

const router = express.Router();
const DAY = 24 * 60 * 60 * 1000;
const KINDS = ['buyer', 'seller'];

const mask = (t) => (t ? `${'•'.repeat(8)}${String(t).slice(-4)}` : '');
const publicSettings = (s) => ({
  enabled: !!s.enabled,
  baseUrl: s.baseUrl || '',
  apiTokenMasked: mask(s.apiToken),
  hasToken: !!s.apiToken,
  allowList: s.allowList || '',
  buyerFlowId: s.buyerFlowId || '',
  sellerFlowId: s.sellerFlowId || '',
  buyerFlowMode: s.buyerFlowMode || 'draft',
  sellerFlowMode: s.sellerFlowMode || 'draft',
  welcomeText: s.welcomeText || '',
  aiEnabled: !!s.aiEnabled,
  sharedNumber: s.sharedNumber !== false,
  checkedAt: s.checkedAt,
  lastRun: s.lastRun,
});

const fail = (res, code, error) => res.status(code).json({ error });

async function findFlow(s, kind) {
  const r = await sg(s, 'GET', '/api/get-flows');
  if (!r.ok) throw new Error(`Could not read the forms from SmartGrowth: ${r.error}`);
  const list = rows(r.data);
  const id = kind === 'buyer' ? s.buyerFlowId : s.sellerFlowId;
  return list.find((f) => f && String(f.id) === String(id) && id)
    || list.find((f) => f && f.name === F.FLOW_NAMES[kind])
    || null;
}

const flowErrors = (f) => (f && Array.isArray(f.validation_errors) ? f.validation_errors : [])
  .map((e) => (typeof e === 'string' ? e : [e.error, e.message].filter(Boolean).join(' - ')))
  .filter(Boolean);

router.get('/wa-bot/settings', async (req, res) => {
  try {
    const s = await getSettings();
    // Why the AI would / would not answer typed WhatsApp messages (the website assistant's own switches).
    let assistantOn = false;
    try { assistantOn = !!(await getAssistantSettings()).enabled; } catch (_) { /* off */ }
    const ai = {
      configured: assistantConfig.enabled && (assistantConfig.provider !== 'openai' || !!assistantConfig.openai.apiKey),
      assistantOn,
      provider: assistantConfig.provider,
      model: assistantConfig.openai.chatModel,
    };
    const out = { settings: publicSettings(s), flowNames: F.FLOW_NAMES, forms: {}, ai };
    if (s.apiToken) {
      try {
        for (const kind of KINDS) {
          const f = await findFlow(s, kind);
          out.forms[kind] = f ? { id: String(f.id), name: f.name, status: f.status || '', errors: flowErrors(f) } : null;
        }
      } catch (e) {
        out.formsError = e.message;
      }
    }
    res.json(out);
  } catch (e) {
    fail(res, 500, e.message);
  }
});

router.put('/wa-bot/settings', async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};
    if (typeof b.enabled === 'boolean') set.enabled = b.enabled;
    if (typeof b.baseUrl === 'string') {
      const u = b.baseUrl.trim();
      if (u && !/^https:\/\/[a-z0-9.-]+(\/.*)?$/i.test(u)) return fail(res, 400, 'Base URL must start with https://');
      set.baseUrl = u || 'https://newapp.smartgrowthai.com';
    }
    if (typeof b.apiToken === 'string' && b.apiToken.trim() && !b.apiToken.includes('•')) set.apiToken = b.apiToken.trim();
    if (typeof b.allowList === 'string') set.allowList = b.allowList.slice(0, 2000);
    for (const k of ['buyerFlowId', 'sellerFlowId']) {
      if (typeof b[k] === 'string') {
        const v = b[k].trim();
        if (v && !/^\d{5,25}$/.test(v)) return fail(res, 400, `${k} must be the form's number id`);
        set[k] = v;
      }
    }
    for (const k of ['buyerFlowMode', 'sellerFlowMode']) {
      if (b[k] === 'draft' || b[k] === 'published') set[k] = b[k];
    }
    if (typeof b.welcomeText === 'string') set.welcomeText = b.welcomeText.slice(0, 1000);
    if (typeof b.aiEnabled === 'boolean') set.aiEnabled = b.aiEnabled;
    if (typeof b.sharedNumber === 'boolean') set.sharedNumber = b.sharedNumber;
    // Switching the bot on for the first time: start from now, not from old messages.
    if (set.enabled === true) {
      const cur = await getSettings();
      if (!cur.enabled) set.checkedAt = new Date();
    }
    await WaBotSettings.updateOne({ key: 'main' }, { $set: set }, { upsert: true });
    res.json({ settings: publicSettings(await getSettings()) });
  } catch (e) {
    fail(res, 500, e.message);
  }
});

router.post('/wa-bot/run', async (req, res) => {
  try {
    const dry = !(req.body && req.body.dry === false);
    res.json(await runOnce({ dry, force: true }));
  } catch (e) {
    fail(res, 500, e.message);
  }
});

// Called by PM's bot before it stays silent on a property message: would this bot
// answer that number right now? (on, token, shared mode, and not limited to other test
// numbers). Anything but {answering:true} -> PM answers as it always did.
router.get('/wa-bot/shared-status', async (req, res) => {
  try {
    const s = await getSettings();
    const p = String(req.query.phone || '').replace(/\D/g, '').slice(-10);
    const allow = String(s.allowList || '').split(/[\s,;]+/).map((x) => x.replace(/\D/g, '').slice(-10)).filter((t) => t.length === 10);
    const answering = !!(s.enabled && s.apiToken && s.sharedNumber !== false && p.length === 10 && (!allow.length || allow.includes(p)));
    res.json({ answering });
  } catch (e) {
    res.json({ answering: false });
  }
});

// Called by PM's bot (PHP) on the same server - see shared.js. The request is only a
// pointer: bot.handoff() reads the message back from SmartGrowth before taking it.
router.post('/wa-bot/handoff', async (req, res) => {
  try {
    const b = req.body || {};
    res.json(await handoff(String(b.phone || ''), String(b.wamid || '')));
  } catch (e) {
    res.status(500).json({ taken: false, why: e.message });
  }
});

router.get('/wa-bot/leads', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 100;
    const since = new Date(Date.now() - days * DAY);
    const base = { createdAt: { $gte: since }, kind: { $ne: 'ignored' } };
    const filter = { ...base };
    if (req.query.kind) filter.kind = String(req.query.kind);
    const phone = String(req.query.phone || '').replace(/\D/g, '').slice(-10);
    if (phone) filter.phone = new RegExp(phone);

    const [items, matching, byKind] = await Promise.all([
      WaBotSeen.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-__v').lean(),
      WaBotSeen.countDocuments(filter),
      WaBotSeen.aggregate([{ $match: base }, { $group: {
        _id: '$kind', total: { $sum: 1 },
        saved: { $sum: { $cond: [{ $eq: ['$outcome', 'saved'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$outcome', 'failed'] }, 1, 0] } },
        phones: { $addToSet: '$phone' },
      } }]),
    ]);
    const stats = {};
    for (const k of byKind) stats[k._id] = { total: k.total, saved: k.saved, failed: k.failed, people: k.phones.length };
    res.json({ items, matching, page, stats });
  } catch (e) {
    fail(res, 500, e.message);
  }
});

router.get('/wa-bot/flows/:kind/json', (req, res) => {
  if (!KINDS.includes(req.params.kind)) return fail(res, 404, 'unknown form');
  res.json(F.flowJson(req.params.kind));
});

router.post('/wa-bot/flows/:kind/upload', async (req, res) => {
  const { kind } = req.params;
  if (!KINDS.includes(kind)) return fail(res, 404, 'unknown form');
  try {
    const s = await getSettings();
    if (!s.apiToken) return fail(res, 400, 'Save the SmartGrowth API token first.');
    let f = await findFlow(s, kind);
    if (!f) {
      const c = await sg(s, 'POST', '/api/create-flow', {
        name: F.FLOW_NAMES[kind], categories: ['LEAD_GENERATION'], isEndpointPowered: false, endpoint: '',
      }, 60000);
      if (!c.ok) return fail(res, 502, `SmartGrowth would not create the form: ${c.error}`);
      f = await findFlow(s, kind);
      if (!f) return fail(res, 502, 'The form was created but SmartGrowth does not list it yet - press Upload again in a minute.');
    }
    const id = String(f.id);
    const idKey = `${kind}FlowId`;
    const modeKey = `${kind}FlowMode`;
    if (String(f.status || '').toUpperCase() === 'PUBLISHED') {
      await WaBotSettings.updateOne({ key: 'main' }, { $set: { [idKey]: id, [modeKey]: 'published' } });
      return res.json({ id, mode: 'published', errors: [],
        message: `Form ${id} is already published - a published form cannot be changed. To change it, bump its name in WhatsAppBot/flows.js and upload again.` });
    }
    const u = await sg(s, 'POST', `/api/update-flow-json/${id}`, F.flowJson(kind), 60000);
    if (!u.ok) return fail(res, 502, `Upload refused: ${u.error}`);
    const after = await findFlow(s, kind);
    const errors = flowErrors(after);
    await WaBotSettings.updateOne({ key: 'main' }, { $set: { [idKey]: id, [modeKey]: 'draft' } });
    res.json({ id, mode: 'draft', errors,
      message: errors.length
        ? `Uploaded to form ${id}, but Meta found ${errors.length} problem(s).`
        : `Uploaded to form ${id} (Draft). Test it from an allow-listed number, then press Publish.` });
  } catch (e) {
    fail(res, 500, e.message);
  }
});

router.post('/wa-bot/flows/:kind/publish', async (req, res) => {
  const { kind } = req.params;
  if (!KINDS.includes(kind)) return fail(res, 404, 'unknown form');
  try {
    const s = await getSettings();
    const id = kind === 'buyer' ? s.buyerFlowId : s.sellerFlowId;
    if (!s.apiToken || !id) return fail(res, 400, 'Upload the form first.');
    const p = await sg(s, 'POST', `/api/publish-flow/${id}`, {}, 60000);
    if (!p.ok) return fail(res, 502, `Meta would not publish it: ${p.error}`);
    await WaBotSettings.updateOne({ key: 'main' }, { $set: { [`${kind}FlowMode`]: 'published' } });
    res.json({ id, mode: 'published', message: `Form ${id} is published - every customer now gets it.` });
  } catch (e) {
    fail(res, 500, e.message);
  }
});

module.exports = router;
