// ai_guardrail_event — the raw audit log of every manipulation/abuse attempt the
// assistant detected (owner-contact extraction, jailbreak, impersonation). One doc
// per flagged user message. This is the trail the team can read; the aggregated
// learning lives in ai_guardrail_pattern (see GuardrailPatternModel).
//
// The stored `snippet` is phone/email-REDACTED and length-capped — we keep enough
// to review the attack shape without persisting a user's PII or a leaked number.
const mongoose = require('mongoose');

const GuardrailEventSchema = new mongoose.Schema(
  {
    key: { type: String, index: true },      // last-10-digit session key (scoping id)
    sessionId: { type: String, index: true },
    lang: String,
    category: { type: String, index: true }, // contact_extraction | jailbreak | impersonation
    severity: { type: Number, default: 1 },  // 1..3
    signals: [String],                        // matched signal tags (non-PII)
    signature: { type: String, index: true }, // category + sorted signal tags
    snippet: String,                          // redacted, capped copy of the message
    repeatCount: Number,                      // this key's flagged count at the time
    action: { type: String, default: 'note' },// note | block
  },
  { timestamps: true, collection: 'ai_guardrail_event' }
);

module.exports = mongoose.models.AiGuardrailEvent ||
  mongoose.model('AiGuardrailEvent', GuardrailEventSchema);
