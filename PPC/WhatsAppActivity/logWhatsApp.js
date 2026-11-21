// Records a /send-message attempt. Never throws and never delays the response:
// a logging failure must not stop a WhatsApp message from being sent.
const WhatsAppLog = require('./WhatsAppLogModel');
const { classify, last10 } = require('./classify');

// OneMsg answers HTTP 200 even for some rejections; treat explicit failure flags as failed.
function providerFailed(data) {
  if (!data || typeof data !== 'object') return '';
  if (data.success === false || data.status === false) return data.message || data.error || 'Rejected by provider';
  if (typeof data.status === 'string' && /^(error|failed?|fail)$/i.test(data.status)) return data.message || data.status;
  if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  return '';
}

function sourceOf(req) {
  const ua = String(req.headers['user-agent'] || '');
  const ref = String(req.headers.referer || req.headers.origin || '');
  if (/dart|okhttp|flutter/i.test(ua)) return 'app';
  if (/\/process\//.test(ref)) return 'admin';
  if (ref) return 'website';
  return 'other';
}

function logWhatsApp(req, { to, message, data, error }) {
  try {
    const failReason = error ? String(error).slice(0, 500) : providerFailed(data);
    const info = classify(message, to);
    let provider = '';
    try { provider = JSON.stringify(data ?? '').slice(0, 300); } catch (_) { /* ignore */ }
    WhatsAppLog.create({
      to: last10(to),
      ...info,
      status: failReason ? 'failed' : 'sent',
      error: failReason,
      provider,
      source: sourceOf(req),
    }).catch((e) => console.error('WhatsApp log save failed:', e.message));
  } catch (e) {
    console.error('WhatsApp log failed:', e.message);
  }
}

module.exports = { logWhatsApp, providerFailed };
