const express = require('express');
const router = express.Router();
const NotInterestedFollowUp = require('../FollowUp/NotInterestedFollowUpModel'); // Import your model
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// PUT: Update not-interested follow-up entry
router.put('/notinterested-followup-update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const { followupStatus, followupType, followupDate, adminName, remarks } = req.body;
    const updated = await NotInterestedFollowUp.findByIdAndUpdate(
      id,
      { followupStatus, followupType, followupDate, adminName, remarks },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Not Interested follow-up update error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT: Transfer not-interested follow-up admin
router.put('/transfer-admin-notinterested', async (req, res) => {
  try {
    const { followupId, fromAdmin, toAdmin } = req.body;

    if (!followupId || !fromAdmin || !toAdmin) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!isValidObjectId(followupId)) {
      return res.status(400).json({ success: false, message: 'Invalid followupId format' });
    }

    const followup = await NotInterestedFollowUp.findById(followupId);
    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    followup.adminName = toAdmin;
    followup.transferHistory.push({ from: fromAdmin, to: toAdmin, date: new Date() });
    await followup.save();

    res.status(200).json({ success: true, message: 'Follow-up transferred successfully', data: followup });
  } catch (error) {
    console.error('Transfer NotInterested FollowUp Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// POST: Create not-interested follow-up entry
router.post('/notinterested-followup-create', async (req, res) => {
  try {
    const { phoneNumber, followupStatus, followupType, followupDate, adminName, remarks } = req.body;

    if (!phoneNumber || !followupStatus || !followupType || !followupDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newFollowUp = new NotInterestedFollowUp({
      phoneNumber,
      followupStatus,
      followupType,
      followupDate: new Date(followupDate),
      adminName,
      remarks
    });

    await newFollowUp.save();
    res.status(201).json({ success: true, data: newFollowUp });
  } catch (err) {
    console.error('Not Interested follow-up creation error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET: Not-interested follow-ups filtered by today / past
router.get('/notinterested-followup-list-today-past', async (req, res) => {
  try {
    const { phoneNumber, dateFilter } = req.query;
    let filter = {};
    if (phoneNumber) filter.phoneNumber = phoneNumber;

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

    const followups = await NotInterestedFollowUp.find(filter).sort({ followupDate: -1 });
    res.status(200).json({ success: true, data: followups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET: All not-interested follow-ups (optionally filtered by phone)
router.get('/notinterested-followup-list', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    let filter = {};
    if (phoneNumber) filter.phoneNumber = phoneNumber;

    const followups = await NotInterestedFollowUp.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: followups });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
