// In-memory record of the last report run, surfaced by /data-added-mail/status.
//
// Deliberately not persisted: it only answers "did the last send work?" after a
// deploy, and a restart legitimately resets that answer. No new collection, no
// schema, nothing to migrate.

let last = null;
let scheduled = null;

module.exports = {
  /** Remember the outcome of a send (cron tick or manual trigger). */
  record(result) {
    last = {
      at: new Date().toISOString(),
      trigger: result.trigger || 'cron',
      success: Boolean(result.success),
      skipped: Boolean(result.skipped),
      dryRun: Boolean(result.dryRun),
      subject: result.subject || null,
      total: result.total ?? null,
      messageId: result.messageId || null,
      message: result.message || null,
    };
    return last;
  },

  /** Note that the cron task was armed, with the cadence it was armed on. */
  armed(info) {
    scheduled = { at: new Date().toISOString(), ...info };
  },

  get() {
    return { armed: scheduled, lastRun: last };
  },
};
