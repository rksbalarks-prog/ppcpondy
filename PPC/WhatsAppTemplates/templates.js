// Pondy Properties WhatsApp TEMPLATES (Meta-approved messages) - action alerts,
// login / account messages and registration messages.
//
// WHY TEMPLATES: on the official WhatsApp number (SmartGrowth - the account shared
// with Pondicherry Matrimony) a business may only start a conversation, or write
// after 24 h of silence, with a template Meta has approved. Every alert below is
// such a message (the owner did not write to us first).
//
// Rules Meta enforces, kept here so a template is not refused:
//   - name: lowercase letters, digits, underscores; all are prefixed pp_ so they sit
//     apart from the matrimony templates on the same account
//   - a variable is {{1}}, {{2}}... in order, never at the very start or end of the body
//   - every variable needs an example; a sent value may not hold new lines / tabs
//   - UTILITY = about something the person did or owns (an action on their property,
//     their login). No offers or promotion in these, or Meta re-files them as MARKETING.
//
// Owner phone numbers are NOT put in buyer-side messages (they are unlocked with
// points) - only in "you unlocked the owner contact", which is sent after paying.
//
// `source` says what sends it:
//   send-message  the website / app's existing POST /send-message (classified by its text)
//   login         same route, first successful login of a number -> welcome
//   bot           the WhatsApp Buyer / Seller bot (when its free-text reply cannot go)
//   admin         defined and approvable; sent from the admin page (not automatic yet)

const SITE = 'https://pondyproperty.com';
const SUPPORT = '8300622013';

const T = (key, o) => ({ key, name: `pp_${key}`, category: 'UTILITY', language: 'en', footer: 'Pondy Properties', defaultOn: true, ...o });

const TEMPLATES = [
  // ── account ───────────────────────────────────────────────────────────────
  {
    key: 'login_otp', name: 'pp_login_otp', category: 'AUTHENTICATION', language: 'en', audience: 'account', source: 'send-message',
    label: 'Login OTP', when: 'Login / sign-up OTP (Meta writes the wording and the Copy code button itself)',
    body: '{{1}} is your verification code. For your security, do not share this code.', example: ['482913'],
    defaultOn: false, note: 'Test on a test number first: if SmartGrowth cannot fill the Copy code button, the OTP goes by OneMsg as now.',
  },
  T('login_success', {
    audience: 'account', source: 'send-message', label: 'Login successful', when: 'After a successful login',
    body: 'Login successful on your Pondy Properties account for the number ending {{1}} on {{2}}. If this was not you, please call us on ' + SUPPORT + '.',
    example: ['3210', '25 Nov 2026, 10:30 AM'],
  }),
  T('login_failed', {
    audience: 'account', source: 'send-message', label: 'Login failed', when: 'A wrong OTP was entered',
    body: 'A wrong OTP was entered for your Pondy Properties account (number ending {{1}}) on {{2}}. If this was not you, please call us on ' + SUPPORT + '.',
    example: ['3210', '25 Nov 2026, 10:30 AM'],
  }),
  T('logout', {
    audience: 'account', source: 'send-message', label: 'Logged out', when: 'After logging out', defaultOn: false,
    body: 'Your Pondy Properties account (number ending {{1}}) was logged out on {{2}}. If this was not you, please call us on ' + SUPPORT + '.',
    example: ['3210', '25 Nov 2026, 10:30 AM'],
  }),

  // ── registration ──────────────────────────────────────────────────────────
  T('welcome', {
    audience: 'account', source: 'login', label: 'Welcome (new account)', when: 'First successful login of a number (instead of "Login successful")',
    body: 'Welcome to Pondy Properties! Your account for the number ending {{1}} is ready. You can post your property for sale, or tell us what you want to buy, and our team will help you.',
    example: ['3210'],
  }),
  T('property_received', {
    audience: 'owner', source: 'bot', label: 'Property received', when: 'A property was posted (WhatsApp Seller form)',
    body: 'Thank you {{1}}. Your property PPC ID {{2}} ({{3}}) has been received. Our team will verify it and make it live soon.',
    example: ['Ravi', '9001', 'Plot in Kalapet'],
  }),
  T('buyer_request_saved', {
    audience: 'user', source: 'bot', label: 'Buyer requirement saved', when: 'A buyer requirement was saved (WhatsApp Buyer form)',
    body: 'Thank you {{1}}. Your buyer requirement (Buyer ID {{2}}: {{3}}) is saved. Our team will call you with matching properties.',
    example: ['Anu', '777', '3 BHK House in Lawspet, 40-60 Lakhs'],
  }),
  T('property_live', {
    audience: 'owner', source: 'admin', label: 'Property is live', when: 'A property was approved and is live',
    body: 'Good news {{1}}! Your property PPC ID {{2}} ({{3}}) is now live on Pondy Properties. Buyers can see it and contact you.',
    example: ['Ravi', '9001', 'Plot in Kalapet'],
  }),

  // ── action alerts: owner / buyer pairs ───────────────────────────────────
  T('owner_call', {
    audience: 'owner', source: 'send-message', label: 'Owner: buyer is calling', when: 'A buyer taps Call on the owner\'s property',
    body: 'A buyer is calling you about your property PPC ID {{1}} in {{2}}. Caller number: {{3}}. Please be ready to discuss the property.',
    example: ['1234', 'Lawspet', '9876543210'],
  }),
  T('user_call', {
    audience: 'user', source: 'send-message', label: 'Buyer: you are calling', when: 'The buyer tapped Call', defaultOn: false,
    body: 'You are calling the owner of property PPC ID {{1}} in {{2}}. Please tell the owner you found it on Pondy Properties.',
    example: ['1234', 'Lawspet'],
  }),
  T('owner_interest', {
    audience: 'owner', source: 'send-message', label: 'Owner: buyer interested', when: 'A buyer sends interest',
    body: 'A buyer is interested in your property PPC ID {{1}} in {{2}}. Buyer number: {{3}}. Please contact them at your convenience.',
    example: ['1234', 'Lawspet', '9876543210'],
  }),
  T('user_interest', {
    audience: 'user', source: 'send-message', label: 'Buyer: interest sent', when: 'The buyer sent interest',
    body: 'Your interest in property PPC ID {{1}} in {{2}} has been sent to the owner. The owner may contact you soon.',
    example: ['1234', 'Lawspet'],
  }),
  T('owner_address_request', {
    audience: 'owner', source: 'send-message', label: 'Owner: address requested', when: 'A buyer asks for the full address',
    body: 'A buyer has asked for the full address of your property PPC ID {{1}} in {{2}}. Buyer number: {{3}}. Please share it from the Pondy Properties app.',
    example: ['1234', 'Lawspet', '9876543210'],
  }),
  T('user_address_request', {
    audience: 'user', source: 'send-message', label: 'Buyer: address requested', when: 'The buyer asked for the address',
    body: 'Your request for the address of property PPC ID {{1}} in {{2}} has been sent to the owner. We will inform you when it is shared.',
    example: ['1234', 'Lawspet'],
  }),
  T('owner_contact_viewed', {
    audience: 'owner', source: 'send-message', label: 'Owner: contact viewed', when: 'A buyer unlocked the owner\'s contact',
    body: 'A buyer has viewed your contact details for property PPC ID {{1}}. Buyer number: {{2}}. They may call you soon about the property.',
    example: ['1234', '9876543210'],
  }),
  T('user_contact_viewed', {
    audience: 'user', source: 'send-message', label: 'Buyer: contact unlocked', when: 'The buyer unlocked the owner contact (paid)',
    body: 'You have unlocked the owner contact for property PPC ID {{1}}. Owner: {{2}}, phone {{3}}. You can now contact the owner directly.',
    example: ['1234', 'Ravi', '9876543210'],
  }),
  T('owner_photo_request', {
    audience: 'owner', source: 'send-message', label: 'Owner: photos requested', when: 'A buyer asks for photos',
    body: 'A buyer has requested photos of your property {{1}}. Buyer number: {{2}}. Please upload photos in the Pondy Properties app.',
    example: ['PPC ID 1234', '9876543210'],
  }),
  T('user_photo_request', {
    audience: 'user', source: 'send-message', label: 'Buyer: photos requested', when: 'The buyer asked for photos',
    body: 'Your photo request for property PPC ID {{1}} in {{2}} has been sent to the owner. We will let you know when photos are added.',
    example: ['1234', 'Lawspet'],
  }),
  T('owner_favorite', {
    audience: 'owner', source: 'send-message', label: 'Owner: saved as favourite', when: 'A buyer saves the property',
    body: 'A buyer has saved your property {{1}} as a favourite. Buyer number: {{2}}. You can contact them at your convenience.',
    example: ['PPC ID 1234', '9876543210'],
  }),
  T('user_favorite', {
    audience: 'user', source: 'send-message', label: 'Buyer: favourite saved', when: 'The buyer saved a property', defaultOn: false,
    body: 'Property PPC ID {{1}} in {{2}} has been added to your favourites on Pondy Properties. We have informed the owner.',
    example: ['1234', 'Lawspet'],
  }),
  T('owner_offer', {
    audience: 'owner', source: 'send-message', label: 'Owner: offer received', when: 'A buyer makes a price offer',
    body: 'A buyer has offered Rs {{1}} for your property PPC ID {{2}} in {{3}}. Buyer number: {{4}}. Please review the offer and respond.',
    example: ['45,00,000', '1234', 'Lawspet', '9876543210'],
  }),
  T('user_offer', {
    audience: 'user', source: 'send-message', label: 'Buyer: offer sent', when: 'The buyer made an offer',
    body: 'Your offer of Rs {{1}} for property PPC ID {{2}} in {{3}} has been sent to the owner. The owner will review it shortly.',
    example: ['45,00,000', '1234', 'Lawspet'],
  }),
  T('owner_shared', {
    audience: 'owner', source: 'send-message', label: 'Owner: property shared', when: 'A visitor shares the property', defaultOn: false,
    body: 'Your property PPC ID {{1}} in {{2}} was shared by a visitor ({{3}}). More shares bring more interested buyers.',
    example: ['1234', 'Lawspet', '9876543210'],
  }),
  T('user_shared', {
    audience: 'user', source: 'send-message', label: 'Buyer: you shared', when: 'The visitor shared a property', defaultOn: false,
    body: 'You shared property PPC ID {{1}} in {{2}}. Thank you for sharing it with people who may be interested.',
    example: ['1234', 'Lawspet'],
  }),
  T('owner_viewed', {
    audience: 'owner', source: 'send-message', label: 'Owner: property viewed', when: 'A visitor opens the property', defaultOn: false,
    body: 'Your property PPC ID {{1}} in {{2}} was viewed by {{3}} on Pondy Properties.',
    example: ['1234', 'Lawspet', '9876543210'],
  }),
  T('user_viewed', {
    audience: 'user', source: 'send-message', label: 'Buyer: you viewed', when: 'The visitor opened a property', defaultOn: false,
    body: 'You viewed property PPC ID {{1}} in {{2}} on Pondy Properties. We have informed the owner.',
    example: ['1234', 'Lawspet'],
  }),
];

const BY_KEY = Object.fromEntries(TEMPLATES.map((t) => [t.key, t]));

/** Meta's component array for /api/create-template-for-approval. */
function components(t) {
  return [
    { type: 'BODY', text: t.body, example: { body_text: [t.example] } },
    { type: 'FOOTER', text: t.footer },
    { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Open Pondy Properties', url: SITE }] },
  ];
}

/** Same checks Meta makes, so a mistake is caught here and not as a 400. */
function problems(t) {
  const out = [];
  if (!/^[a-z0-9_]{1,512}$/.test(t.name)) out.push('name: lowercase, digits and _ only');
  const vars = (t.body.match(/\{\{(\d+)\}\}/g) || []).map((v) => Number(v.replace(/\D/g, '')));
  vars.forEach((n, i) => { if (n !== i + 1) out.push('variables must be {{1}}, {{2}}... in order'); });
  if (vars.length !== t.example.length) out.push(`${vars.length} variable(s) but ${t.example.length} example(s)`);
  if (/^\s*\{\{/.test(t.body) || /\{\{\d+\}\}\W*$/.test(t.body)) out.push('a variable cannot start or end the body');
  if (t.body.length > 1024) out.push('body over 1024 characters');
  if (t.footer && t.footer.length > 60) out.push('footer over 60 characters');
  return [...new Set(out)];
}

module.exports = { TEMPLATES, BY_KEY, components, problems, SITE };

if (require.main === module) {
  let bad = 0;
  for (const t of TEMPLATES) {
    const p = t.category === 'AUTHENTICATION' ? [] : problems(t);
    if (p.length) { bad += 1; console.log(t.name, p.join('; ')); }
  }
  console.log(bad ? `${bad} template(s) with problems` : `all ${TEMPLATES.length} templates pass Meta's rules`);
}
