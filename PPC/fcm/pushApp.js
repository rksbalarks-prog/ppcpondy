// Firebase Admin app used ONLY for FCM push notifications.
//
// Pondy Properties carries THREE Firebase service accounts:
//
//   • config/serviceAccountKey.json  (project ppc-2-a4437)
//     — already initialised as the DEFAULT admin app in user/UserRouter.js,
//       where it verifies Firebase Phone Auth ID tokens for OTP login.
//
//   • ppcpondy-serviceAccountKey.json  (project ppcpondy-9e33d)
//     — the project the mobile app itself is registered in. This is what push
//       uses, because google-services.json comes from here.
//
//   • serviceAccountKey.json  (project notification-5fb49)
//     — an earlier notifications project, kept only as a fallback. No mobile
//       app was ever registered against it.
//
// firebase-admin only allows one DEFAULT app per process, so push initialises a
// NAMED secondary app ("push"). That keeps this module fully additive: the OTP
// path is untouched, and neither can break the other.
//
// IMPORTANT: the project this key belongs to MUST be the same project the
// mobile app's google-services.json comes from, or every send fails with
// "SenderId mismatch" / messaging/mismatched-credential.
const path = require('path');
const admin = require('firebase-admin');

const APP_NAME = 'push';

// A relative FCM_SERVICE_ACCOUNT is resolved against the PPC root (not
// process.cwd(), so it behaves the same whether pm2 starts the server from
// PPC/ or elsewhere). With nothing configured we take the first key that
// exists, newest project first — so dropping the ppcpondy key on the server is
// enough to switch senders even if that server's .env still says otherwise.
const PPC_ROOT = path.join(__dirname, '..');
const FALLBACK_KEYS = [
  'ppcpondy-serviceAccountKey.json', // ppcpondy-9e33d — the app's own project
  'serviceAccountKey.json',          // notification-5fb49 — legacy
];
const configured = (process.env.FCM_SERVICE_ACCOUNT || '').trim();
const keyPath = configured
  ? (path.isAbsolute(configured) ? configured : path.resolve(PPC_ROOT, configured))
  : (FALLBACK_KEYS
      .map((f) => path.join(PPC_ROOT, f))
      .find((p) => require('fs').existsSync(p)) ||
     path.join(PPC_ROOT, FALLBACK_KEYS[FALLBACK_KEYS.length - 1]));

let pushApp = null;

try {
  // Reuse the app if this module gets required twice (nodemon / test reloads).
  pushApp = admin.apps.find((a) => a && a.name === APP_NAME) || null;
  if (!pushApp) {
    const serviceAccount = require(keyPath);
    pushApp = admin.initializeApp(
      { credential: admin.credential.cert(serviceAccount) },
      APP_NAME
    );
    console.log(
      '✅ Firebase Admin (push) initialised — project:',
      serviceAccount.project_id
    );
  }
} catch (err) {
  // A missing/invalid key must NOT crash the server — push simply stays
  // unavailable and every send is a logged no-op.
  console.error('⚠️  Firebase Admin (push) NOT initialised — push disabled:', err.message);
}

/** Null when Firebase isn't configured; callers must handle that. */
function messaging() {
  return pushApp ? pushApp.messaging() : null;
}

module.exports = { pushApp, messaging, APP_NAME };
