// WhatsApp <-> the AI assistant (OpenAI), and the WhatsApp side of "AI Handled".
//
// Same idea as the Pondicherry Matrimony WhatsApp AI (WhatsappAiAgent.php): when a
// customer TYPES something on WhatsApp ("2 BHK in Lawspet under 50 lakhs?"), the
// SAME assistant that answers on the website answers here - same OpenAI provider,
// same tools (live property search, points balance), same guardrail, same
// rate limit and daily token budget, same admin settings (My Assistant > Settings).
// Buttons and forms (Buyer / Seller) keep the bot's own fixed answers.
//
// Every WhatsApp conversation - what they typed, what the AI said, the buttons and
// forms the bot sent, the forms they submitted - is written to the assistant's own
// store (ai_conversation / ai_message, sessionId "wa_<10 digits>_<time>",
// channel 'whatsapp'). That is what the admin "AI Handled" page reads, so the
// WhatsApp leads sit next to the website chats with the same outcome logic.
//
// The AI's buttons become WhatsApp messages:
//   offer_buyer_assistance  -> the Buyer form (inside WhatsApp)
//   offer_add_property      -> the Seller form (inside WhatsApp)
//   offer_points_purchase   -> a link button to the Points page
//   request_contact_owner / send_interest / report_property
//                           -> a link button to the property page (the user confirms there,
//                              logged in - nothing is spent or sent from WhatsApp)

const Conversation = require('../assistant/store/ConversationModel');
const Message = require('../assistant/store/MessageModel');
const config = require('../assistant/config');
const { runAgent } = require('../assistant/orchestrator');
const { buildMessages, detectLang } = require('../assistant/systemPrompt');
const { inspectMessage, detectPointsIntent } = require('../assistant/guardrail');
const { checkRate } = require('../assistant/rateLimit');
const { canSpend, record } = require('../assistant/tokenBudget');
const { getSettings } = require('../assistant/settings');
const { logEvent } = require('../assistant/logger');

/** A WhatsApp conversation is one session while it keeps moving; 24 h of silence starts a new one
 *  (WhatsApp's own customer-service window is 24 h too). */
const SESSION_GAP_MS = 24 * 60 * 60 * 1000;

const WHATSAPP_NOTE = `CHANNEL: this chat is on WHATSAPP, not the website. The user is already identified by their WhatsApp number (no login needed to talk).
- Plain text only, short (1-3 sentences). No markdown. You may use line breaks. Do not paste URLs; the bot attaches the right link or form button after your reply.
- Buyer who wants us to find a property for them, or nothing matched: call offer_buyer_assistance - it sends the short BUYER FORM inside WhatsApp. Tell them to tap "Fill buyer form".
- Owner / seller who wants to sell or post a property: call offer_add_property - it sends the short SELLER FORM inside WhatsApp. Tell them to tap "Fill seller form". Do not collect all the property details in the chat.
- Owner contact, send interest, report: the tool shows an "Open property" link button instead of a Confirm button; tell them to open it and confirm there (logged in with this number).
- Buy points: offer_points_purchase sends an "Buy Points" link button.
- Lines in brackets like [Sent the Buyer form] are notes of what the WhatsApp bot already did - do not repeat them as if new.`;

const ten = (p) => String(p || '').replace(/\D/g, '').slice(-10);

/** The open WhatsApp session for this number, or a new one. */
async function sessionFor(phone10) {
  const last = await Conversation.findOne({ phone: phone10, sessionId: new RegExp(`^wa_${phone10}_`) })
    .sort({ lastMessageAt: -1 }).lean();
  if (last && Date.now() - new Date(last.lastMessageAt).getTime() < SESSION_GAP_MS) return last.sessionId;
  return `wa_${phone10}_${Date.now()}`;
}

/** Add one line to the WhatsApp conversation (user or assistant), creating the session if needed. */
async function note(phone, role, content, actions) {
  const p10 = ten(phone);
  if (p10.length !== 10 || !content) return null;
  const sessionId = await sessionFor(p10);
  await Conversation.updateOne(
    { sessionId },
    { $setOnInsert: { sessionId, phone: p10, channel: 'whatsapp', title: 'WhatsApp' }, $set: { lastMessageAt: new Date() } },
    { upsert: true }
  );
  await Message.create({ sessionId, phone: p10, role, content: String(content).slice(0, 4000), actions });
  return sessionId;
}

/** Is the AI switched on for WhatsApp? (WhatsApp Bot setting AND the assistant's own on/off + an API key.) */
async function aiAvailable(botSettings) {
  if (!botSettings.aiEnabled || !config.enabled) return false;
  if (config.provider === 'openai' && !config.openai.apiKey) return false;
  try { return !!(await getSettings()).enabled; } catch (_) { return false; }
}

/**
 * The AI's answer to one typed WhatsApp message.
 * -> { text, actions[], outcome: 'ok'|'blocked'|'limited'|'error', error? }
 * Never throws. Writes the user line and the answer to the conversation.
 */
async function reply(phone, text, { dry = false } = {}) {
  const p10 = ten(phone);
  const key = p10;
  const appPhone = `+91${p10}`; // the format the app's own endpoints match on
  const started = Date.now();

  if (dry) return { text: '(dry run - the AI is not called)', actions: [], outcome: 'ok' };

  const rl = checkRate(key, 'chat');
  if (!rl.ok) return { text: '', actions: [], outcome: 'limited', error: 'rate limited' };
  const budget = canSpend(key, 3000);
  if (!budget.ok) return { text: '', actions: [], outcome: 'limited', error: 'daily token budget reached' };

  const sessionId = await sessionFor(p10);
  const hist = (await Message.find({ sessionId, phone: p10 }).sort({ createdAt: -1 })
    .limit(config.historyTurns * 2).lean()).reverse().map((d) => ({ role: d.role, content: d.content }));
  await note(p10, 'user', text);

  try {
    const lang = detectLang(text);
    const guard = await inspectMessage({ text, key, sessionId, lang }).catch(() => ({ flagged: false }));
    if (guard.action === 'block') {
      const actions = guard.offerPoints ? [{ tool: 'offer_points_purchase', label: 'Buy points', kind: 'navigate', navigate: '/points-plans' }] : [];
      await note(p10, 'assistant', guard.reply, actions.length ? actions : undefined);
      logEvent({ phone: appPhone, event: 'wa_chat', outcome: 'blocked', category: guard.category, latencyMs: Date.now() - started });
      return { text: guard.reply, actions, outcome: 'blocked' };
    }

    let promptExtra = '';
    try { promptExtra = (await getSettings()).promptExtra || ''; } catch (_) { /* none */ }
    const messages = buildMessages({
      history: hist, userMessage: text, lang,
      guardrail: guard.note || '',
      promptExtra: [promptExtra, WHATSAPP_NOTE].filter((s) => String(s).trim()).join('\n\n'),
    });

    let answer = '';
    const actions = [];
    let usage = null;
    let error = '';
    for await (const ev of runAgent({ messages, phone: appPhone, wantsPoints: detectPointsIntent(text) })) {
      if (ev.type === 'token') answer += ev.data;
      else if (ev.type === 'action') actions.push(ev.data);
      else if (ev.type === 'done') { usage = ev.data.usage; if (!answer) answer = ev.data.text || ''; }
      else if (ev.type === 'error') error = ev.data.message;
    }
    if (usage) {
      record(key, usage.total_tokens || 0);
      await Conversation.updateOne({ sessionId }, { $inc: { tokens: usage.total_tokens || 0 } }).catch(() => {});
    }
    answer = clean(answer);
    if (error && !answer) {
      logEvent({ phone: appPhone, event: 'wa_chat', outcome: 'error', error, latencyMs: Date.now() - started });
      return { text: '', actions: [], outcome: 'error', error };
    }
    await note(p10, 'assistant', answer || '(no text)', actions.length ? actions : undefined);
    logEvent({
      phone: appPhone, provider: config.provider, event: 'wa_chat', chars: text.length, replyChars: answer.length,
      tokens: usage?.total_tokens || 0, actions: actions.length, latencyMs: Date.now() - started, outcome: 'ok',
    });
    return { text: answer, actions, outcome: 'ok' };
  } catch (e) {
    logEvent({ phone: appPhone, event: 'wa_chat', outcome: 'error', error: e.message, latencyMs: Date.now() - started });
    return { text: '', actions: [], outcome: 'error', error: e.message };
  }
}

/** WhatsApp shows *bold* itself; strip the markdown it does not (headings, **double**, links). */
function clean(s) {
  return String(s || '')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/^#+\s*/gm, '')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1')
    .trim()
    .slice(0, 3500);
}

module.exports = { reply, note, aiAvailable, ten };
