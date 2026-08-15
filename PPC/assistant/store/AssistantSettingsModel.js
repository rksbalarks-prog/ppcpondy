// ai_assistant_settings — a SINGLETON document holding the admin-editable runtime
// config for the chatbot. Lets an admin change behaviour live (no .env edit / no
// redeploy). Every field defaults to the current env/config value, so an absent
// doc == today's behaviour. Read through settings.js (cached); written by
// adminSettingsRoute.js.
const mongoose = require('mongoose');

// A custom guardrail phrase an admin adds. Matched case-insensitively as a literal
// substring (escaped) against the user's message, on top of the built-in signals.
const GuardrailPhraseSchema = new mongoose.Schema(
  {
    phrase: { type: String, required: true },
    category: { type: String, default: 'jailbreak' }, // contact_extraction | jailbreak | impersonation
    severity: { type: Number, default: 3, min: 1, max: 3 },
  },
  { _id: false }
);

const AssistantSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'singleton', unique: true, index: true },
    enabled: { type: Boolean, default: true },
    contactRevealPoints: { type: Number, default: 10, min: 1 },
    rateChat: { type: Number, default: 30, min: 1 },
    rateVoice: { type: Number, default: 40, min: 1 },
    dailyTokenBudget: { type: Number, default: 200000, min: 0 },
    // Extra instructions appended to the system prompt (tone / behaviour / rules).
    promptExtra: { type: String, default: '', maxlength: 4000 },
    // Optional welcome-greeting overrides shown by the user widget (blank = default).
    greetingEn: { type: String, default: '', maxlength: 500 },
    greetingTa: { type: String, default: '', maxlength: 500 },
    guardrailPhrases: { type: [GuardrailPhraseSchema], default: [] },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true, collection: 'ai_assistant_settings' }
);

module.exports = mongoose.models.AiAssistantSettings ||
  mongoose.model('AiAssistantSettings', AssistantSettingsSchema);
