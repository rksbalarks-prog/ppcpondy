// In-memory scheduler state for /auto-expire/status.

const s = { armed: false, cron: null, timezone: null, lastRunAt: null, lastResult: null, lastError: null };

module.exports = {
  armed(info) { Object.assign(s, { armed: true }, info); },
  ran(result) { Object.assign(s, { lastRunAt: new Date(), lastResult: result, lastError: null }); },
  failed(err) { Object.assign(s, { lastRunAt: new Date(), lastError: String(err && err.message ? err.message : err) }); },
  get() { return { ...s }; },
};
