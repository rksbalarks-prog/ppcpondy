// Structured JSON logs for the assistant. One line per event. NEVER logs message
// content — only metadata (masked user id, provider, sizes, latency, outcome).

function maskPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d ? '****' + d.slice(-4) : 'anon';
}

function logEvent(fields = {}) {
  const { phone, ...rest } = fields;
  const line = {
    ts: new Date().toISOString(),
    scope: 'assistant',
    user: maskPhone(phone),
    ...rest,
  };
  // Single JSON line — ships cleanly to any log collector.
  try { console.log(JSON.stringify(line)); } catch { /* never throw from logging */ }
}

module.exports = { logEvent, maskPhone };
