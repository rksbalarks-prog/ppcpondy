// End-to-end check against a throwaway LOCAL database filled with made-up rows.
//   node --test AutoExpire/test/autoExpire.test.js
// Never point this at a real database: it drops the one it uses.

const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

const DB = process.env.AUTO_EXPIRE_TEST_URI || 'mongodb://127.0.0.1:27017/autoexpire_ppc_synth';
const { decide, DAY } = require('../engine');

const now = new Date();
const ago = (days) => new Date(now.getTime() - days * DAY);
const ymd = (d) => d.toISOString().slice(0, 10);

test('engine: clock, protection, bad dates', () => {
  const base = { days: 180, clock: [], protect: [] };
  assert.equal(decide({ ...base, createdAt: ago(200) }, now.getTime()).state, 'due');
  assert.equal(decide({ ...base, createdAt: ago(150) }, now.getTime()).state, 'fresh');
  // a Date cast to a string ("Mon Oct 05 2026 ...") is not trusted
  assert.equal(decide({ ...base, createdAt: ago(300), clock: [{ at: String(ago(1)) }] }, now.getTime()).state, 'due');
});

test('runner: dry run, live run, restore', async (t) => {
  await mongoose.connect(DB);
  const db = mongoose.connection.db;
  await db.dropDatabase();
  t.after(async () => { await db.dropDatabase(); await mongoose.disconnect(); });

  const config = require('../config');
  const { run } = require('../runner');

  const prop = (ppcId, days, extra = {}) => ({
    ppcId, phoneNumber: `90000000${String(ppcId).padStart(2, '0')}`, status: 'active', isDeleted: false,
    createdAt: ago(days), updatedAt: ago(days), featureStatus: 'no', ...extra,
  });
  await db.collection('addmodels').insertMany([
    prop(1, 200), // general (180), old -> due
    prop(2, 150), // general, fresh
    prop(3, 100, { bulkUploadId: 'BULK-ADEX-1' }), // adex (90), old -> due
    prop(4, 60, { bulkUploadId: 'BULK-ADEX-1' }), // adex, fresh
    prop(5, 300), // free bill 50d ago restarts the clock -> fresh
    prop(6, 300), // paid bill 200d ago, 365d validity -> protected
    prop(7, 300), // paid PayU 200d ago, Gold 365d -> protected
    prop(8, 300, { featureStatus: 'yes' }), // featured -> protected
    prop(9, 300, { phoneNumber: '9111111111' }), // owner paid for #10 recently -> protected
    prop(10, 5, { phoneNumber: '9111111111' }),
    prop(11, 300, { status: 'incomplete' }), // Pending-page row, old -> due
    prop(12, 300, { isDeleted: true }), // soft-deleted, not touched
    prop(13, 300, { status: 'contact' }), // not a live status, not touched
    prop(14, 250, { status: 'complete' }), // PreApproved, old -> due
    prop(15, 100), // adex by importedListingId alone -> due
    prop(16, 190, { bulkUploadId: 'BULK-EXCEL-9' }), // ordinary Excel bulk upload -> general -> due
    prop(17, 300, { status: 'soldOut' }), // not touched
    prop(18, 300), // paid 200d ago under an unknown plan name, but enrolled in Gold -> protected
    prop(19, 100, { bulkUploadId: 'BULK-NOT-IMPORTED' }), // batch of an ad never imported -> general -> fresh
  ]);
  await db.collection('adexpress_ads').insertMany([
    { adKey: 'test-ad-3', status: 'imported', bulkUploadId: 'BULK-ADEX-1', importedListingId: 3 },
    { adKey: 'test-ad-15', status: 'imported', bulkUploadId: '', importedListingId: 15 },
    { adKey: 'test-ad-19', status: 'shortlisted', bulkUploadId: 'BULK-NOT-IMPORTED' },
  ]);
  const bill = (ppId, phone, days, paymentType, net, validity, planName = paymentType) => ({
    ppId: String(ppId), ownerPhone: phone, billDate: ymd(ago(days)), createdAt: ago(days), paymentType, planName,
    netAmount: net, billAmount: net, validity, featuredAmount: 0, featuredValidity: 0,
  });
  await db.collection('bills').insertMany([
    bill(5, '9000000005', 50, 'Free', 0, 180),
    bill(6, '9000000006', 200, 'Cash', 5000, 365, 'Silver'),
    bill(10, '9111111111', 10, 'Online', 5000, 90, 'Silver'),
    bill(1, '9000000001', 400, 'free', 0, 180), // old free bill: clock only, already past
  ]);
  await db.collection('pricingplans').insertMany([{ name: 'Gold', durationDays: 365, phoneNumbers: [{ number: '9000000018', ppcId: 18 }] }]);
  await db.collection('paymentpayus').insertMany([
    { ppcId: 7, phone: '9000000007', planName: 'gold', payustatususer: 'paid', payUdate: String(ago(200)), createdAt: ago(200) },
    { ppcId: 18, phone: '9000000018', planName: 'Renamed Plan', payustatususer: 'paid', createdAt: ago(200) },
    { ppcId: 1, phone: '9000000001', planName: 'Gold', payustatususer: 'pay failed', createdAt: ago(5) }, // not paid: ignored
  ]);

  const ba = (ba_id, days, extra = {}) => ({
    ba_id, phoneNumber: `80000000${String(ba_id).padStart(2, '0')}`, ba_status: 'baActive', isDeleted: false, createdAt: ago(days), ...extra,
  });
  await db.collection('buyerassistances').insertMany([
    ba(1, 200), // due
    ba(2, 30, { ba_status: 'baPending' }), // fresh
    ba(3, 300), // paid 200d ago on a 365-day plan -> protected
    ba(4, 300, { ba_status: 'baExpired' }), // already expired, not scanned
    ba(5, 400), // paid 250d ago on a 30-day plan -> due, payment flips
    ba(6, 250, { ba_status: 'buyer-interest-tried' }), // overwritten by send-interest, still live -> due
    ba(7, 300), // only a direct customer payment on this phone -> not protected -> due
  ]);
  await db.collection('buyerplans').insertMany([{ planName: 'Buyer Gold', planValidity: '365 days' }, { planName: 'Basic', planValidity: '30 days' }]);
  await db.collection('paymentpayubuyers').insertMany([
    { ba_id: 3, phone: '8000000003', planName: 'Buyer Gold', productinfo: 'Subscription Plan', payustatususer: 'paid', createdAt: ago(200) },
    { ba_id: 5, phone: '8000000005', planName: 'Basic', productinfo: 'Subscription Plan', payustatususer: 'paid', createdAt: ago(250) },
    { ba_id: 1791234567890, phone: '8000000007', productinfo: 'Pondy Properties Payment', payustatususer: 'paid', createdAt: ago(10) },
  ]);

  const propDoc = (ppcId) => db.collection('addmodels').findOne({ ppcId });
  const baDoc = (ba_id) => db.collection('buyerassistances').findOne({ ba_id });

  // ── dry run ──
  const dry = await run({ mode: 'dry-run', trigger: 'preview', items: true });
  assert.deepStrictEqual(dry.items.property.map((i) => i.key).sort((a, b) => a - b), ['1', '3', '11', '14', '15', '16']);
  assert.deepStrictEqual(dry.items.assistance.map((i) => i.key).sort(), ['1', '5', '6', '7']);
  assert.equal(dry.summary.property.scanned, 16);
  assert.deepStrictEqual(dry.summary.property.protected, { 'paid-bill': 1, 'paid-online': 2, featured: 1, 'owner-paid-bill': 1 });
  assert.deepStrictEqual(dry.summary.property.dueByRule, { general: 4, adex: 2 });
  assert.deepStrictEqual(dry.summary.assistance.protected, { 'paid-online': 1 });
  assert.equal((await propDoc(1)).status, 'active');

  // ── cap ──
  const savedCap = config.maxPerRun;
  config.maxPerRun = 2;
  const capped = await run({ mode: 'dry-run', trigger: 'cli' });
  assert.equal(capped.summary.property.capped, 4);
  assert.deepStrictEqual(capped.sample.property.map((i) => i.key), ['11', '14']);
  config.maxPerRun = savedCap;

  // ── live ──
  const live = await run({ mode: 'live', trigger: 'manual' });
  assert.equal(live.summary.property.expired, 6);
  assert.equal(live.summary.assistance.expired, 4);
  for (const id of [1, 3, 11, 14, 15, 16]) assert.equal((await propDoc(id)).status, 'expired');
  for (const id of [2, 4, 5, 6, 7, 8, 9, 10, 13, 17, 18, 19]) assert.notEqual((await propDoc(id)).status, 'expired');
  assert.equal((await propDoc(14)).previousStatus, 'complete');
  assert.equal((await propDoc(11)).previousStatus, 'incomplete');
  assert.match((await propDoc(3)).reason, /Adexpress rule/);

  const b1 = await baDoc(1);
  assert.equal(b1.ba_status, 'baExpired');
  assert.equal(b1.baExpiredBy, 'Auto Expire');
  assert.ok(b1.baExpiredAt);
  assert.equal((await db.collection('paymentpayubuyers').findOne({ ba_id: 5 })).payustatususer, 'expiredPlan');
  assert.equal((await db.collection('paymentpayubuyers').findOne({ ba_id: 3 })).payustatususer, 'paid');

  // ── second run is a no-op; restores get a fresh period ──
  const again = await run({ mode: 'live', trigger: 'manual' });
  assert.equal(again.summary.property.expired + again.summary.assistance.expired, 0);

  await db.collection('addmodels').updateOne({ ppcId: 1 }, { $set: { status: 'active' } });
  await db.collection('buyerassistances').updateOne({ ba_id: 1 }, { $set: { ba_status: 'baActive', baExpiredAt: null, baExpiredBy: '' } });
  const after = await run({ mode: 'live', trigger: 'manual' });
  assert.equal(after.summary.property.expired, 0);
  assert.equal(after.summary.assistance.expired, 0);
  assert.equal(await db.collection('auto_expire_log').countDocuments({ restoredSeenAt: { $ne: null } }), 2);
});
