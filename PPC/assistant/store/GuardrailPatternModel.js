// ai_guardrail_pattern — the LEARNED memory. One doc per distinct attack signature
// (category + the set of matched signal tags). Every time that shape of attack
// recurs, `count` grows and `severityMax`/`lastSeen` update. This is what lets the
// assistant "learn from the chat and respond accordingly": a signature seen often
// escalates, so the bot refuses/blocks that pattern faster over time.
//
// IMPORTANT (monotonic + safe): this store can only ever make the assistant MORE
// restrictive — it raises severity and drives blocks, never relaxes a rule. The
// `sampleSnippet` is redacted and is used for admin review ONLY; it is never fed
// back into the model prompt, so the learning store cannot become an injection
// vector even though learning is fully automatic.
const mongoose = require('mongoose');

const GuardrailPatternSchema = new mongoose.Schema(
  {
    signature: { type: String, unique: true, index: true },
    category: { type: String, index: true },
    signals: [String],
    count: { type: Number, default: 0 },
    severityMax: { type: Number, default: 1 },
    sampleSnippet: String, // redacted example, set once on first sighting
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'ai_guardrail_pattern' }
);

module.exports = mongoose.models.AiGuardrailPattern ||
  mongoose.model('AiGuardrailPattern', GuardrailPatternSchema);
