// Pondy Property WhatsApp bot: "Buyer or Seller?" -> a short Flow form -> a
// Buyer Assistance request or a property listing.
//
// Built the way the Pondicherry Matrimony bot is (WhatsappBot.php): it POLLS
// SmartGrowth rather than waiting for a webhook, and claims every message by
// its wamid before acting on it.
//
//   someone writes anything ("Hi")      -> welcome with two buttons: Buyer | Seller
//   taps Buyer (or types "buy")         -> the BUYER form
//   taps Seller (or types "sell")       -> the SELLER form
//   submits the Buyer form              -> POST /PPC/add-buyerAssistance  (ba_status baPending)
//   submits the Seller form             -> POST /PPC/bulk-upload-properties (status complete -> PreApproved)
//   TYPES a question (AI switched on)   -> the AI assistant answers (ai.js - OpenAI, same as the website),
//                                          and its offers become the Buyer / Seller form or a link button
//
// Everything in the conversation - typed lines, AI answers, buttons, forms sent,
// forms submitted - is written to the assistant's store, which is what the admin
// "AI Handled" page shows (same as the PM admin's AI Handled).
//
// Both records go through the app's OWN create endpoints - same ID allocation,
// same admin notifications, same completeness gate - so a WhatsApp lead is
// indistinguishable from one an admin typed in, and staff approve it as usual.

const { sg, rows } = require('./smartgrowth');
const { WaBotSettings, WaBotSeen, getSettings } = require('./models');
const F = require('./flows');
const { kindOf, toBuyerRequest, toSellerRow, ten } = require('./forms');
const ai = require('./ai');
const { sendTemplate } = require('../WhatsAppTemplates/sender');
const { isPropertyMessage, ACTIVE_MINUTES } = require('./shared');

const LOG = '[WhatsAppBot]';

/** Never answer a message older than this: a late reply reads as a broken bot. */
const STALE_MINUTES = 10;
/** Look this far before the last run's mark, so a thread that moved mid-run is not missed. */
const OVERLAP_MINUTES = 10;
const MAX_THREADS_PER_RUN = 40;
/** Typed text the bot does not recognise gets the welcome at most this often. */
const WELCOME_COOLDOWN_MIN = 360;
/** Even "Hi" twice in a row only gets one welcome. */
const GREETING_COOLDOWN_MIN = 2;
/** Form submissions older than this are not acted on (first run on an old account). */
const FORM_MAX_AGE_HOURS = 24;

const TITLE_MAX = 20;
const BODY_MAX = 1024;
const SITE = 'https://pondyproperty.com';

const SELF_BASE = () =>
  (process.env.WA_BOT_SELF_BASE || `http://127.0.0.1:${process.env.PORT || 5006}/PPC`).replace(/\/+$/, '');

const DEFAULT_WELCOME =
  'Welcome to *Pondy Properties* 🏠\n\n' +
  'Are you looking to *buy* a property, or do you want to *sell* yours?\n\n' +
  'Tap a button below - it takes less than a minute.';

const digits = (v) => String(v || '').replace(/\D/g, '');
const fit = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/** What a message asks for, or null if it is not for this bot. */
function intent(body) {
  if (!String(body || '').trim()) return null;
  const b = String(body).toLowerCase().replace(/[^a-z஀-௿ ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!b) return { do: 'welcome', greeting: false }; // an emoji / sticker on its own
  // Another business's auto-reply or a shared location: answering it only starts two bots talking.
  if (/thank(s| you) for (contacting|your message|reaching|messaging)|we re (currently )?(unavailable|away|closed)|will get back to you|latitude/.test(b)) {
    return { do: 'ignore' };
  }
  if (/^(i am |i m |im )?(a )?(buyer|buy|buying|i want to buy|want to buy|purchase)( property)?$/.test(b)) return { do: 'buyer' };
  if (/^(i am |i m |im )?(a )?(seller|sell|selling|owner|i want to sell|want to sell)( (my )?property)?$/.test(b)) return { do: 'seller' };
  if (/^(hi+|hello+|hey+|hai+|helo|vanakkam|menu|start|property|properties|pondy ?property|help)\b/.test(b)) {
    return { do: 'welcome', greeting: true };
  }
  return { do: 'welcome', greeting: false };
}

class Run {
  constructor(settings, { dry = false, aiOn = false } = {}) {
    this.s = settings;
    this.dry = dry;
    this.aiOn = aiOn;
    this.aiAnswered = 0;
    // One WhatsApp number shared with Pondicherry Matrimony (see shared.js).
    this.shared = settings.sharedNumber !== false;
    this.handoffs = new Set(); // wamids PM's bot handed to us
    this.log = [];
    this.sent = 0;
    this.failed = 0;
    this.saved = 0;
    this.allow = String(settings.allowList || '').split(/[\s,;]+/).map(ten).filter((t) => t.length === 10);
  }

  say(line) {
    this.log.push(line);
    if (this.log.length > 300) this.log.shift();
  }

  allowed(phone) {
    return !this.allow.length || this.allow.includes(ten(phone));
  }

  // ── claim / finish ────────────────────────────────────────────────────────
  async claim(wamid, phone, kind, body) {
    if (this.dry) {
      const n = await WaBotSeen.countDocuments({ wamid });
      return n === 0;
    }
    try {
      // Insert-if-absent: true only for the run that created the row. Safe on its own for
      // runs one after another; the unique index on wamid also covers two at the same moment.
      const r = await WaBotSeen.updateOne(
        { wamid },
        { $setOnInsert: { wamid, phone: ten(phone), kind, body: String(body || '').slice(0, 250), outcome: 'working' } },
        { upsert: true }
      );
      return (r.upsertedCount || 0) === 1;
    } catch (_) {
      return false; // duplicate wamid: another run (or another server process) has it
    }
  }

  async finish(wamid, outcome, detail, extra = {}) {
    if (this.dry) return;
    await WaBotSeen.updateOne({ wamid }, { $set: { outcome, detail: String(detail || '').slice(0, 500), ...extra } })
      .catch(() => {});
  }

  // ── sending ───────────────────────────────────────────────────────────────
  async send(payload, label) {
    if (this.dry) {
      this.say(`  [dry] -> ${payload.to} ${label}`);
      return true;
    }
    const r = await sg(this.s, 'POST', '/api/send-raw-message', payload);
    if (r.ok) this.sent += 1; else this.failed += 1;
    this.say(`  sent -> ${payload.to} ${label}${r.ok ? '' : `  FAILED: ${r.error}`}`);
    return r.ok;
  }

  text(to, body) {
    return this.send({
      messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: true, body: fit(body, 4096) },
    }, `text "${body.slice(0, 40)}"`);
  }

  /** A line in the WhatsApp conversation shown in AI Handled (and read by the AI as context). */
  async note(phone, role, content, actions) {
    if (this.dry) return;
    try { await ai.note(phone, role, content, actions); }
    catch (err) { this.say(`  ! conversation note: ${err.message}`); }
  }

  /** Mark their message read + "typing..." while the AI thinks. Cosmetic: failures are ignored. */
  async typing(wamid) {
    if (this.dry || !wamid) return;
    await sg(this.s, 'POST', '/api/send-raw-message',
      { messaging_product: 'whatsapp', status: 'read', message_id: wamid, typing_indicator: { type: 'text' } }, 5000)
      .catch(() => {});
  }

  /** A text with one link button under it. */
  cta(to, body, label, url) {
    return this.send({
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: fit(body, BODY_MAX) },
        action: { name: 'cta_url', parameters: { display_text: label.slice(0, TITLE_MAX), url } },
      },
    }, `[link "${label}" ${url}]`);
  }

  /**
   * The AI's answer on WhatsApp. Its text rides on the first action's message (the form,
   * or the link button) so the customer gets one message, not two; more actions follow.
   */
  async sendAi(to, res) {
    const text = res.text || '';
    const acts = [];
    for (const a of res.actions || []) {
      if (!a || !a.tool || acts.some((x) => x.tool === a.tool)) continue;
      acts.push(a);
    }
    let first = true;
    let ok = true;
    const bodyOnce = (fallback) => { const b = first && text ? text : fallback; first = false; return b; };
    for (const a of acts) {
      const ppcId = (a.body && a.body.ppcId) || (a.prefill && a.prefill.ppcId);
      if (a.tool === 'offer_buyer_assistance') ok = (await this.form(to, 'buyer', bodyOnce(''))) && ok;
      else if (a.tool === 'offer_add_property') ok = (await this.form(to, 'seller', bodyOnce(''))) && ok;
      else if (a.tool === 'offer_points_purchase') {
        ok = (await this.cta(to, bodyOnce('Owner contacts are unlocked with points. Tap below to buy points.'),
          'Buy Points', `${SITE}/points-plans`)) && ok;
      } else if (['request_contact_owner', 'send_interest', 'report_property'].includes(a.tool) && ppcId) {
        ok = (await this.cta(to, bodyOnce(`${a.label || 'Property'} - open it and confirm there (log in with this number).`),
          'Open property', `${SITE}/details/${encodeURIComponent(ppcId)}`)) && ok;
      }
    }
    if (first && text) ok = (await this.text(to, text)) && ok; // no action carried the text
    return ok;
  }

  welcome(to) {
    const body = (this.s.welcomeText || '').trim() || DEFAULT_WELCOME;
    return this.send({
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: fit(body, BODY_MAX) },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'pp_buyer', title: 'Buyer' } },
            { type: 'reply', reply: { id: 'pp_seller', title: 'Seller' } },
          ],
        },
      },
    }, '[buttons Buyer | Seller]');
  }

  /** The form, or - while it is not set up yet - a link to the same page on the website. */
  async form(to, kind, bodyText = '') {
    const flowId = kind === 'buyer' ? this.s.buyerFlowId : this.s.sellerFlowId;
    const mode = kind === 'buyer' ? this.s.buyerFlowMode : this.s.sellerFlowMode;
    if (!flowId) {
      if (bodyText) await this.text(to, bodyText);
      return this.text(to, kind === 'buyer'
        ? `Log in with this number at ${SITE} and open *Buyer Assistance* to tell us what you are looking for.\nOur team will call you with matching properties.`
        : `Log in with this number at ${SITE} and tap *Add Property* to post it.\nOur team will verify it and make it live.`);
    }
    const body = fit(bodyText || (kind === 'buyer'
      ? 'Tell us what you are looking for - only the main details. Tap the button to open the form.'
      : 'Tell us about your property - only the main details. Tap the button to open the form.'), BODY_MAX);
    const params = {
      flow_message_version: '3',
      flow_token: `${F.TOKEN[kind]}${ten(to)}`,
      flow_id: flowId,
      flow_cta: (kind === 'buyer' ? 'Fill buyer form' : 'Fill seller form').slice(0, TITLE_MAX),
      flow_action: 'navigate',
      flow_action_payload: { screen: F.SCREEN[kind] },
    };
    if (mode === 'draft') params.mode = 'draft';
    return this.send({
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: { type: 'flow', body: { text: body }, action: { name: 'flow', parameters: params } },
    }, `[form ${kind} ${flowId}${mode === 'draft' ? ' draft' : ''}]`);
  }

  // ── threads ───────────────────────────────────────────────────────────────
  async recentlyWelcomed(phone, minutes) {
    const since = new Date(Date.now() - minutes * 60000);
    return (await WaBotSeen.countDocuments({
      phone: ten(phone), kind: { $in: ['welcome', 'buyer_tap', 'seller_tap'] }, createdAt: { $gte: since },
    })) > 0;
  }

  /** Answer the new inbound messages in one conversation. `preloaded` = messages already read (handoff). */
  async handleThread(phone, preloaded) {
    let msgs = preloaded;
    if (!msgs) {
      const r = await sg(this.s, 'GET', `/api/user-chats/${encodeURIComponent(phone)}`);
      if (!r.ok) {
        this.say(`  ! could not open ${phone}: ${r.error}`);
        return 0;
      }
      msgs = (r.data && Array.isArray(r.data.messages)) ? r.data.messages : [];
    }
    let done = 0;
    let lastSig = '';
    for (const m of msgs) {
      if (!m || digits(m.from) !== phone) continue; // ours, not theirs
      const wamid = String(m.wamid || '').trim();
      const body = String(m.body || '').trim();
      if (!wamid || !body) continue;
      // A submitted form arrives here as a JSON body too; it has its own path
      // (handleForms) under the same wamid, so it is left unclaimed here.
      if (body.startsWith('{')) continue;
      const when = Date.parse(m.createdOn || m.createdAt || '');
      if (when && Date.now() - when > STALE_MINUTES * 60000) continue;
      // SHARED NUMBER (with Pondicherry Matrimony): only property messages are ours,
      // plus the ones PM's bot handed over (handoff). The rest is PM's - not even claimed.
      if (this.shared && !isPropertyMessage(body) && !this.handoffs.has(wamid)) continue;

      const act = intent(body);
      if (!act) continue;
      const sig = act.do;
      if (act.do === 'ignore') {
        if (await this.claim(wamid, phone, 'ignored', body)) await this.finish(wamid, 'ignored', 'auto-reply / location');
        continue;
      }
      if (sig === lastSig) {
        // "Hi" three times is one question, not three.
        if (await this.claim(wamid, phone, 'ignored', body)) await this.finish(wamid, 'ignored', 'repeat in this run');
        continue;
      }

      if (act.do === 'welcome' && !act.greeting && this.aiOn) {
        // A typed question: the AI answers (PM: WhatsappAiAgent). A failure falls back to the buttons.
        if (!(await this.claim(wamid, phone, 'ai', body))) continue;
        await this.typing(wamid);
        const res = await ai.reply(phone, body, { dry: this.dry });
        if (res.outcome === 'ok' || res.outcome === 'blocked') {
          const ok = await this.sendAi(phone, res);
          this.aiAnswered += 1;
          const tools = (res.actions || []).map((a) => a.tool).join(', ');
          await this.finish(wamid, ok ? 'sent' : 'failed', `AI: ${res.text.slice(0, 200)}${tools ? ` [${tools}]` : ''}`);
        } else {
          this.say(`  AI not used for ${phone} (${res.error}) - Buyer / Seller buttons instead`);
          const ok = await this.welcome(phone);
          if (ok) await this.note(phone, 'assistant', '[Sent the Buyer / Seller buttons]');
          await this.finish(wamid, ok ? 'sent' : 'failed', `AI unavailable (${res.error}) - buttons sent`);
        }
      } else if (act.do === 'welcome') {
        const cool = act.greeting ? GREETING_COOLDOWN_MIN : WELCOME_COOLDOWN_MIN;
        if (await this.recentlyWelcomed(phone, cool)) {
          if (await this.claim(wamid, phone, 'ignored', body)) {
            await this.finish(wamid, 'ignored', `welcomed in the last ${cool} min - left for the office`);
          }
          continue;
        }
        if (!(await this.claim(wamid, phone, 'welcome', body))) continue;
        const ok = await this.welcome(phone);
        await this.note(phone, 'user', body);
        if (ok) await this.note(phone, 'assistant', '[Sent the Buyer / Seller buttons]');
        await this.finish(wamid, ok ? 'sent' : 'failed', 'Buyer / Seller buttons');
      } else {
        const kind = act.do; // buyer | seller
        if (!(await this.claim(wamid, phone, `${kind}_tap`, body))) continue;
        const ok = await this.form(phone, kind);
        await this.note(phone, 'user', body);
        // Tagged with the assistant's own offer tools, so AI Handled counts a form that was
        // sent but never filled as "Needs follow-up", exactly like a website offer.
        if (ok) {
          const name = kind === 'buyer' ? 'Buyer' : 'Seller';
          await this.note(phone, 'assistant', `[Sent the ${name} form]`,
            [{ tool: kind === 'buyer' ? 'offer_buyer_assistance' : 'offer_add_property', label: `${name} form (WhatsApp)` }]);
        }
        await this.finish(wamid, ok ? 'sent' : 'failed', `${kind} form sent`);
      }
      lastSig = sig;
      done += 1;
    }
    return done;
  }

  // ── forms ─────────────────────────────────────────────────────────────────
  async handleForms() {
    const r = await sg(this.s, 'GET', '/message/get-flow-response?page=1&campaign=&limit=50');
    if (!r.ok) {
      this.say(`  ! could not read form answers: ${r.error}`);
      return 0;
    }
    let done = 0;
    for (const f of rows(r.data)) {
      if (!f || typeof f !== 'object') continue;
      const phone = digits(f.from);
      const wamid = String(f.wamid || '').trim();
      let form = f.data;
      if (typeof form === 'string') { try { form = JSON.parse(form); } catch (_) { form = null; } }
      if (!phone || !wamid || !form || typeof form !== 'object') continue;
      if (!this.allowed(phone)) continue;
      const kind = kindOf(form);
      if (!kind) continue; // not one of ours - another form on the account; left alone
      const when = Date.parse(f.createdOn || f.createdAt || f.updatedAt || '');
      if (when && Date.now() - when > FORM_MAX_AGE_HOURS * 3600000) continue;

      if (!(await this.claim(wamid, phone, `${kind}_form`, `${kind} form`))) continue;
      try {
        if (kind === 'buyer') await this.saveBuyer(wamid, phone, form);
        else await this.saveSeller(wamid, phone, form);
      } catch (err) {
        this.say(`  ! ${kind} form from ${phone}: ${err.message}`);
        await this.finish(wamid, 'failed', err.message, { form });
        await this.text(phone, 'Sorry, we could not save your details just now. Our team will call you shortly.');
      }
      done += 1;
    }
    return done;
  }

  async post(path, body) {
    const res = await fetch(SELF_BASE() + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status} from ${path}`);
    return data;
  }

  async saveBuyer(wamid, phone, form) {
    const { ok, missing, body } = toBuyerRequest(form, phone);
    if (!ok) {
      await this.finish(wamid, 'failed', `missing: ${missing.join(', ')}`, { form });
      await this.note(phone, 'assistant', `[Buyer form NOT saved - missing ${missing.join(', ')}]`);
      await this.text(phone, 'Some details were missing, so the form was not saved. Please tap *Buyer* and fill it again.');
      return;
    }
    if (this.dry) {
      this.say(`  [dry] would save buyer request for ${phone}: ${JSON.stringify(body)}`);
      return;
    }
    const data = await this.post('/add-buyerAssistance', body);
    const baId = data && data.data ? data.data.ba_id : '';
    this.saved += 1;
    this.say(`  buyer request ${baId} saved for ${phone}`);
    const want = [body.propertyMode, body.propertyType, body.bedrooms && `${body.bedrooms} BHK`, body.area, body.city,
      body.description.replace('WhatsApp form: ', 'budget ')].filter(Boolean).join(', ');
    await this.note(phone, 'user', `[Submitted the Buyer form: ${want}]`);
    await this.note(phone, 'assistant', `[Buyer request saved - Buyer ID ${baId}]`, [{
      tool: 'wa_buyer_saved', label: `Buyer ID ${baId}`,
      prefill: { city: body.city, area: body.area, minPrice: body.minPrice, maxPrice: body.maxPrice,
        bedrooms: body.bedrooms || '', propertyType: body.propertyType, propertyMode: body.propertyMode },
    }]);
    await this.finish(wamid, 'saved', `Buyer Assistance #${baId}`, { refId: String(baId || ''), form });
    const okB = await this.text(phone,
      `Thank you ${body.baName}! ✅\nYour requirement is saved (Buyer ID *${baId}*).\n\n` +
      `Our team will call you with matching properties. Meanwhile, browse listings: ${SITE}`);
    // Outside WhatsApp's 24-hour window a free text cannot go: the approved template instead.
    if (!okB) await this.templateFallback(phone, 'buyer_request_saved', [body.baName, String(baId), want]);
  }

  /** The approved template for a confirmation the free text could not carry (WhatsAppTemplates). */
  async templateFallback(phone, key, params) {
    try {
      const r = await sendTemplate(key, phone, params);
      this.say(`  template ${key} -> ${phone}: ${r.ok ? 'sent' : r.error}`);
      if (r.ok) this.sent += 1;
    } catch (e) { this.say(`  ! template ${key}: ${e.message}`); }
  }

  async saveSeller(wamid, phone, form) {
    const { ok, missing, row, base } = toSellerRow(form, phone);
    if (!ok) {
      await this.finish(wamid, 'failed', `missing: ${missing.join(', ')}`, { form });
      await this.note(phone, 'assistant', `[Seller form NOT saved - missing ${missing.join(', ')}]`);
      await this.text(phone, missing.includes('price')
        ? 'We could not read the price. Please tap *Seller* and enter it like 4500000 or 45 lakhs.'
        : 'Some details were missing, so the form was not saved. Please tap *Seller* and fill it again.');
      return;
    }
    if (this.dry) {
      this.say(`  [dry] would save property for ${phone}: ${JSON.stringify(row)}`);
      return;
    }
    const data = await this.post('/bulk-upload-properties', {
      rows: [row], base, addedBy: 'WhatsApp Bot', addedByRole: 'WhatsApp',
    });
    const ppcId = data.fromPpcId || '';
    this.saved += 1;
    this.say(`  property ${ppcId} saved for ${phone} (${data.preApprovedCount ? 'PreApproved' : 'Pending'})`);
    const what = [row.postedBy, row.propertyMode, row.propertyType, row.salesType, `price ${row.price}`,
      `${row.totalArea} ${row.areaUnit}`, row.bedrooms && `${row.bedrooms} BHK`, row.area, row.city].filter(Boolean).join(', ');
    await this.note(phone, 'user', `[Submitted the Seller form: ${what}]`);
    await this.note(phone, 'assistant', `[Property saved - PPC-ID ${ppcId}, waiting in PreApproved]`,
      [{ tool: 'wa_property_saved', label: `PPC-ID ${ppcId}`, ppcId }]);
    await this.finish(wamid, 'saved', `Property PPC-ID ${ppcId}`, { refId: String(ppcId || ''), form });
    const okS = await this.text(phone,
      `Thank you ${row.ownerName}! ✅\nYour property is received (PPC ID *${ppcId}*).\n\n` +
      'Our team will verify it and make it live. You can add photos and more details on the website / app ' +
      `with this same number: ${SITE}`);
    if (!okS) await this.templateFallback(phone, 'property_received', [row.ownerName, String(ppcId), `${row.propertyType} in ${row.area}`]);
  }

  // ── one pass ──────────────────────────────────────────────────────────────
  async run() {
    const r = await sg(this.s, 'GET', '/api/get-my-chats?from=&tn=');
    if (!r.ok) {
      this.say(`Could not read the chat list: ${r.error}`);
      return { done: 0, opened: 0 };
    }
    const threads = Array.isArray(r.data) ? r.data : rows(r.data);
    const mark = this.s.checkedAt ? new Date(this.s.checkedAt).getTime() : 0;
    const since = mark ? mark - OVERLAP_MINUTES * 60000 : Date.now() - STALE_MINUTES * 60000;
    const runAt = new Date(); // stamped before the work: a run that dies is covered by the overlap

    let done = 0;
    const opened = [];
    const seen = new Set();
    for (const t of threads) {
      const phone = digits(t && t.from);
      if (!phone || seen.has(phone)) continue; // the list repeats conversations
      seen.add(phone);
      if (!this.allowed(phone)) continue;
      const moved = Date.parse((t && t.lastUpdated) || '');
      if (!moved || moved < since) continue;
      if (opened.length >= MAX_THREADS_PER_RUN) {
        this.say(`Stopped at ${MAX_THREADS_PER_RUN} conversations; the rest wait for the next run.`);
        break;
      }
      opened.push(phone);
      try { done += await this.handleThread(phone); }
      catch (err) { this.say(`  ! thread ${phone}: ${err.message}`); }
    }
    try { done += await this.handleForms(); }
    catch (err) { this.say(`  ! forms: ${err.message}`); }

    if (!this.dry) {
      await WaBotSettings.updateOne({ key: 'main' }, { $set: { checkedAt: runAt } });
    }
    this.say(`${opened.length} conversation(s) read, ${done} handled.`);
    return { done, opened: opened.length };
  }
}

let running = false;
let indexesReady = false;

/** One poll. Returns a summary + the run's log lines (for the admin "Run now"). */
async function runOnce({ dry = false, force = false } = {}) {
  if (running) return { skipped: 'a run is already in progress', log: [] };
  const s = await getSettings();
  if (!s.apiToken) return { skipped: 'no SmartGrowth API token saved', log: [] };
  if (!s.enabled && !dry && !force) return { skipped: 'bot is switched off', log: [] };
  running = true;
  const started = new Date();
  // The unique wamid index must exist before anything is claimed (built once, then a no-op).
  if (!indexesReady) {
    try { await WaBotSeen.init(); indexesReady = true; } catch (e) { console.error(LOG, 'index build:', e.message); }
  }
  let aiOn = false;
  try { aiOn = await ai.aiAvailable(s); } catch (_) { aiOn = false; }
  const run = new Run(s, { dry, aiOn });
  try {
    const { done, opened } = await run.run();
    const summary = {
      at: started, ms: Date.now() - started.getTime(), dry,
      opened, handled: done, sent: run.sent, failed: run.failed, saved: run.saved, ai: aiOn, aiAnswered: run.aiAnswered,
    };
    if (!dry && (done || run.failed)) console.log(LOG, JSON.stringify(summary));
    if (!dry) await WaBotSettings.updateOne({ key: 'main' }, { $set: { lastRun: summary } }).catch(() => {});
    return { ...summary, log: run.log };
  } catch (err) {
    console.error(LOG, 'run failed:', err.message);
    return { error: err.message, log: run.log };
  } finally {
    running = false;
  }
}

/** Did this bot talk to the number in the last ACTIVE_MINUTES? (a property conversation is going on) */
async function isActive(phone) {
  const since = new Date(Date.now() - ACTIVE_MINUTES * 60000);
  return !!(await WaBotSeen.exists({
    phone: ten(phone), kind: { $ne: 'ignored' }, outcome: { $nin: ['ignored', 'failed'] }, createdAt: { $gte: since },
  }));
}

/**
 * SHARED NUMBER: PM's bot asks "is this message yours?" for a message it would
 * only answer generically ("Hi", "ok", "Lawspet") - see shared.js rule 2.
 *
 * Nothing in the request is trusted except as a pointer: the message is read back
 * from SmartGrowth by its wamid and must be an inbound, fresh message from that
 * number, and the number must be in a property conversation right now. So the
 * endpoint cannot be used to make the bot speak to anyone (no secret needed).
 *
 * -> { taken: boolean, why }. When taken, the answer is sent in the background
 *    (PM does not wait for it) and PM stays silent on that message.
 */
async function handoff(phone, wamid) {
  const s = await getSettings();
  const p = digits(phone);
  const w = String(wamid || '').trim();
  if (!s.enabled || !s.apiToken) return { taken: false, why: 'bot is off' };
  if (s.sharedNumber === false) return { taken: false, why: 'number is not shared' };
  if (p.length < 10 || !w) return { taken: false, why: 'phone and wamid are needed' };
  const allow = String(s.allowList || '').split(/[\s,;]+/).map(ten).filter((t) => t.length === 10);
  if (allow.length && !allow.includes(ten(p))) return { taken: false, why: 'not on the test list' };
  if (!(await isActive(p))) return { taken: false, why: 'no property conversation in the last ' + ACTIVE_MINUTES + ' min' };

  const r = await sg(s, 'GET', `/api/user-chats/${encodeURIComponent(p)}`, undefined, 8000);
  if (!r.ok) return { taken: false, why: `could not read the chat: ${r.error}` };
  const msgs = (r.data && Array.isArray(r.data.messages)) ? r.data.messages : [];
  const m = msgs.find((x) => x && String(x.wamid || '').trim() === w);
  if (!m || digits(m.from) !== p) return { taken: false, why: 'no such message from that number' };
  const when = Date.parse(m.createdOn || m.createdAt || '');
  if (when && Date.now() - when > STALE_MINUTES * 60000) return { taken: false, why: 'message is too old' };

  let aiOn = false;
  try { aiOn = await ai.aiAvailable(s); } catch (_) { aiOn = false; }
  const run = new Run(s, { aiOn });
  run.handoffs.add(w);
  // Only this one message goes through the normal thread logic (claim, answer, note).
  setImmediate(() => {
    run.handleThread(p, [m])
      .then(() => { if (run.log.length) console.log(LOG, 'handoff', run.log.join(' | ')); })
      .catch((e) => console.error(LOG, 'handoff failed:', e.message));
  });
  return { taken: true, why: 'property conversation in progress' };
}

module.exports = { runOnce, intent, handoff, isActive };
