// Reusable FCM sender. Delivers to device tokens and prunes any token FCM
// reports as unregistered/invalid so the collection stays clean.
//
// Uses the NAMED "push" Firebase app (fcm/pushApp.js, project
// notification-5fb49) — deliberately NOT the default admin app, which belongs
// to the OTP project (ppc-2-a4437). See pushApp.js for the why.
const { messaging } = require('./pushApp');
const FcmToken = require('./FcmTokenModel');

// Android notification channel — must match the channel the Flutter app
// creates in lib/services/push_service.dart, or Android 8+ silently drops the
// notification's importance.
const ANDROID_CHANNEL = 'ppcpondy_default';
const DEFAULT_TITLE = 'Pondy Property';

function normalizePhoneNumber(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// FCM data payloads must be all-strings.
function stringifyData(data) {
  const out = {};
  Object.entries(data || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) out[k] = String(v);
  });
  return out;
}

/**
 * Low-level: send to an explicit list of tokens (batched by 500, FCM's limit).
 * Prunes tokens FCM reports as dead. Returns { sent, failed, tokens }.
 */
async function sendPushToTokens(tokens, notification, data = {}) {
  const unique = [...new Set((tokens || []).filter(Boolean))];
  if (unique.length === 0) return { sent: 0, failed: 0, tokens: 0 };

  const fcm = messaging();
  if (!fcm) {
    console.error('sendPushToTokens: Firebase push app not initialised');
    return { sent: 0, failed: unique.length, tokens: unique.length };
  }

  const message = {
    notification: {
      title: notification.title || DEFAULT_TITLE,
      body: notification.body || '',
    },
    data: stringifyData(data),
    android: {
      priority: 'high',
      notification: { channelId: ANDROID_CHANNEL },
    },
  };

  let sent = 0;
  let failed = 0;
  const stale = [];

  for (const batch of chunk(unique, 500)) {
    let response;
    try {
      response = await fcm.sendEachForMulticast({ tokens: batch, ...message });
    } catch (err) {
      console.error('sendPushToTokens batch failed:', err.message);
      failed += batch.length;
      continue;
    }
    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error && r.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          stale.push(batch[i]);
        }
      }
    });
  }

  if (stale.length) {
    try {
      await FcmToken.deleteMany({ token: { $in: stale } });
    } catch (_) {}
  }

  return { sent, failed, tokens: unique.length };
}

/** Send to every device registered for one phone number. */
async function sendPushToUser(phoneNumber, notification, data = {}) {
  const phone = normalizePhoneNumber(phoneNumber);
  if (!phone) return { sent: 0, failed: 0, tokens: 0 };
  const docs = await FcmToken.find({ phoneNumber: phone }).lean();
  return sendPushToTokens(docs.map((d) => d.token), notification, data);
}

/** Broadcast to every registered device. */
async function sendBroadcast(notification, data = {}) {
  const docs = await FcmToken.find({}, { token: 1 }).lean();
  return sendPushToTokens(docs.map((d) => d.token), notification, data);
}

/** Send to a list of phone numbers (a segment). */
async function sendPushToNumbers(phoneNumbers, notification, data = {}) {
  const phones = [
    ...new Set((phoneNumbers || []).map(normalizePhoneNumber).filter(Boolean)),
  ];
  if (phones.length === 0) return { sent: 0, failed: 0, tokens: 0 };
  const docs = await FcmToken.find({ phoneNumber: { $in: phones } }).lean();
  return sendPushToTokens(docs.map((d) => d.token), notification, data);
}

module.exports = {
  sendPushToUser,
  sendPushToTokens,
  sendPushToNumbers,
  sendBroadcast,
  normalizePhoneNumber,
  ANDROID_CHANNEL,
  DEFAULT_TITLE,
};
