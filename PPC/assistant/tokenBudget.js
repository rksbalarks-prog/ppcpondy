// Per-user daily token budget (in-memory), enforced BEFORE a model call and
// updated after. Resets at UTC date change. Single-process.

const { getSettingsSync } = require('./settings');

const spentByUser = new Map(); // key -> { day: 'YYYY-MM-DD', tokens: number }

function dayOf(now) {
  return new Date(now).toISOString().slice(0, 10);
}

function bucket(key, now) {
  const day = dayOf(now);
  let b = spentByUser.get(key);
  if (!b || b.day !== day) {
    b = { day, tokens: 0 };
    spentByUser.set(key, b);
  }
  return b;
}

// Call before a request. `estimate` is a rough guard so a single huge request
// can't blow far past the cap.
function canSpend(key, estimate = 0, now = Date.now()) {
  const b = bucket(key, now);
  const budget = getSettingsSync().dailyTokenBudget; // admin-editable (env fallback)
  if (budget <= 0) return { ok: true, remaining: Infinity, spent: b.tokens };
  const remaining = budget - b.tokens;
  return { ok: remaining - estimate > 0, remaining, spent: b.tokens, budget };
}

function record(key, tokens = 0, now = Date.now()) {
  const b = bucket(key, now);
  b.tokens += Math.max(0, tokens | 0);
  return b.tokens;
}

module.exports = { canSpend, record };
