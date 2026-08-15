# Points Pricing System — Complete Implementation Blueprint

A drop-in points/credits monetisation module with **admin panel CRUD**,
**user-facing storefront**, and a **PayU payment integration**. Replicate this
exactly in another app to get the same UI, the same data shapes, and the same
flows.

---

## 1. What this system does (one screen)

```
        USER APP                                     ADMIN PANEL
  ┌────────────────────┐                       ┌─────────────────────┐
  │ Points Plans       │  ── buy ───►  PayU ── │ Points Plans (CRUD) │
  │ Points History     │                       │ Points Users        │
  │ Insufficient modal │  ── deduct ──► API ── │ Points Transactions │
  │ PayU Form          │                       │ Points PayLater     │
  │ Success / Failure  │                       │ Points PayU records │
  └────────────────────┘                       │ Points Settings     │
                                               └─────────────────────┘
                       ▲                                ▲
                       └─── shared MongoDB collections ─┘
```

- A user buys a **Points Plan** (₹100 → 100 pts, ₹200 → 200 pts, ₹900 → 1000 pts).
- Each "view owner contact" action **deducts** points (default 10).
- PayU success callback **credits** points idempotently.
- Admins **CRUD plans**, view **all users + balances**, **manually adjust**
  balances, view the **transaction ledger**, work **pay-later leads**, view
  **PayU records**, and tune **points-per-reveal** in settings.

---

## 2. Files to copy (verbatim)

### 2.1 Backend (Node/Express + Mongoose)

```
backend/
└── Points/
    ├── PointsModel.js              ← 4 base models
    ├── PointsPricingModel.js       ← re-exports + 2 admin models
    ├── PointsRouter.js             ← user-facing + PayU endpoints
    └── PointsPricingRouter.js      ← admin-only endpoints
```

### 2.2 Admin frontend (React + react-bootstrap + sweetalert2)

```
src/
└── PointsPricing/
    ├── PointsPlans.jsx             ← plan CRUD list + modal
    ├── PointsUsers.jsx             ← users + balance + adjust + admin logs
    ├── PointsTransactions.jsx      ← filterable ledger
    ├── PointsPayLater.jsx          ← leads pipeline
    ├── PointsPayU.jsx              ← PayU records (4 status tabs)
    └── PointsSettings.jsx          ← points-per-reveal config
```

### 2.3 User frontend (React + react-bootstrap + axios)

```
src/Components/
├── PointsPlans.jsx                 ← carousel of plans
├── PointsHistory.jsx               ← balance + grouped activity
├── InsufficientPointsModal.jsx     ← upsell modal
└── PayUPointsPayment/
    ├── PayUPointsForm.jsx          ← Pay Now / Pay Later
    ├── PaymentSuccessPoints.jsx    ← idempotent /points-credit on success
    └── PaymentFailurePoints.jsx
```

---

## 3. Mongo collections (4 + 2)

> Models live in `backend/Points/PointsModel.js` (base) and
> `backend/Points/PointsPricingModel.js` (admin re-exports + 2 extras).
> The admin file **does NOT redefine** the four base models — it re-exports
> them so admin and user routers operate on the same collection.

### 3.1 `pointsplans` — admin-configurable packs

| Field          | Type    | Notes                                             |
|----------------|---------|---------------------------------------------------|
| name           | String  | required, trim                                    |
| description    | String  | trim                                              |
| price          | Number  | INR, required, min 0                              |
| points         | Number  | required, min 0                                   |
| durationDays   | Number  | 0 = no expiry                                     |
| popular        | Boolean | "MOST POPULAR" badge                              |
| status         | enum    | `'active' \| 'hide'` (admin uses `active:bool`)   |
| sortOrder      | Number  | ascending sort on user storefront                 |
| timestamps     | true    |                                                   |

### 3.2 `pointsbalances` — one per user, keyed on `phoneNumber`

| Field              | Type   | Notes                          |
|--------------------|--------|--------------------------------|
| phoneNumber        | String | unique, indexed, normalized    |
| balance            | Number | redeemable                     |
| totalEarned        | Number | lifetime credited              |
| totalSpent         | Number | lifetime deducted              |
| totalPaid          | Number | lifetime ₹ paid for points     |
| lastActivityAt     | Date   |                                |

### 3.3 `pointstransactions` — immutable audit log

| Field        | Type   | Notes                                                        |
|--------------|--------|--------------------------------------------------------------|
| phoneNumber  | String | indexed                                                      |
| type         | enum   | `'credit' \| 'deduct'`                                       |
| points       | Number | min 0                                                        |
| balanceAfter | Number | for the ledger view                                          |
| planId       | String | credit-only — PointsPlan _id                                 |
| planName     | String | credit-only                                                  |
| amount       | Number | credit-only — ₹ paid                                         |
| txnId        | String | credit-only — PayU `mihpayid` (idempotency key)              |
| rentId       | String | deduct-only                                                  |
| reason       | String | deduct-only — e.g. `'view-owner-contact'`, `'manual-adjust'` |
| note         | String | manual adjusts use `MANUAL-ADJUST \| <reason> \| by <admin>` |

### 3.4 `pointspayus` — separate PayU log for points purchases

> Kept distinct from your existing `paymentpayu` collection so PayU for
> properties/plans is unaffected.

| Field          | Type    | Notes                                              |
|----------------|---------|----------------------------------------------------|
| txnid          | String  | indexed, internal id (`'points_' + Date.now()`)    |
| status         | String  | `process \| success \| fail \| pending`            |
| amount         | String  |                                                    |
| productinfo    | String  | default `'Points Plan'`                            |
| firstname/email/phone |  | normalized                                         |
| mihpayid       | String  | from PayU                                          |
| payUdate       | String  | ISO                                                |
| payustatususer | enum    | `pay now \| pay later \| paid \| pay failed`       |
| planName/planId/points | | denormalised at purchase                          |
| credited       | Boolean | guard against double-credit                        |

### 3.5 `pointspaylaterleads` — admin follow-up on pay-later attempts

`_id` is the PayU `txnid` (string), so it joins 1:1 with `pointspayus`.

| Field         | Type | Notes                                           |
|---------------|------|-------------------------------------------------|
| _id           | String  | txnid                                        |
| status        | enum    | `new \| contacted \| converted \| dropped`   |
| note          | String  |                                              |
| lastContactAt | Date    |                                              |
| updatedBy     | String  | admin name/id                                |
| history       | [obj]   | `{status, note, at, by}` push-only           |

### 3.6 `pointsconfigs` — singleton, `_id = 'points-config'`

| Field                  | Type   | Notes                          |
|------------------------|--------|--------------------------------|
| pointsPerContactReveal | Number | default 10, min 1              |
| updatedBy              | String |                                |

---

## 4. REST API surface

> All routes under `/PPC` prefix in this codebase (i.e. `app.use('/PPC', router)`).
> The admin frontend uses `process.env.REACT_APP_API_URL` which already ends
> with `/PPC`, so calls look like `${API}/points-plans`.

### 4.1 User-facing (mounted from `PointsRouter.js`)

| Method | Path                                  | Purpose                                  |
|--------|---------------------------------------|------------------------------------------|
| GET    | `/points-plans`                       | list **active** plans (storefront)       |
| GET    | `/points-plans/all`                   | list all (debug / admin fallback)        |
| POST   | `/points-plans/seed`                  | one-time seed of 3 default packs         |
| GET    | `/points-balance/:phoneNumber`        | get-or-create balance row                |
| POST   | `/points-deduct`                      | deduct on contact reveal                 |
| POST   | `/points-credit`                      | credit (idempotent on `txnId`)           |
| GET    | `/points-transactions/:phoneNumber`   | user's own history                       |
| POST   | `/select-points-plan`                 | acknowledge selection (no DB side effect)|
| POST   | `/payu/points-payment`                | "Pay Now" — returns hash + form fields   |
| POST   | `/payu/points-payment-later`          | "Pay Later" — saves intent               |
| GET/POST | `/payu/points-success`              | PayU surl — credits points, redirects    |
| GET/POST | `/payu/points-failure`              | PayU furl — marks fail, redirects        |
| GET    | `/payu/points-payments/success`       | (also used by admin)                     |
| GET    | `/payu/points-payments/failure`       | (also used by admin)                     |
| GET    | `/payu/points-payments/all`           | (also used by admin)                     |

### 4.2 Admin-only (mounted from `PointsPricingRouter.js`)

> Mounted on the **same `/PPC` prefix** so paths collide intentionally with the
> user routes only where re-using the same endpoint makes sense (e.g. plans
> CRUD, transactions). Mount the admin router AFTER the user router or under
> a sub-prefix like `/PPC/admin` if you want strict separation.

| Method | Path                                | Purpose                                       |
|--------|-------------------------------------|-----------------------------------------------|
| GET    | `/points-plans`                     | list **all** plans (active + hidden)          |
| POST   | `/points-plans`                     | create plan (`active:bool` ↔ `status`)        |
| PUT    | `/points-plans/:id`                 | update (rejects _id changes)                  |
| PATCH  | `/points-plans/:id/active`          | toggle `active`                               |
| DELETE | `/points-plans/:id`                 | **soft delete** (sets `status:'hide'`)        |
| GET    | `/points-users?page&limit&phone`    | paginated balances                            |
| POST   | `/points-adjust`                    | manual credit/debit (signed `points`)         |
| GET    | `/points-transactions?…`            | filterable ledger (see logical types below)   |
| GET    | `/points-paylater?page&limit&status`| leads list, merges PayU + lead rows           |
| PATCH  | `/points-paylater/:txnid`           | upsert lead status/note                       |
| GET    | `/points-config`                    | singleton                                     |
| PUT    | `/points-config`                    | update singleton                              |

### 4.3 Logical transaction `type` filter (admin)

`/points-transactions?type=` translates to:

- `purchase`        → `type:'credit'` AND `txnId != null` AND `note !~ ^MANUAL-ADJUST`
- `contact-reveal`  → `type:'deduct'` AND `reason == 'view-owner-contact'`
- `manual-adjust`   → `note ~ ^MANUAL-ADJUST`
- `refund`          → `note ~ ^MANUAL-ADJUST \| refund`
- `credit` / `deduct` → raw type

---

## 5. Critical conventions (don't break these)

1. **Phone normalisation everywhere.** Strip spaces/dashes and a leading
   `+91`, `91`, or `0`:
   ```js
   const normalizePhone = (raw='') =>
     String(raw).replace(/[\s-]/g,'').replace(/^(\+91|91|0)/,'').trim();
   ```
   The same helper exists in both routers and in `PointsUsers.jsx` (Add User
   modal). Keep them in lockstep.

2. **Idempotent crediting.** PayU success may be hit more than once. The router
   guards in **two** places:
   - `PointsPayU.credited === true` (per-payment lock), and
   - `PointsTransaction.findOne({ txnId, type: 'credit' })` (per-mihpayid lock).
   Never remove either guard.

3. **Soft delete plans only.** `PointsPlan._id` is a foreign key in
   `PointsTransaction` and `PointsPayU`. The admin DELETE endpoint sets
   `status:'hide'`. Don't expose hard delete from the admin UI either —
   `PointsPlans.jsx`'s "delete" calls the same endpoint, which just hides.

4. **Admin JSON uses `active:bool`, DB uses `status:'active'|'hide'`.** The
   admin router's `toPlanJSON` translates one to the other — do not leak
   `status` to the admin UI.

5. **Manual adjust note format is parsed by the UI**:
   ```
   MANUAL-ADJUST | <reason> | by <adminId>
   ```
   `PointsUsers.jsx::parseAdjustNote` splits on `' | '`. If you change the
   format on the server, update the parser, otherwise the Admin Logs modal
   will show garbled fields.

6. **`select-points-plan` is a no-op acknowledgement.** It exists so the UI
   has a single place to call before redirecting to PayU. Keep it — the user
   form depends on it.

7. **PayU hash sequence (don't reorder):**
   ```
   key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
   ```
   `udf1=planId`, `udf2=points`, `udf3=normalizedPhone`. Success callback
   echoes them back so we can credit even if `PointsPayU` was somehow lost.

8. **Re-export, don't redefine.** `PointsPricingModel.js` imports the four
   base models from `./PointsModel` and re-exports them. Do **not** redefine
   them — Mongoose will compile a second model and you'll silently double up.

---

## 6. Server wiring (server.js)

```js
const PointsRouter         = require('./Points/PointsRouter');
const PointsPricingRouter  = require('./Points/PointsPricingRouter');

// Order: base first, admin second. Both share the /PPC prefix.
app.use('/PPC', PointsRouter);
app.use('/PPC', PointsPricingRouter);
```

Required env (with sensible defaults already in `PointsRouter.js`):

```
PAYU_MERCHANT_KEY=...
PAYU_SALT=...
BACKEND_BASE_URL=https://your.api/PPC      # surl/furl host
FRONTEND_BASE_URL=https://your.web         # post-PayU redirect
```

---

## 7. Admin frontend wiring

### 7.1 Routing (Dashboard.jsx)

```jsx
import PointsPlans         from './PointsPricing/PointsPlans';
import PointsUsers         from './PointsPricing/PointsUsers';
import PointsTransactions  from './PointsPricing/PointsTransactions';
import PointsPayLater      from './PointsPricing/PointsPayLater';
import PointsPayU          from './PointsPricing/PointsPayU';
import PointsSettings      from './PointsPricing/PointsSettings';

// Inside your routes array (each gated by a permission key):
{ path: "/points-plans",        element: <PointsPlans />,        permissionKey: "Points Plans" },
{ path: "/points-users",        element: <PointsUsers />,        permissionKey: "Points Users" },
{ path: "/points-transactions", element: <PointsTransactions />, permissionKey: "Points Transactions" },
{ path: "/points-paylater",     element: <PointsPayLater />,     permissionKey: "Points PayLater" },
{ path: "/points-payu",         element: <PointsPayU />,         permissionKey: "Points PayU" },
{ path: "/points-settings",     element: <PointsSettings />,     permissionKey: "Points Settings" },
```

### 7.2 Sidebar (Sidebar.jsx)

A "Points Pricing" section gated on the union of those six permissions:

```jsx
{sv(["Points Plans","Points Users","Points Transactions",
     "Points PayLater","Points PayU","Points Settings"]) && (
  <>
    <li onClick={() => toggleMenu("pointsPricing")} style={{background:"#8BC34A"}}>
      <RiHandCoinFill size={20}/>Points Pricing
    </li>
    <ul className={show("pointsPricing")}>
      {can("Points Plans")        && <NavLink to="/dashboard/points-plans">Points Plans - List</NavLink>}
      {can("Points Users")        && <NavLink to="/dashboard/points-users">Points Users & Balance</NavLink>}
      {can("Points Transactions") && <NavLink to="/dashboard/points-transactions">Points Transactions</NavLink>}
      {can("Points PayLater")     && <NavLink to="/dashboard/points-paylater">Points Pay Later Leads</NavLink>}
      {can("Points PayU")         && <NavLink to="/dashboard/points-payu">Points PayU Records</NavLink>}
      {can("Points Settings")     && <NavLink to="/dashboard/points-settings">Points Settings</NavLink>}
    </ul>
  </>
)}
```

Add the six permission keys to your role/permissions seed table verbatim:
`Points Plans`, `Points Users`, `Points Transactions`, `Points PayLater`,
`Points PayU`, `Points Settings`.

### 7.3 Dependencies

```bash
npm i react-bootstrap bootstrap react-icons react-router-dom react-redux axios sweetalert2
```

### 7.4 Per-screen UI contract (so it looks identical)

| Screen               | Layout                                                                                          |
|----------------------|-------------------------------------------------------------------------------------------------|
| Points Plans         | Header + green "Create Plan" button. Table cols: Sort, Name, Description, Price (₹), Points, Duration, Popular (yellow Badge w/ ⭐), Active (Form.Check switch), Actions (FaEdit + MdDeleteForever). Modal w/ live preview line: `<Name> — ₹X for Y points (≈ Y/10 owner contact reveals), valid for Z days`. |
| Points Users         | Header + green "Add User" button. Search box (phone). Table: Phone, Balance (Badge), Earned, Spent, Paid (₹), Last Activity, **Admin Logs** button, Actions: **Txns** (navigates to `/dashboard/points-transactions?phone=…`) + **Adjust** (modal: radio Credit/Debit, points, reason). Add User modal validates `^\d{10}$` after normalisation. Admin Logs modal pulls `type=manual-adjust` and parses the note. |
| Points Transactions  | Filter row: Phone, Type select (6 options incl. logical types), Plan select (loaded from `/points-plans?all=1`), From/To dates, Filter & Reset icon buttons. Table: Date, Phone, Type Badge, Points (`+`/`−`, color-coded), Balance, Plan, Amount, Ref (txnId/rentId), Note/Reason. URL search params persist filters. Pagination at 50/page. |
| Points PayLater      | Yellow heads-up banner: "leads only — not revenue until converted". Status filter dropdown (`new\|contacted\|converted\|dropped`). Table: Date, Name, Phone, Email, Plan, Points, Amount, **Status** (Badge + inline Form.Select), Last Contact, By, **Note** button (FaStickyNote). Note modal saves to lead history with `adminId` = redux `admin.name` ?? `localStorage.adminName` ?? `'admin'`. |
| Points PayU          | 4 status tabs (Paid/PayNow/PayLater/PayFailed) with emoji + bg colour. Stat strip (Records/Total Amount/Total Points). Filters: Phone substring, txnid/mihpayid substring, From/To. Buttons: Refresh, **Export CSV**, **Print** (writes a fresh window with the table HTML). Status badges colour-coded. Source URL hint at bottom. |
| Points Settings      | Yellow heads-up banner explaining the user app reads a hardcoded fallback. Number input (`min=1`) for `pointsPerContactReveal`. Shows current server value, `updatedBy`, `updatedAt`. Save / Reload buttons. |

### 7.5 UI styling tokens used everywhere

```
Card shadow: 0 2px 8px rgba(0,0,0,0.08)
Table head bg: #F0F2F5
Primary green button bg: #1a7c3e
Heads-up banner: bg #FFF4D6, border #F5C542, text #7A5B00
Brand purple (user app): linear-gradient(135deg,#4F4B7E 0%,#764ba2 100%)
```

---

## 8. User-facing frontend wiring

### 8.1 Routes (`Components/RouterPage.jsx`)

```jsx
<Route path='/points-plans'             element={<PointsPlans />} />
<Route path='/payu-points-form'         element={<PayUPointsForm />} />
<Route path='/points-payment-success'   element={<PaymentSuccessPoints />} />
<Route path='/points-payment-failure'   element={<PaymentFailurePoints />} />
<Route path='/points-history'           element={<PointsHistory />} />
```

These exact paths are hard-coded as redirect targets in
`PointsRouter.js`'s `handlePointsSuccess` / `handlePointsFailure` and in
`InsufficientPointsModal.jsx`. **Don't rename them**, or update everywhere.

### 8.2 Storefront (`PointsPlans.jsx`)

- Reads `phoneNumber` from `location.state` or `localStorage`.
- `GET /points-plans` then falls back to a 3-card hardcoded list if the API
  fails (so the page is never blank). Fallback `_id`s are `points-100`,
  `points-200`, `points-900`.
- `GET /points-balance/:phoneNumber` shows current balance pill.
- Horizontal scroll snap with center-card scaling and pagination dots
  (`scrollSnapType: 'x mandatory'`, scale 0.92 → 1).
- "BUY POINTS" → confirm modal → `navigate('/payu-points-form', {state:{...}})`.

### 8.3 PayU form (`PayUPointsPayment/PayUPointsForm.jsx`)

- `txnid = 'points_' + Date.now()`, `productinfo = 'Points Plan'`.
- **Pay Now** flow:
  1. `POST /select-points-plan`
  2. `POST /payu/points-payment` returns `{ key, txnid, hash, surl, furl, udf1..5, ... }`
  3. Build a hidden HTML `<form method="POST" action="https://secure.payu.in/_payment">`,
     stuff every field as `<input type="hidden">`, submit.
- **Pay Later** flow: `POST /select-points-plan` → `POST /payu/points-payment-later`
  → success popup → 3 s redirect back to `/points-plans`.

### 8.4 Success / Failure (`PaymentSuccessPoints.jsx`, `PaymentFailurePoints.jsx`)

- Success page calls `POST /points-credit` with
  `{phoneNumber:phone, points, planId, amount, txnId:mihpayid}` to **double-
  guard** the credit even though the backend already credited inside the
  PayU success handler. Both checks use the same idempotency key. After 4 s
  it auto-redirects back to `/points-plans`.
- Failure page just summarises the txn and shows "Try Again".

### 8.5 Points history (`PointsHistory.jsx`)

- Calls `/points-balance/:phone` and `/points-transactions/:phone?limit=200`
  in parallel.
- Groups txns by calendar day (`createdAt.slice(0,10)`).
- Reuses the same `classify(txn)` logic the admin ledger uses
  (`MANUAL-ADJUST` → `manual`, credit+txnId → `purchase`,
  deduct+`view-owner-contact` → `reveal`).

### 8.6 Insufficient-points modal (`InsufficientPointsModal.jsx`)

- Rendered from `Details.jsx`. Triggered when balance < `POINTS_PER_CONTACT_VIEW`
  (hardcoded `10`).
- "Buy Starter Pack" navigates straight to `/payu-points-form` with
  `{_id:'points-100', name:'Starter', price:100, points:100}`.

### 8.7 Contact-reveal deduction (`Details.jsx`)

```js
const POINTS_PER_CONTACT_VIEW = 10;

// Before reveal:
const bal = await axios.get(`${API}/points-balance/${phone}`);
if (bal.data.balance < POINTS_PER_CONTACT_VIEW) {
  setShowInsufficientPoints(true);
  return;
}
const res = await axios.post(`${API}/points-deduct`, {
  phoneNumber: phone,
  points: POINTS_PER_CONTACT_VIEW,
  rentId,
  reason: 'view-owner-contact',
});
setPointsBalance(res.data.balance);
```

> The admin Settings page already persists `pointsPerContactReveal`. To make
> the user app honour it, replace `POINTS_PER_CONTACT_VIEW = 10` with a value
> fetched from `GET /points-config` on app load (cache it in context).
> The current code base ships the hardcoded `10` deliberately — it's flagged
> in `PointsSettings.jsx` so admins know.

---

## 9. End-to-end flows (sequence)

### 9.1 Buy points (Pay Now)

```
User      Frontend(PointsPlans → PayUPointsForm)      Backend                  PayU
 │  click BUY → confirm                                                          │
 │  ──navigate('/payu-points-form', state)──►                                    │
 │                                  POST /select-points-plan ─►                  │
 │                                                ◄── 200                        │
 │                                  POST /payu/points-payment ─►                 │
 │                                                ◄── {hash, key, surl, furl, …} │
 │                                  build hidden form, submit ───────────────►   │
 │                                                                  user pays    │
 │                                                ◄────POST /payu/points-success │
 │                                  PointsPayU.credited=true                     │
 │                                  PointsBalance += pts                         │
 │                                  PointsTransaction(credit, txnId=mihpayid)    │
 │  ◄──redirect FRONTEND_BASE_URL/points-payment-success?…                       │
 │  PaymentSuccessPoints calls POST /points-credit (idempotent — duplicate:true) │
```

### 9.2 Pay Later

```
User → PayUPointsForm "Pay Later"
        POST /select-points-plan
        POST /payu/points-payment-later        (PointsPayU.payustatususer='pay later', status='pending')
                                               (no PayU traffic, no credit)
Admin → PointsPayLater
        GET /points-paylater                   (joins PointsPayU + PointsPayLaterLead)
        PATCH /points-paylater/:txnid          (status: contacted → converted)
```

### 9.3 Contact reveal (deduct)

```
User clicks "View owner contact"
  GET  /points-balance/:phone
  if < 10 → InsufficientPointsModal
  POST /points-deduct {phone, 10, rentId, reason:'view-owner-contact'}
       PointsBalance -= 10, lastActivityAt = now
       PointsTransaction(deduct, reason:'view-owner-contact', rentId, balanceAfter)
```

### 9.4 Manual adjust (admin)

```
PointsUsers → Adjust modal → POST /points-adjust
    body: {phoneNumber, points: ±N, reason, adminId}
    server: $inc balance/totalEarned/totalSpent atomically
            PointsTransaction(type: credit|deduct,
                              note: 'MANUAL-ADJUST | <reason> | by <adminId>',
                              reason: 'manual-adjust')
```

---

## 10. Replication checklist

When you drop this into another app, work through these in order:

1. **Backend**
   - [ ] Copy `Points/` folder into your backend.
   - [ ] Mount both routers in `server.js` (see §6).
   - [ ] Set `PAYU_MERCHANT_KEY`, `PAYU_SALT`, `BACKEND_BASE_URL`,
         `FRONTEND_BASE_URL`.
   - [ ] (Optional) hit `POST /PPC/points-plans/seed` once to insert the 3
         default packs.
   - [ ] Smoke test: `GET /PPC/points-plans` returns `[]` or seeded rows.

2. **Admin app**
   - [ ] Copy `src/PointsPricing/` folder.
   - [ ] Add 6 routes to your dashboard router (§7.1).
   - [ ] Add the Sidebar block (§7.2).
   - [ ] Add 6 permission keys to your roles seed table.
   - [ ] Confirm `process.env.REACT_APP_API_URL` ends in `/PPC`.
   - [ ] Verify Redux exposes `state.admin.name` (otherwise the screens fall
         back to `localStorage.getItem('adminName')` then `'admin'`).
   - [ ] Smoke test each of the 6 screens.

3. **User app**
   - [ ] Copy `Components/PointsPlans.jsx`, `PointsHistory.jsx`,
         `InsufficientPointsModal.jsx`, and the `PayUPointsPayment/` folder.
   - [ ] Add the 5 routes to `RouterPage.jsx` (§8.1) — names matter.
   - [ ] Add a "Buy Points" / "Points History" entry to your Navbar/menu.
   - [ ] In your details/contact-reveal page, wire `POINTS_PER_CONTACT_VIEW`
         + balance check + `/points-deduct` (§8.7).
   - [ ] Confirm `localStorage.phoneNumber` is set after login (every screen
         relies on it).
   - [ ] End-to-end test on PayU sandbox: success and failure callbacks both
         hit the redirect URL with the right query params.

4. **Cross-cutting**
   - [ ] Phone normalisation helper is identical in backend (`normalizePhone`)
         and the admin Add-User modal (`normalizeLocal`).
   - [ ] Both PayU credit guards (`PointsPayU.credited` and the
         `txnId`-keyed `PointsTransaction.findOne`) are in place.
   - [ ] DELETE `/points-plans/:id` returns 200 and just hides — never hard-
         deletes.

---

## 11. What this blueprint deliberately does NOT include

- Authentication / OTP. Routes assume the user app already knows
  `phoneNumber` from its own auth flow.
- Refunds beyond the convention `note: 'MANUAL-ADJUST | refund | by …'`.
  No automated PayU refund call — the admin creates a debit via Adjust.
- Plan expiry enforcement. `durationDays` is stored and shown but the
  deduct path doesn't check expiry. If you need it, gate `/points-deduct`
  on `lastCreditedAt + durationDays`.
- Multi-currency. INR only.
- Unit tests. There are none in the source — add your own around the
  idempotency guard (the highest-blast-radius logic).

---

That's the whole system: 4 backend files, 6 admin screens, 6 user screens,
6 collections, ~30 endpoints. Copy verbatim and the UI/UX will match
1-for-1.
