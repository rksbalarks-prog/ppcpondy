// Additive routes for FCM push notifications.
//
//   POST /register-fcm-token   { phoneNumber, token, platform }
//        Upserts a device token so the backend can target this user.
//   POST /send-test-push       { phoneNumber, title?, body? }      [push key]
//   POST /push-send            { title, body, route?, ppcId?, audience } [push key]
//   GET  /push-stats                                                [push key]
//
// Mounted at /PPC in server.js, exactly like the other routers. It MUST be
// mounted before SingleSendRouter — that router's catch-all GET "/:id" would
// otherwise swallow GET /PPC/push-stats and 500 on the ObjectId cast.
const express = require('express');
const FcmToken = require('./FcmTokenModel');
const {
  sendPushToUser,
  sendPushToNumbers,
  sendBroadcast,
  normalizePhoneNumber,
  DEFAULT_TITLE,
} = require('./sendPush');

const router = express.Router();

// Build the `data` payload the app reads (route wins; else a ppcId deep-links
// to that property). Matches AppRoutes.propertyDetail in the Flutter app.
function buildData({ route, ppcId }) {
  const data = {};
  if (route) data.route = String(route);
  if (ppcId) data.ppcId = String(ppcId);
  return data;
}

// Gate the admin/testing push endpoints behind a shared secret
// (PUSH_ADMIN_KEY in .env), sent by the admin panel as the `x-push-key`
// header. Secure-by-default: if the key isn't configured, deny. This does NOT
// gate /register-fcm-token — the app must call that openly to register itself.
function requirePushKey(req, res, next) {
  const configured = process.env.PUSH_ADMIN_KEY;
  if (!configured) {
    return res
      .status(503)
      .json({ success: false, message: 'Push admin key not configured' });
  }
  if ((req.headers['x-push-key'] || '') !== configured) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// Register / refresh a device's FCM token. Keyed by the token itself so the
// same device updates in place and a token that moved to a new number is
// re-pointed rather than duplicated.
router.post('/register-fcm-token', async (req, res) => {
  try {
    const { phoneNumber, token, platform } = req.body || {};
    if (!phoneNumber || !token) {
      return res
        .status(400)
        .json({ success: false, message: 'phoneNumber and token are required' });
    }
    const phone = normalizePhoneNumber(phoneNumber);

    await FcmToken.findOneAndUpdate(
      { token },
      { phoneNumber: phone, token, platform: platform || 'unknown' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('register-fcm-token error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send a test push to one number, to confirm the whole pipe works.
router.post('/send-test-push', requirePushKey, async (req, res) => {
  try {
    const { phoneNumber, title, body, route, ppcId } = req.body || {};
    if (!phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: 'phoneNumber is required' });
    }
    const result = await sendPushToUser(
      phoneNumber,
      {
        title: title || DEFAULT_TITLE,
        body: body || 'This is a test notification.',
      },
      buildData({ route, ppcId })
    );
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('send-test-push error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Admin: compose & send ──────────────────────────────────────────────
// POST /push-send
//   { title, body, route?, ppcId?, audience: { type, number?, numbers? } }
//   audience.type: 'all' | 'number' | 'numbers'
// (Top-level path, NOT /admin/*, to avoid AdminRouter's `/admin/:id`.)
router.post('/push-send', requirePushKey, async (req, res) => {
  try {
    const { title, body, route, ppcId, audience } = req.body || {};
    if (!title || !body) {
      return res
        .status(400)
        .json({ success: false, message: 'title and body are required' });
    }
    const aud = audience || { type: 'all' };
    const notification = { title, body };
    const data = buildData({ route, ppcId });

    let result;
    if (aud.type === 'number') {
      if (!aud.number) {
        return res
          .status(400)
          .json({ success: false, message: 'audience.number required' });
      }
      result = await sendPushToUser(aud.number, notification, data);
    } else if (aud.type === 'numbers') {
      const list = Array.isArray(aud.numbers)
        ? aud.numbers
        : String(aud.numbers || '')
            .split(/[\s,]+/)
            .filter(Boolean);
      result = await sendPushToNumbers(list, notification, data);
    } else {
      result = await sendBroadcast(notification, data);
    }

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('push-send error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /push-stats -> registered-device summary for the admin screen.
router.get('/push-stats', requirePushKey, async (_req, res) => {
  try {
    const [totalTokens, distinctUsers, byPlatform] = await Promise.all([
      FcmToken.countDocuments({}),
      FcmToken.distinct('phoneNumber').then((a) => a.length),
      FcmToken.aggregate([{ $group: { _id: '$platform', count: { $sum: 1 } } }]),
    ]);
    const platforms = {};
    byPlatform.forEach((p) => {
      platforms[p._id || 'unknown'] = p.count;
    });
    return res.json({ success: true, totalTokens, distinctUsers, platforms });
  } catch (err) {
    console.error('push-stats error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
