// Rent Pondy's Tamil + English UTILITY template set (LTS Consultancy account).
//   node SmartGrowth/tools/templateSet.ta_en.js [--submit]     (from PPC/)
// Same messages as the English set, each written Tamil first and English
// below, every value shown once under a two-language label (Meta does not
// allow a {{n}} twice). Language 'ta'. Refuses any account but LTS Consultancy.
const path = require('path');
const ppc = path.join(__dirname, '..', '..');
const SUBMIT = process.argv.includes('--submit');
process.chdir(ppc);
require(path.join(ppc, 'node_modules', 'dotenv')).config({ path: path.join(ppc, '.env') });
const mongoose = require(path.join(ppc, 'node_modules', 'mongoose'));

const LANGUAGE = 'ta';
const FOOTER = 'Rent Pondy - புதுச்சேரி, சென்னை வாடகை வீடுகள்';
const BUTTON = [{ type: 'URL', text: 'Open Rent Pondy', url: 'https://rentpondy.com' }];

const SET = [
  // ── Action messages ──
  { use: 'action:property_added', name: 'rp_listing_received_ta_en', header: 'பட்டியல் பெறப்பட்டது | Listing received',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்து பட்டியல் பெறப்பட்டது.\nHello, we have received your property listing on Rent Pondy.\n\nRent ID: {{2}}\nபகுதி / Area: {{3}}\nசமர்ப்பித்த தேதி / Submitted on: {{4}}\n\nஎங்கள் குழு சரிபார்த்து, அங்கீகரிக்கப்பட்டதும் இங்கே உங்களுக்குச் செய்தி அனுப்பும்.\nOur team will review it and message you here once it is approved.',
    ex: ['Ravi', '1234', 'Lawspet', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'area', 4: 'when_date' } },
  { use: 'action:property_approved', name: 'rp_listing_approved_ta_en', header: 'பட்டியல் அங்கீகரிக்கப்பட்டது | Listing approved',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்து பட்டியல் அங்கீகரிக்கப்பட்டு, இப்போது வாடகைதாரர்களுக்குத் தெரிகிறது.\nHello, your property listing on Rent Pondy has been approved and is now visible to tenants.\n\nRent ID: {{2}}\nஅங்கீகரித்த தேதி / Approved on: {{3}}\n\nஒரு வாடகைதாரர் ஆர்வம் காட்டும்போது இங்கே உங்களுக்குச் செய்தி வரும்.\nYou will get a message here when a tenant shows interest.',
    ex: ['Ravi', '1234', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'when_date' } },
  { use: 'action:interest', name: 'rp_tenant_interest_ta_en', header: 'வாடகைதாரர் ஆர்வம் | Tenant interest',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்தில் ஒரு வாடகைதாரர் ஆர்வம் காட்டியுள்ளார்.\nHello, a tenant has shown interest in your property on Rent Pondy.\n\nRent ID: {{2}}\nவாடகைதாரர் எண் / Tenant number: {{3}}\nதேதி / Date: {{4}}\n\nவிவரங்களைப் பார்த்து பதிலளிக்க Rent Pondy-இல் உள்நுழையவும்.\nPlease log in to Rent Pondy to see the details and respond.',
    ex: ['Ravi', '1234', '98XXXXXX21', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'by_masked', 4: 'when_date' } },
  { use: 'action:contact_view', name: 'rp_contact_viewed_ta_en', header: 'தொடர்பு விவரம் பார்க்கப்பட்டது | Contact viewed',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்தின் தொடர்பு விவரத்தை ஒரு வாடகைதாரர் பார்த்துள்ளார்.\nHello, a tenant has viewed the contact details of your property on Rent Pondy.\n\nRent ID: {{2}}\nவாடகைதாரர் எண் / Tenant number: {{3}}\nதேதி / Date: {{4}}\n\nஇந்தச் சொத்து பற்றி அவர் உங்களை அழைக்கலாம்.\nThe tenant may call you about this property.',
    ex: ['Ravi', '1234', '98XXXXXX21', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'by_masked', 4: 'when_date' } },
  { use: 'action:shortlist', name: 'rp_listing_shortlisted_ta_en', header: 'விருப்பப் பட்டியலில் சேர்ப்பு | Shortlisted',
    body: 'வணக்கம் {{1}},\nஒரு வாடகைதாரர் Rent Pondy-இல் உங்கள் சொத்தைத் தனது விருப்பப் பட்டியலில் சேர்த்துள்ளார்.\nHello, a tenant has added your property to their shortlist on Rent Pondy.\n\nRent ID: {{2}}\nதேதி / Date: {{3}}\n\nவாடகைதாரருக்குச் சரியான தகவல் கிடைக்க, பட்டியல் விவரங்களைப் புதுப்பித்து வைக்கவும்.\nPlease keep the listing details up to date so the tenant has the correct information.',
    ex: ['Ravi', '1234', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'when_date' } },
  { use: 'action:photo_request', name: 'rp_photo_request_ta_en', header: 'புகைப்படக் கோரிக்கை | Photo request',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்தின் புகைப்படங்களை ஒரு வாடகைதாரர் கேட்டுள்ளார்.\nHello, a tenant has requested photos of your property on Rent Pondy.\n\nRent ID: {{2}}\nகோரிய தேதி / Requested on: {{3}}\n\nஇந்தப் பட்டியலில் புகைப்படங்களைச் சேர்க்க Rent Pondy-இல் உள்நுழையவும்.\nPlease log in to Rent Pondy to add photos to this listing.',
    ex: ['Ravi', '1234', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'when_date' } },
  { use: 'action:address_request', name: 'rp_address_request_ta_en', header: 'முகவரிக் கோரிக்கை | Address request',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்தின் முகவரியை ஒரு வாடகைதாரர் கேட்டுள்ளார்.\nHello, a tenant has requested the address of your property on Rent Pondy.\n\nRent ID: {{2}}\nகோரிய தேதி / Requested on: {{3}}\n\nஇந்தக் கோரிக்கையைப் பார்த்து பதிலளிக்க Rent Pondy-இல் உள்நுழையவும்.\nPlease log in to Rent Pondy to review and respond to this request.',
    ex: ['Ravi', '1234', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'when_date' } },
  { use: 'action:offer', name: 'rp_rent_proposal_ta_en', header: 'வாடகைத் தொகை முன்மொழிவு | Rent proposal',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்துக்கு ஒரு வாடகைதாரர் வாடகைத் தொகையை முன்மொழிந்துள்ளார்.\nHello, a tenant has proposed a rent amount for your property on Rent Pondy.\n\nRent ID: {{2}}\nமுன்மொழிந்த வாடகை / Proposed rent: Rs. {{3}}\nதேதி / Date: {{4}}\n\nஏற்க அல்லது நிராகரிக்க Rent Pondy-இல் உள்நுழையவும்.\nPlease log in to Rent Pondy to accept or decline the proposal.',
    ex: ['Ravi', '1234', '15000', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'price', 4: 'when_date' } },
  { use: 'action:report_notice', name: 'rp_listing_reported_ta_en', header: 'பட்டியல் மறுஆய்வில் | Under review',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்து பட்டியல் குறித்து ஒரு புகார் வந்துள்ளது; எங்கள் குழு அதைச் சரிபார்க்கும்.\nHello, we have received a report about your property listing on Rent Pondy, and our team will review it.\n\nRent ID: {{2}}\nதேதி / Date: {{3}}\n\nசொத்து இப்போது கிடைக்கவில்லை என்றால், உங்கள் கணக்கில் வாடகைக்கு விடப்பட்டது எனக் குறிக்கவும்.\nIf the property is no longer available, please mark it as rented out in your account.',
    ex: ['Ravi', '1234', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'when_date' } },
  { use: 'action:property_expired', name: 'rp_listing_expired_ta_en', header: 'பட்டியல் காலாவதியானது | Listing expired',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்து பட்டியல் காலாவதியாகிவிட்டது; இனி வாடகைதாரர்களுக்குக் காட்டப்படாது.\nHello, your property listing on Rent Pondy has expired and is no longer shown to tenants.\n\nRent ID: {{2}}\nகாலாவதியான தேதி / Expired on: {{3}}\n\nசொத்து இன்னும் கிடைக்கிறது என்றால், உங்கள் கணக்கிலிருந்து பட்டியலைப் புதுப்பிக்கலாம்.\nIf the property is still available, you can renew the listing from your account.',
    ex: ['Ravi', '1234', '21-10-2026'], map: { 1: 'to_name', 2: 'rent_id', 3: 'when_date' } },
  { use: 'action:tenant_added', name: 'rp_requirement_received_ta_en', header: 'தேவை பெறப்பட்டது | Requirement received',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் வாடகை வீட்டுத் தேவை பெறப்பட்டது.\nHello, we have received your rental requirement on Rent Pondy.\n\nகுறிப்பு எண் / Reference: {{2}}\nவிரும்பும் பகுதி / Preferred area: {{3}}\nதேதி / Date: {{4}}\n\nஉங்கள் தேவைக்குப் பொருந்தும் சொத்துகள் பட்டியலிடப்படும்போது இங்கே உங்களுக்குச் செய்தி அனுப்புவோம்.\nYou will get a message here when properties matching your requirement are listed.',
    ex: ['Priya', 'RA 56', 'Lawspet', '21-10-2026'], map: { 1: 'to_name', 2: 'ref', 3: 'area', 4: 'when_date' } },

  // ── Reminders ──
  { use: 'reminder:post_property', name: 'rp_account_summary_ta_en', header: 'கணக்கு சுருக்கம் | Account summary',
    body: 'வணக்கம் {{1}},\nஉங்கள் Rent Pondy கணக்கின் சுருக்கம் இதோ.\nHello, here is a summary of your Rent Pondy account.\n\nபதிவு செய்த எண் / Registered number: {{2}}\nசொத்து பட்டியல்கள் / Property listings: இல்லை / none\nவாடகைத் தேவைகள் / Rental requirements: இல்லை / none\n\nRent Pondy-இல் உள்நுழைந்த பின் உங்கள் கணக்கு விவரங்களைப் பார்க்கலாம்.\nYour account details can be viewed after you log in to Rent Pondy.',
    ex: ['Ravi', '919876543210'], map: { 1: 'first_name', 2: 'mobile' } },
  { use: 'reminder:add_photos', name: 'rp_reminder_add_photos_ta_en', header: 'பட்டியல் நினைவூட்டல் | Listing reminder',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்து பட்டியலில் இன்னும் புகைப்படங்கள் இல்லை என்பதை நினைவூட்டுகிறோம்.\nHello, this is a reminder that your property listing on Rent Pondy has no photos yet.\n\nRent ID: {{2}}\n\nவாடகைதாரர்கள் அழைப்பதற்கு முன் பெரும்பாலும் புகைப்படங்களைக் கேட்பார்கள்; உங்கள் கணக்கிலிருந்து அவற்றைச் சேர்க்கவும்.\nTenants often ask for photos before they call, so please add them from your account.',
    ex: ['Ravi', '1234'], map: { 1: 'first_name', 2: 'rent_id' } },
  { use: 'reminder:complete_listing', name: 'rp_reminder_complete_listing_ta_en', header: 'பட்டியல் முழுமையாகவில்லை | Listing incomplete',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்து பட்டியல் இன்னும் முழுமையாகவில்லை; அதனால் வாடகைதாரர்களுக்குக் காட்ட முடியவில்லை.\nHello, this is a reminder that your property listing on Rent Pondy is not complete, so it cannot be shown to tenants yet.\n\nRent ID: {{2}}\n\nஉங்கள் கணக்கில் உள்நுழைந்து மீதமுள்ள விவரங்களை நிரப்பவும்.\nPlease log in to your account and fill in the remaining details.',
    ex: ['Ravi', '1234'], map: { 1: 'first_name', 2: 'rent_id' } },
  { use: 'reminder:renew_listing', name: 'rp_reminder_renew_listing_ta_en', header: 'காலாவதியான பட்டியல் | Expired listing',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உங்கள் சொத்து பட்டியல் இன்னும் காலாவதி நிலையில் உள்ளது; வாடகைதாரர்கள் அதைப் பார்க்க முடியாது.\nHello, this is a reminder that your property listing on Rent Pondy is still expired and tenants cannot see it.\n\nRent ID: {{2}}\n\nசொத்து வாடகைக்குக் கிடைக்கிறது என்றால், உங்கள் கணக்கிலிருந்து பட்டியலைப் புதுப்பிக்கவும். ஏற்கனவே வாடகைக்கு விடப்பட்டிருந்தால், எதுவும் செய்ய வேண்டாம்.\nIf the property is available for rent, please renew the listing from your account. If it is rented out, no action is needed.',
    ex: ['Ravi', '1234'], map: { 1: 'first_name', 2: 'rent_id' } },

  // ── Account-based updates for Autobot runs ──
  { use: 'run:owners_active', name: 'rp_listing_status_update_ta_en', header: 'பட்டியல் நிலை | Listing status',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் உள்ள உங்கள் சொத்து பட்டியலின் நிலை குறித்த புதுப்பிப்பு இது.\nHello, this is a status update on your property listing on Rent Pondy.\n\nRent ID: {{2}}\nநிலை / Status: செயலில் உள்ளது, வாடகைதாரர்களுக்குத் தெரிகிறது / Active and visible to tenants\n\nசொத்து வாடகைக்கு விடப்பட்டிருந்தால், வாடகைதாரர்கள் உங்களைத் தொடர்பு கொள்ளாமல் இருக்க உங்கள் கணக்கில் அதைக் குறிக்கவும்.\nIf the property has been rented out, please mark it as rented in your account so tenants do not contact you for it.',
    ex: ['Ravi', '1234'], map: { 1: 'first_name', 2: 'rent_id' } },
  { use: 'run:tenants', name: 'rp_requirement_update_ta_en', header: 'தேவை புதுப்பிப்பு | Requirement update',
    body: 'வணக்கம் {{1}},\nRent Pondy-இல் நீங்கள் பதிவு செய்த வாடகைத் தேவை குறித்த புதுப்பிப்பு இது.\nHello, this is an update on the rental requirement you posted on Rent Pondy.\n\nபகுதி / Area: {{2}}\n\nநீங்கள் பதிவு செய்த பிறகு புதிய சொத்துகள் பட்டியலிடப்பட்டுள்ளன; உங்கள் கணக்கிலிருந்து அவற்றைப் பார்த்து உரிமையாளர்களைத் தொடர்பு கொள்ளலாம்.\nNew properties have been listed since you posted it. You can see them and contact the owners from your account.\n\nஏற்கனவே வீடு கிடைத்துவிட்டால், உங்கள் கணக்கில் தேவையை மூடலாம்.\nIf you have already found a house, you can close the requirement in your account.',
    ex: ['Priya', 'Lawspet'], map: { 1: 'first_name', 2: 'area' } },
];

const build = (tpl, t) => tpl.buildComponents({ headerType: 'TEXT', headerText: t.header, body: t.body, bodyExamples: t.ex, footer: FOOTER, buttons: BUTTON });

(async () => {
  const tpl = require(path.join(ppc, 'SmartGrowth', 'templates'));
  let bad = 0;
  if (FOOTER.length > 60) { console.log('FAIL footer is', FOOTER.length, 'chars'); bad++; }
  for (const t of SET) {
    try {
      build(tpl, t);
      const vars = tpl.templateVars(t.body);
      if (vars.length !== Object.keys(t.map).length) throw new Error('map has ' + Object.keys(t.map).length + ' entries for ' + vars.length + ' blanks');
      if (!/^[a-z0-9_]+$/.test(t.name)) throw new Error('bad name');
      if (/\n\n\n/.test(t.body)) throw new Error('three newlines in a row');
      console.log('ok   ', t.name.padEnd(36), vars.length + ' vars', String(t.body.length).padStart(4) + ' chars', 'header ' + t.header.length, ' ->', t.use);
    } catch (e) { bad++; console.log('FAIL ', t.name, e.message); }
  }
  if (bad) { console.log(bad + ' failed validation — nothing submitted.'); process.exit(1); }
  if (!SUBMIT) { console.log('\nAll ' + SET.length + ' valid (footer ' + FOOTER.length + ' chars). Run with --submit to send them to Meta.'); process.exit(0); }

  await mongoose.connect('mongodb://localhost:27017/sg_tpl_set_ta');
  const sg = require(path.join(ppc, 'SmartGrowth', 'client'));
  const s = await sg.settings(true);
  const who = JSON.parse(Buffer.from(String(s.apiToken).split('.')[1] || '', 'base64url').toString() || '{}');
  if (who.customerId !== 'LTS Consultancy') throw new Error('Not the LTS Consultancy token — refusing.');
  const have = new Set(((await tpl.fetchTemplates(true)).templates || []).map((t) => t.name));
  for (const t of SET) {
    if (have.has(t.name)) { console.log('skip ', t.name, '(already on the account)'); continue; }
    const r = await sg.request('POST', '/api/create-template-for-approval', { name: t.name, category: 'UTILITY', language: LANGUAGE, components: build(tpl, t), approveForAll: false }, 90);
    const res = r.data && Array.isArray(r.data.results) ? r.data.results[0] : null;
    console.log(r.code === 200 ? 'sent ' : 'ERR  ', t.name.padEnd(36), 'HTTP ' + r.code, res ? res.reviewStatus + ' id ' + res.templateId : sg.message(r.data, r.code));
    await new Promise((x) => setTimeout(x, 1500));
  }
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
})().catch(async (e) => { console.error('STOPPED:', e.message); try { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); } catch (_) {} process.exit(1); });
