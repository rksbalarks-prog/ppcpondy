// In-memory record of the last admin-report run, surfaced by
// /admin-report-mail/status. Not persisted — a restart legitimately resets it.

let last = null;
let scheduled = null;

module.exports = {
  record(result) {
    last = {
      at: new Date().toISOString(),
      trigger: result.trigger || 'cron',
      success: Boolean(result.success),
      skipped: Boolean(result.skipped),
      dryRun: Boolean(result.dryRun),
      subject: result.subject || null,
      date: result.date || null,
      failures: result.failures || [],
      messageId: result.messageId || null,
      message: result.message || null,
    };
    return last;
  },

  armed(info) {
    scheduled = { at: new Date().toISOString(), ...info };
  },

  get() {
    return { armed: scheduled, lastRun: last };
  },
};
