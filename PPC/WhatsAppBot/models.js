const mongoose = require('mongoose');

// One settings row (key 'main'), edited from the admin "WhatsApp Bot" page.
// The SmartGrowth token lives here, not in .env, so the office can switch the
// number without a deploy - and it is NEVER sent back to the browser whole.
const WaBotSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  enabled: { type: Boolean, default: false },
  baseUrl: { type: String, default: 'https://newapp.smartgrowthai.com' },
  apiToken: { type: String, default: '' },
  // Comma / space separated 10-digit numbers. When set, the bot talks ONLY to
  // these - for testing a draft form before it goes to everyone.
  allowList: { type: String, default: '' },
  buyerFlowId: { type: String, default: '' },
  sellerFlowId: { type: String, default: '' },
  // 'draft' = only the SmartGrowth/Meta test numbers can open the forms.
  buyerFlowMode: { type: String, enum: ['draft', 'published'], default: 'draft' },
  sellerFlowMode: { type: String, enum: ['draft', 'published'], default: 'draft' },
  welcomeText: { type: String, default: '' },
  // Typed messages (not buttons) are answered by the AI assistant (OpenAI) - shown in AI Handled.
  aiEnabled: { type: Boolean, default: false },
  // The WhatsApp number / SmartGrowth account is SHARED with Pondicherry Matrimony:
  // this bot answers only property messages + what PM's bot hands over (shared.js).
  // On by default - the safe side: off would make this bot answer matrimony members.
  sharedNumber: { type: Boolean, default: true },
  // WhatsApp TEMPLATES (WhatsAppTemplates/): the account's API code (needed by
  // SmartGrowth's /send/campaign - same one as PM admin › WhatsApp › Settings), the
  // master switch, one switch per template ({key: true|false}; missing = its default),
  // and a daily cap - the account and its bill are shared with Pondicherry Matrimony.
  apiCode: { type: String, default: '' },
  templatesEnabled: { type: Boolean, default: false },
  templateOn: { type: Object, default: {} },
  templateDailyLimit: { type: Number, default: 200 },
  // Which SmartGrowth account is connected (admin › WhatsApp Bot › SmartGrowth account).
  // Switching accounts resets what belonged to the old one (form ids, watermark) and
  // switches the bot + templates off until they are set up on the new account.
  accountLabel: { type: String, default: '' },
  accountChangedAt: { type: Date, default: null },
  accountHistory: { type: Array, default: [] }, // [{at, label, token: '…last4', by}] newest first, max 10
  checkedAt: { type: Date, default: null }, // watermark of the last poll
  lastRun: { type: Object, default: null }, // summary of the last poll, for the admin page
}, { timestamps: true, collection: 'wa_bot_settings' });

// Every inbound message / form the bot acted on, claimed by its WhatsApp
// message id BEFORE it is answered. The unique wamid is what stops a poll every
// minute from answering one tap twice or creating one property twice.
const WaBotSeenSchema = new mongoose.Schema({
  wamid: { type: String, required: true, unique: true },
  phone: { type: String, index: true },
  kind: { type: String, index: true }, // welcome | buyer_tap | seller_tap | buyer_form | seller_form | ignored
  body: { type: String, default: '' },
  outcome: { type: String, default: 'working' }, // working | sent | saved | failed | ignored
  detail: { type: String, default: '' },
  refId: { type: String, default: '' }, // ba_id (buyer) or ppcId (seller)
  form: { type: Object, default: null }, // the submitted form, for the admin page
}, { timestamps: true, collection: 'wa_bot_seen' });

const WaBotSettings = mongoose.models.WaBotSettings || mongoose.model('WaBotSettings', WaBotSettingsSchema);
const WaBotSeen = mongoose.models.WaBotSeen || mongoose.model('WaBotSeen', WaBotSeenSchema);

async function getSettings() {
  let s = await WaBotSettings.findOne({ key: 'main' }).lean();
  if (!s) {
    await WaBotSettings.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true });
    s = await WaBotSettings.findOne({ key: 'main' }).lean();
  }
  return s;
}

module.exports = { WaBotSettings, WaBotSeen, getSettings };
