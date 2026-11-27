// Communication > WhatsApp > Limits & Alerts — how many messages one number
// may receive in a day, who was held back, and who asked us to stop.
//
// Two allowances, because they answer different questions: a campaign is
// something we decided to send; an action message tells someone something
// happened on their own listing. Sharing one budget would let a promotion
// crowd out a real notification. Replies are never capped.
//
//   GET  /sg/limits        caps, today's totals, the last held-back messages
//   POST /sg/limits        save the caps
//   GET  /sg/blocks        the numbers that asked us to stop
//   POST /sg/blocks        { phone, block: true|false, note }

const express = require('express');
const { SgSettings, SgSendLog, SgBlock } = require('../models');
const { limit, blocks, health } = require('../guards');
const sg = require('../client');
const U = require('../util');

const router = express.Router();

router.get('/sg/limits', async (req, res) => {
  try {
    const s = (await sg.settingsDoc()).toObject();
    const blocked = await SgSendLog.find({ status: 'blocked' }).sort({ _id: -1 }).limit(25)
      .select('phone kind templateName campaignName detail createdAt createdByName').lean();
    res.json({
      status: 'success',
      settings: { capEnabled: s.capEnabled !== false, capCampaign: s.capCampaign ?? 1, capAction: s.capAction ?? 2 },
      today: await limit.todayByKind(),
      blocked,
      blockCount: await SgBlock.countDocuments({}),
      health: await health.status(),
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/limits', async (req, res) => {
  try {
    const b = req.body || {};
    // Clamped, floor 1: a cap of 0 would mean "no limit", the opposite of
    // what somebody typing 0 into "messages per day" means. The switch is
    // the way to turn limits off.
    await SgSettings.updateOne({ key: 'main' }, {
      $set: {
        capEnabled: !!b.capEnabled,
        capCampaign: U.clampInt(b.capCampaign, 1, 50, 1),
        capAction: U.clampInt(b.capAction, 1, 50, 2),
        updatedBy: U.adminName(req),
      },
    }, { upsert: true });
    sg.invalidate();
    res.json({ status: 'success', message: 'Limits saved.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.get('/sg/blocks', async (req, res) => {
  try {
    const rows = await SgBlock.find({}).sort({ _id: -1 }).limit(500).lean();
    res.json({ status: 'success', rows, total: await SgBlock.countDocuments({}) });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/sg/blocks', async (req, res) => {
  try {
    const b = req.body || {};
    const phone = U.key10(b.phone);
    if (phone.length < 8) return res.json({ status: 'error', message: 'Enter the number to block.' });
    if (b.block === false || b.block === 'false') {
      await blocks.unblock(phone);
      return res.json({ status: 'success', message: phone + ' unblocked.' });
    }
    await blocks.block(phone, 'admin', String(b.note || '').slice(0, 255), U.adminName(req));
    res.json({ status: 'success', message: phone + ' blocked. No campaign, bot or action message will go to it.' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
