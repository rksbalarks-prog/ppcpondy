// Shared pacing for the three Autobot senders.
//
// PER-MESSAGE DELAY: a sender with one sends at most one message per delay.
// The slot is taken with ONE conditional update on the sender's own row
// (lastSentAt older than the delay), so a scheduled tick and a "Send now"
// press working the same run cannot both send in the same slot.
//
// Waiting happens in small amounts only — a tick that sleeps for a long time
// holds up every other sender behind it — and a slot further away than the
// pass may wait simply carries over to the next tick.

const { sleep } = require('../util');

/**
 * Wait for `doc`'s next send slot and take it. `budget` is { left: seconds
 * this pass may still spend waiting }, shared across a pass. False when the
 * slot is further away than that.
 */
async function takeSlot(Model, id, delaySec, budget) {
  if (!delaySec || delaySec <= 0) return true;
  for (let tries = 0; tries < 5; tries++) {
    const doc = await Model.findById(id, { lastSentAt: 1 }).lean();
    const last = doc && doc.lastSentAt ? new Date(doc.lastSentAt).getTime() : 0;
    const waitMs = Math.max(0, last + delaySec * 1000 - Date.now());
    if (waitMs > budget.left * 1000) return false;
    if (waitMs > 0) { await sleep(waitMs); budget.left -= Math.ceil(waitMs / 1000); }
    const cutoff = new Date(Date.now() - delaySec * 1000 + 250);
    const r = await Model.updateOne(
      { _id: id, $or: [{ lastSentAt: null }, { lastSentAt: { $exists: false } }, { lastSentAt: { $lte: cutoff } }] },
      { $set: { lastSentAt: new Date() } });
    if (r.modifiedCount === 1) return true;
    // Somebody else took this slot. Look again at the next one.
  }
  return false;
}

/** May the scheduled ticks send from this copy? Set SMARTGROWTH_RUNNER=1 on exactly one server. */
const runnerAllowed = () => process.env.SMARTGROWTH_RUNNER === '1';
const runnerWhy = () => 'Automatic sending is off on this server (SMARTGROWTH_RUNNER is not 1). Send now still works.';

module.exports = { takeSlot, runnerAllowed, runnerWhy };
