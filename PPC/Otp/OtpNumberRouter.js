const express = require('express');
const router = express.Router();
const OtpNumber = require('./OtpNumberModel');
const officeMobileMap = require('../utils/officeMobileMap');

const VALID_OFFICES = ['ADMIN', 'ARV 1', 'ARV 2', 'ARV 3'];
const isTenDigits = (v) => /^[0-9]{10}$/.test(v || '');

// GET all OTP numbers, optionally filtered by ?officeName=ADMIN.
// The first time an office is opened with no rows yet, seed it from the legacy
// static officeMobileMap so the panel opens pre-filled with the current numbers
// (one-time migration — after that the DB is the source of truth).
router.get('/otp-numbers', async (req, res) => {
  try {
    const { officeName } = req.query;

    if (officeName && VALID_OFFICES.includes(officeName)) {
      const count = await OtpNumber.countDocuments({ officeName });
      if (count === 0 && Array.isArray(officeMobileMap[officeName]) && officeMobileMap[officeName].length) {
        const seed = officeMobileMap[officeName].map((mobile) => ({
          officeName,
          mobile,
          label: '',
          active: true,
        }));
        await OtpNumber.insertMany(seed);
      }
    }

    const filter = officeName ? { officeName } : {};
    const numbers = await OtpNumber.find(filter).sort({ officeName: 1, createdDate: 1 });
    res.json(numbers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new OTP recipient.
router.post('/otp-number-create', async (req, res) => {
  try {
    const { officeName = 'ADMIN', mobile, label = '', active = true } = req.body;

    if (!VALID_OFFICES.includes(officeName)) {
      return res.status(400).json({ message: 'Invalid office name' });
    }
    if (!(label || '').trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!isTenDigits(mobile)) {
      return res.status(400).json({ message: 'Mobile must be exactly 10 digits' });
    }
    const exists = await OtpNumber.findOne({ officeName, mobile });
    if (exists) {
      return res.status(409).json({ message: 'This number already exists for this office' });
    }

    const created = await OtpNumber.create({ officeName, mobile, label: label.trim(), active });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an OTP recipient (mobile / label / active / office).
router.put('/otp-number-update/:id', async (req, res) => {
  try {
    const { mobile, label, active, officeName } = req.body;
    const doc = await OtpNumber.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'OTP number not found' });

    if (officeName !== undefined) {
      if (!VALID_OFFICES.includes(officeName)) {
        return res.status(400).json({ message: 'Invalid office name' });
      }
      doc.officeName = officeName;
    }
    if (mobile !== undefined) {
      if (!isTenDigits(mobile)) {
        return res.status(400).json({ message: 'Mobile must be exactly 10 digits' });
      }
      const dup = await OtpNumber.findOne({
        officeName: doc.officeName,
        mobile,
        _id: { $ne: doc._id },
      });
      if (dup) return res.status(409).json({ message: 'This number already exists for this office' });
      doc.mobile = mobile;
    }
    if (label !== undefined) {
      if (!label.trim()) {
        return res.status(400).json({ message: 'Name is required' });
      }
      doc.label = label.trim();
    }
    if (active !== undefined) doc.active = active;

    const updated = await doc.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an OTP recipient.
router.delete('/otp-number-delete/:id', async (req, res) => {
  try {
    const deleted = await OtpNumber.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'OTP number not found' });
    res.json({ message: 'OTP number deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
