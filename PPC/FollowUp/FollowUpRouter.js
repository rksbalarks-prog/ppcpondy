const express = require('express');
const router = express.Router();
const FollowUp = require('../FollowUp/FollowUpModel'); // Import your model
const moment = require('moment'); // If you're using moment for easier date handling
const AddModel = require('../AddModel');
const mongoose = require('mongoose');



const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// PUT: Update follow-up entry
router.put('/followup-update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const { followupStatus, followupType, followupDate, adminName, remarks } = req.body;
    const updated = await FollowUp.findByIdAndUpdate(
      id,
      { followupStatus, followupType, followupDate, adminName, remarks },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Follow-up update error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT: Transfer FollowUp admin
router.put('/transfer-admin', async (req, res) => {
  try {
    const { followupId, fromAdmin, toAdmin } = req.body;

    if (!followupId || !fromAdmin || !toAdmin) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!isValidObjectId(followupId)) {
      return res.status(400).json({ success: false, message: 'Invalid followupId format' });
    }

    const followup = await FollowUp.findById(followupId);

    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    // Update admin and push transfer history
    followup.adminName = toAdmin;
    followup.transferHistory.push({
      from: fromAdmin,
      to: toAdmin,
      date: new Date()
    });

    await followup.save();

    res.status(200).json({ success: true, message: 'Follow-up transferred successfully', data: followup });
  } catch (error) {
    console.error("Transfer FollowUp Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});


router.post('/followup-create', async (req, res) => {
  try {
    const {
      ppcId,
      phoneNumber,
      followupStatus,
      followupType,
      followupDate,
      adminName,
      remarks
    } = req.body;

    const newFollowUp = new FollowUp({
      ppcId,
      phoneNumber,
      followupStatus,
      followupType,
      followupDate,
      adminName,
      remarks
    });

    await newFollowUp.save();
    res.status(201).json({ success: true, data: newFollowUp });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



router.get('/followup-list-today-past', async (req, res) => {
  try {
    const { ppcId, phoneNumber, dateFilter } = req.query;
    let filter = {};

    if (ppcId) filter.ppcId = ppcId;
    if (phoneNumber) filter.phoneNumber = phoneNumber;

    // Handle date-based filtering using followupDate
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (dateFilter === 'today') {
      filter.followupDate = { $gte: todayStart, $lte: todayEnd };
    }

    if (dateFilter === 'past') {
      filter.followupDate = { $lt: todayStart };
    }

    const followups = await FollowUp.find(filter).sort({ followupDate: -1 });
    res.status(200).json({ success: true, data: followups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



router.get('/followup-list', async (req, res) => {
  try {
    const { ppcId, phoneNumber } = req.query;
    let filter = {};

    if (ppcId) filter.ppcId = ppcId;
    if (phoneNumber) filter.phoneNumber = phoneNumber;

    const followups = await FollowUp.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: followups });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// Get all followups and related AddModel data
router.get('/followups', async (req, res) => {
  try {
    // 1. Fetch all followups
    const followups = await FollowUp.find();

    // 2. Extract all ppcIds as strings
    const ppcIds = followups.map(fu => fu.ppcId).filter(id => id != null);

    // 3. Convert ppcIds to numbers safely (only keep valid numbers)
    const validPpcIds = ppcIds
      .map(id => Number(id))
      .filter(num => !isNaN(num));

    // 4. Query AddModel for those ppcIds if any valid ids exist
    let properties = [];
    if (validPpcIds.length > 0) {
      properties = await AddModel.find({ ppcId: { $in: validPpcIds } });
    }

    // 5. Return data
    res.json({ success: true, followups, properties });
  } catch (err) {
    console.error('Error fetching followups:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// POST: Bulk create follow-ups — ONE per property for a set of ppcIds.  [ADDITIVE]
// Used by the "Bulk Followup" button on the PreApproved/Pending pages to apply
// the same follow-up details to every (bulk-uploaded) property currently shown.
// Skips any ppcId that already has a follow-up (one follow-up per property).
router.post('/followup-bulk-create', async (req, res) => {
  try {
    const { resolveCreateBase } = require('../utils/baseFilter');
    const { items, followupStatus, followupType, followupDate, adminName, remarks } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No properties supplied for bulk follow-up.' });
    }
    if (items.length > 5000) {
      return res.status(400).json({ success: false, message: 'Too many properties in one bulk follow-up (max 5000).' });
    }
    if (!followupStatus || !followupType || !followupDate) {
      return res.status(400).json({ success: false, message: 'followupStatus, followupType and followupDate are required.' });
    }

    // De-dupe ppcIds -> phone. FollowUp.ppcId is a String, so normalise to strings.
    const phoneByPpcId = new Map();
    for (const it of items) {
      const idRaw = it && it.ppcId;
      if (idRaw === undefined || idRaw === null || String(idRaw).trim() === '') continue;
      const id = String(idRaw).trim();
      if (!phoneByPpcId.has(id)) phoneByPpcId.set(id, it.phoneNumber ? String(it.phoneNumber) : '');
    }
    const ppcIds = [...phoneByPpcId.keys()];
    if (ppcIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid ppcIds supplied.' });
    }

    // One follow-up per property: skip ppcIds that already have one. Raw
    // collection so the city-scope plugin can't narrow the check.
    const existingDocs = await FollowUp.collection.find({ ppcId: { $in: ppcIds } }).toArray();
    const existingSet = new Set(existingDocs.map(d => String(d.ppcId)));

    const base = resolveCreateBase(req.query.base || req.body.base);
    const fuDate = new Date(followupDate);

    const docs = [];
    const skippedPpcIds = [];
    for (const id of ppcIds) {
      if (existingSet.has(id)) { skippedPpcIds.push(id); continue; }
      docs.push({
        ppcId: id,
        phoneNumber: phoneByPpcId.get(id),
        followupStatus,
        followupType,
        followupDate: fuDate,
        adminName,
        remarks,
        base,
      });
    }

    let createdCount = 0;
    if (docs.length) {
      const inserted = await FollowUp.insertMany(docs, { ordered: false });
      createdCount = inserted.length;
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdCount} follow-up(s); skipped ${skippedPpcIds.length} that already had one.`,
      createdCount,
      skippedCount: skippedPpcIds.length,
      totalRequested: ppcIds.length,
      skippedPpcIds,
    });
  } catch (err) {
    console.error('Bulk Create FollowUp Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during bulk follow-up creation.' });
  }
});


module.exports = router;