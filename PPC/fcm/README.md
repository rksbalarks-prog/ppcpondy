# Push notifications (FCM) — Pondy Properties

Firebase Cloud Messaging for the Pondy Property mobile app. Everything here is
**additive**: a new folder in the backend, a new Mongo collection, a new admin
screen, and a new service in the Flutter app. No existing route, model, or
screen was modified beyond registering the new pieces.

---

## The Firebase projects — read this first

Pondy Properties carries **three** Firebase service accounts, and they are not
interchangeable:

| Key file | Project | Used for | Admin app |
|---|---|---|---|
| `PPC/config/serviceAccountKey.json` | `ppc-2-a4437` | Verifying Firebase Phone Auth ID tokens (OTP login) | `[DEFAULT]`, initialised in `user/UserRouter.js` |
| `PPC/ppcpondy-serviceAccountKey.json` | `ppcpondy-9e33d` | **Sending pushes** — the project the mobile app is registered in | `"push"`, initialised in `fcm/pushApp.js` |
| `PPC/serviceAccountKey.json` | `notification-5fb49` | Legacy fallback only — no mobile app was ever registered here | — |

`firebase-admin` allows only one `[DEFAULT]` app per process, so push uses a
**named secondary app**. That is why `fcm/sendPush.js` calls
`require('./pushApp').messaging()` instead of `admin.messaging()` — using the
default app would send from the OTP project and fail.

> **The single most important rule:** the project whose service-account key the
> backend sends with **must be the same project** the mobile app's
> `google-services.json` came from. Mismatch it and every send fails with a
> `SenderId mismatch` / `messaging/mismatched-credential` error.

Push sends from **`ppcpondy-9e33d`**, because that is the project the Android
app `com.ppcpondy.pondy_properties` is registered in. `FCM_SERVICE_ACCOUNT` in
`PPC/.env` picks the key; with it unset, `pushApp.js` takes the first of
`ppcpondy-serviceAccountKey.json` → `serviceAccountKey.json` that exists, so
dropping the key on the server is enough to switch senders even if that box's
`.env` still points elsewhere.

---

## Setup checklist

### 1. Backend — `PPC/.env`

```
PUSH_ADMIN_KEY=<long random string>
FCM_SERVICE_ACCOUNT=./ppcpondy-serviceAccountKey.json
```

`PUSH_ADMIN_KEY` gates `/push-send`, `/push-stats` and `/send-test-push`. It is
**secure-by-default**: if unset those endpoints return `503`, they do not fall
open. `/register-fcm-token` is deliberately ungated — the app must be able to
register itself.

A relative `FCM_SERVICE_ACCOUNT` resolves against the `PPC/` root, not
`process.cwd()`, so it behaves the same however pm2 starts the server.

On boot you should see:

```
✅ Firebase Admin (push) initialised — project: ppcpondy-9e33d
```

If the key is missing or invalid you get a warning instead and the server keeps
running — push is simply unavailable, nothing else breaks.

### 2. Admin panel — `Pondy Properties ADMIN/.env`

```
REACT_APP_PUSH_ADMIN_KEY=<the same string as PUSH_ADMIN_KEY>
```

This is baked in at build time, so the admin app must be **rebuilt** after
changing it. Then grant the new **"Push Notifications"** permission key to the
relevant roles in *Office Setup → Users* — the sidebar entry stays hidden until
a role has it.

### 3. Mobile app — `google-services.json` (the one manual step left)

Firebase console → project **`ppcpondy-9e33d`** (the same project as
`PPC/ppcpondy-serviceAccountKey.json`) → *Add app → Android*:

* **Package name:** `com.ppcpondy.pondy_properties` (must match `applicationId`
  in `android/app/build.gradle.kts` — google-services matches on applicationId,
  not namespace)
* Download `google-services.json` → drop it at
  `PondyPropertiesFlutter/android/app/google-services.json`

Until that file exists the app still builds and runs perfectly — push is just
inert. Two independent guards make that true:

* `android/app/build.gradle.kts` applies the google-services plugin only
  `if (file("google-services.json").exists())`, so the build doesn't hard-fail
  with *"File google-services.json is missing"*.
* `PushService.init()` catches the `Firebase.initializeApp()` failure, leaves
  `available == false`, and every method becomes a no-op.

For iOS, add `GoogleService-Info.plist` to the Runner target and enable Push
Notifications + Background Modes capabilities. (Android is what ships today.)

---

## How it works

```
Flutter app                       Backend                     Admin panel
───────────                       ───────                     ───────────
PushService.init()                                            📣 Push Notifications
  ├─ Firebase.initializeApp()                                   ├─ GET  /push-stats
  ├─ creates channel                                            └─ POST /push-send
  │  'ppcpondy_default'                   ┌──────────────┐            │
  └─ registerFor(phone) ──POST────────────►│/register-fcm-│            │
                          /register-fcm-  │    token     │            │
                          token           └──────┬───────┘            │
                                                 ▼                    ▼
                                          FcmToken collection ◄── sendPush.js
                                          {phoneNumber, token,       │
                                           platform}                 │
      OS notification  ◄────────────── FCM ◄──────────────────────────┘
```

**Token lifecycle.** Tokens are keyed by the token itself, not the phone
number, so one device updates in place and a device that changes hands is
re-pointed to the new number rather than duplicated. One number may hold many
tokens (multiple devices). Tokens FCM reports as dead
(`registration-token-not-registered`, `invalid-registration-token`,
`invalid-argument`) are pruned automatically on the next send.

**The channel id `ppcpondy_default` appears in three places** and they must
agree, or Android 8+ silently downgrades the notification's importance:

* `PPC/fcm/sendPush.js` → `ANDROID_CHANNEL`
* `lib/services/push_service.dart` → `_channel`
* `android/app/src/main/AndroidManifest.xml` → the
  `default_notification_channel_id` meta-data (used for messages that arrive
  while the app is backgrounded or terminated)

**Foreground banners.** FCM does not display a notification itself while the
app is in the foreground on Android, so `PushService` shows one via
`flutter_local_notifications`.

**Deep links.** The `data` payload carries either a `route` (a route name from
`lib/routes.dart`) or a `ppcId` (opens that property). `route` wins. A route the
app doesn't recognise falls back to the notifications list instead of throwing —
`onGenerateRoute` returns `null` for unknown names, which would otherwise assert.

---

## Endpoints

All mounted at `/PPC` in `server.js`, **before `SingleSendRouter`** — that
router has a catch-all `GET "/:id"` that would otherwise swallow
`GET /PPC/push-stats` and 500 on the ObjectId cast.

| Method | Path | Auth | Body / notes |
|---|---|---|---|
| `POST` | `/register-fcm-token` | none | `{ phoneNumber, token, platform }` |
| `POST` | `/send-test-push` | `x-push-key` | `{ phoneNumber, title?, body?, route?, ppcId? }` |
| `POST` | `/push-send` | `x-push-key` | `{ title, body, route?, ppcId?, audience }` |
| `GET`  | `/push-stats` | `x-push-key` | device/user/platform counts |

`audience` is `{type:'all'}`, `{type:'number', number}`, or
`{type:'numbers', numbers}` (array, or a comma/whitespace-separated string).

All send endpoints return `{ success, sent, failed, tokens }`.

Note the public URL carries `/PPC` twice — `https://ppcpondy.com/PPC/PPC/push-stats` —
because nginx maps `/PPC` to the node root and express mounts these at `/PPC`.
The admin app's `REACT_APP_API_URL` already includes both.

---

## Verifying end to end

1. Run the app on a real device (an emulator without Play Services can't get a
   token). In debug it prints `FCM_TOKEN=…`.
2. Paste that token into Firebase console → *Cloud Messaging → Send test
   message*. If that fails, the problem is the app/Firebase config, not the
   backend.
3. Then check the backend has it:
   ```
   curl -H "x-push-key: $PUSH_ADMIN_KEY" https://ppcpondy.com/PPC/PPC/push-stats
   ```
4. Then send to yourself from the admin screen with audience = *Single number*.

**Common failures**

| Symptom | Cause |
|---|---|
| `503 Push admin key not configured` | `PUSH_ADMIN_KEY` missing from `PPC/.env` |
| `401 Unauthorized` | admin `REACT_APP_PUSH_ADMIN_KEY` differs, or the admin app wasn't rebuilt after changing it |
| `sent: 0, tokens: 0` | no device registered for that number — the app registers only after login |
| `messaging/mismatched-credential` | the service-account project ≠ the `google-services.json` project |
| Notification arrives silently / low priority | channel id mismatch across the three places listed above |

---

## Known limitation

Logging out does not delete the device's token server-side, so pushes aimed at
the previous number still reach that device until someone logs in again (the
token row is keyed by token, so the next login re-points it). This matches the
Rent Pondy implementation. If that matters, add a `DELETE /fcm-token` call to
`SessionProvider.logout()`.
