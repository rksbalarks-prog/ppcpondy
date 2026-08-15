# Pondy Property — Flutter user app

A Flutter port of the **Pondy Properties USER** React web app (`../Pondy Properties USER`).

It talks to the **same backend and the same MongoDB database** — no new endpoints, no
schema changes. Every request goes to `https://ppcpondy.com/PPC/PPC` and carries the
`?base=PY|CH` city tag, exactly like the web app's axios interceptor.

---

## Running it

```bash
flutter pub get
flutter run                       # phone / emulator
flutter run -d chrome             # web
flutter build apk --release       # Android
```

To point the app at a different backend (e.g. a staging box) without editing code:

```bash
flutter run \
  --dart-define=API_URL=https://staging.example.com/PPC/PPC \
  --dart-define=FILE_HOST=https://staging.example.com/PPC
```

Defaults live in [`lib/core/config.dart`](lib/core/config.dart) and match the web `.env`.

---

## Project layout

```
lib/
├── main.dart                  app entry; wraps every page in the 470px PhoneFrame
├── routes.dart                named routes, one per React Router path
├── core/
│   ├── config.dart            API_URL / FILE_HOST / PayU / support contacts
│   ├── api_client.dart        Dio + the ?base=PY|CH request interceptor
│   ├── city_base.dart         PY/CH active-city state (port of utils/cityBase.js)
│   ├── session.dart           SharedPreferences — the localStorage stand-in
│   ├── formatters.dart        Lakhs/Cr pricing, Indian digit grouping, media URLs
│   └── theme.dart             colours lifted from the React inline styles
├── models/                    Property, BuyerAssistance, Plan, Points, Notification…
├── services/                  one file per API area (auth, property, buyer, account…)
├── state/session_provider.dart  phone number + city + points balance + unread count
├── widgets/                   navbar, drawer, category strip, bottom nav, cards
└── screens/                   the UI, grouped by area
```

### Where each React screen went

| React | Flutter |
|---|---|
| `MoblieViews.jsx` + `Main.jsx` | `screens/main_shell.dart` |
| `Login.jsx` | `screens/login_screen.dart` |
| `Navbar.jsx` | `widgets/app_navbar.dart` + `widgets/app_drawer.dart` |
| `TopBar.jsx` | `widgets/category_bar.dart` |
| `BottomNavigation.jsx` | `widgets/bottom_nav.dart` |
| `AllProperty.jsx`, `PyProperty.jsx`, `ChennaiProperty.jsx`, `FeatureProperty.jsx`, `ZeroView.jsx`, `SaleProperty.jsx` | `screens/feed/property_feed_screen.dart` (one screen, `FeedSource` picks the endpoint) |
| the simple + advanced search modals | `screens/feed/property_filter_sheet.dart` |
| `PropertyCards.jsx` card markup | `widgets/property_card.dart` |
| `DetailProperty.jsx` / `Details.jsx` | `screens/property/property_detail_screen.dart` |
| `AddProps.jsx` (6-step wizard) | `screens/property/add_property_screen.dart` |
| `MyProperty.jsx` / `MyProperties.jsx` | `screens/property/my_property_screen.dart` |
| `RemovedProperty.jsx` | `screens/property/removed_property_screen.dart` |
| `BuyerAssistance.jsx` / `EditBuyerAssistance.jsx` | `screens/buyer/buyer_assistance_form_screen.dart` |
| `BuyerLists.jsx` / `BuyerList.jsx` | `screens/buyer/buyer_list_screen.dart` |
| `BuyerAssisBuyer.jsx` | `screens/buyer/my_buyer_assistance_screen.dart` |
| `DetailBuyerAssis.jsx` | `screens/buyer/buyer_assistance_detail_screen.dart` |
| `MoreComponent.jsx` / `OwnerMenu.jsx` / `BuyerMenu.jsx` | `screens/menu/menu_screen.dart` |
| the ~25 near-identical `Components/Detail/*.jsx` lists | `screens/menu/activity_list_screen.dart`, driven by `ActivityService.ownerFeeds` / `buyerFeeds` |
| `PropertyMap.jsx` | `screens/feed/property_map_screen.dart` |
| `PropertyVideo.jsx` | `screens/feed/property_video_screen.dart` |
| `Groom.jsx` / `Bride.jsx` | `screens/feed/matrimony_screen.dart` |
| `MyProfile.jsx` | `screens/account/my_profile_screen.dart` |
| `Notification.jsx` | `screens/account/notifications_screen.dart` |
| `AddPlan.jsx`, `PricingPlans.jsx`, `MyPlan.jsx`, `BuyerPlan.jsx`, `ExpiredPlans.jsx` | `screens/plans/plans_screen.dart` (`PlansKind` picks the list) |
| `PointsPlans.jsx` | `screens/plans/points_plans_screen.dart` |
| `PointsHistory.jsx` | `screens/plans/points_history_screen.dart` |
| `PayUForm.jsx` + success/failure pages | `screens/plans/payu_checkout_screen.dart` |
| `About`, `RefundPolicy`, `TermsAndCondition`, `PrivacyPolicy`, `ShippingAndDelivery`, `FAQ`, `BusinessOpportunity`, `OurSupport` | `screens/account/static_page_screen.dart` |
| `ContactUs.jsx` / `ContactedPage.jsx` | `screens/account/contact_us_screen.dart` |

---

## Behaviour kept identical to the web

**City base.** `PY` = Pondicherry, `CH` = Chennai. The active base is persisted under
the same `activeBase` key and appended to every backend request as `?base=`, so the
server's `cityScopePlugin` returns the right city's data. The purple pill bar at the
top of the home screen switches it and re-fetches the feed.

**Login.** City → what-you-need → phone → OTP. The admin *direct-verify* bypass is
checked first (`/user/direct-verified-users`); if the number is pre-verified the OTP
step is skipped entirely. OTPs, login-success, failed-OTP and logout notices are
relayed over WhatsApp through `/send-message`, non-blocking, using the same message
templates as the React source.

**Storage keys.** `phoneNumber`, `activeBase`, `freshLogin`, `lastActiveContent` and the
per-property action flags (`interestSent-<ppcId>`, `isHeartClicked-<ppcId>`, …) use the
same names as `localStorage` on the web.

**Feed merge.** The home feed calls `/fetch-featured-properties-on-demand` and
`/fetch-active-users-on-demand` in parallel, flags the featured rows, drops the
duplicates from the active list and sorts newest-first — the same merge as
`AllProperty.jsx`. Promo banners from `/get-uploadimages-ads` are spliced in after
every sixth card.

**Pricing display.** `formatPrice()` is ported verbatim: ≥1 Cr → `1.25 Cr`,
≥1 L → `45.00 Lakhs`, otherwise Indian digit grouping. Admin-set "On Demand"
listings render in the same maroon as the web.

**Contact limits.** `/contact` returns the daily quota; a 429 shows the same
"daily contact limit reached" message.

**Payments.** `PayuCheckoutScreen` asks the backend to sign the transaction, then
POSTs the signed fields to `https://secure.payu.in/_payment` inside a WebView — the
Flutter equivalent of the hidden auto-submitting form in `PayUForm.jsx`. "Pay Later"
hits the same `/payu/payment-later*` endpoint.

---

## Differences from the web, and why

- **Maps use OpenStreetMap** (`flutter_map`) instead of Google Maps, so the app runs
  with no API key. The "View on Map" / "Directions" buttons still hand off to the
  device's Google Maps app.
- **Push notifications are not wired up.** The web registers a mock FCM token
  (`Login.jsx` literally generates `fcm-token-${Date.now()}-…`); real FCM needs a
  `google-services.json` / `GoogleService-Info.plist` from the project's Firebase
  console. `AuthService.registerFcmToken` is ready for it — call it once you add
  `firebase_messaging`. The in-app notification centre and bell badge work today via
  `/notifications/:phone` and `/notification-unread-count`.
- **The ~25 Owner/Buyer detail list screens are one screen.** They differ only by
  endpoint and title, so they are table-driven from `ActivityService` instead of
  copy-pasted. Adding another list is a one-line `ActivityFeed` entry.
- **Filters are one bottom sheet** rather than the web's separate "simple" and
  "advanced" modals. The matching rules and the sort options are the same.
- **Web-only routes are omitted** — the desktop landing page (`App.js`), `WebLogin`,
  `TermsAndConditionWeb` and the other `*Web` variants exist only because the web app
  serves both a desktop site and a mobile shell from one bundle.

---

## Tests

```bash
flutter analyze     # clean
flutter test        # 8 tests
```

Coverage is on the parts most likely to break silently against live data: the price /
number / phone formatters, and `Property`'s tolerance of the loosely-typed documents
Mongo returns (numbers as strings, `price` as the literal `"On Demand"`, Windows-style
backslashes in photo paths, missing arrays).
