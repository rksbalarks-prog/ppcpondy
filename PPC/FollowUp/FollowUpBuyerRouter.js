const express = require("express");
const router = express.Router();
const FollowUpBuyer = require("../FollowUp/FollowUpBuyerModel"); // Import your model
const moment = require("moment"); // If you're using moment for easier date handling
const AddModel = require("../AddModel");
const BuyerAssistance = require("../BuyerAssistance/BuyerAssistanceModel");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// PUT: Update follow-up buyer entry
router.put("/followup-update-buyer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const { followupStatus, followupType, followupDate, adminName, remarks } =
      req.body;
    const updated = await FollowUpBuyer.findByIdAndUpdate(
      id,
      { followupStatus, followupType, followupDate, adminName, remarks },
      { new: true },
    );
    if (!updated)
      return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// PUT: Transfer admin for a follow-up buyer entry
router.put("/transfer-admin-buyer", async (req, res) => {
  try {
    const { followupId, fromAdmin, toAdmin } = req.body;

    if (!followupId || !fromAdmin || !toAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (!isValidObjectId(followupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid followupId format" });
    }

    const followup = await FollowUpBuyer.findById(followupId);

    if (!followup) {
      return res
        .status(404)
        .json({ success: false, message: "Follow-up not found" });
    }

    // Update admin name
    followup.adminName = toAdmin;

    // Push transfer history
    followup.transferHistory.push({
      from: fromAdmin,
      to: toAdmin,
      date: new Date(),
    });

    await followup.save();

    res.status(200).json({
      success: true,
      message: "Follow-up transferred successfully",
      data: followup,
    });
  } catch (error) {
    console.error("Transfer Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Create follow-up entry for buyer
router.post("/followup-create-buyer", async (req, res) => {
  try {
    const {
      ba_id,
      phoneNumber,
      followupStatus,
      followupType,
      followupDate,
      adminName,
      remarks,
    } = req.body;

    // Basic validation
    if (
      !ba_id ||
      !phoneNumber ||
      !followupStatus ||
      !followupType ||
      !followupDate ||
      !adminName
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const newFollowUp = new FollowUpBuyer({
      ba_id,
      phoneNumber,
      followupStatus,
      followupType,
      followupDate: new Date(followupDate),
      adminName,
      remarks,
    });

    await newFollowUp.save();
    res.status(201).json({ success: true, data: newFollowUp });
  } catch (err) {
    console.error("Follow-up creation error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

router.get("/followup-list-today-past-buyer", async (req, res) => {
  try {
    const { ba_id, phoneNumber, dateFilter } = req.query;
    let filter = {};

    if (ba_id) filter.ba_id = ba_id;
    if (phoneNumber) filter.phoneNumber = phoneNumber;

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    if (dateFilter === "today") {
      filter.followupDate = { $gte: todayStart, $lte: todayEnd };
    } else if (dateFilter === "past") {
      filter.followupDate = { $lt: todayStart };
    }

    const followups = await FollowUpBuyer.find(filter).sort({
      followupDate: -1,
    });
    res.status(200).json({ success: true, data: followups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/followup-list-buyer", async (req, res) => {
  try {
    const { ba_id, phoneNumber } = req.query;
    let filter = {};

    if (ba_id) filter.ba_id = ba_id;
    if (phoneNumber) filter.phoneNumber = phoneNumber;

    const followups = await FollowUpBuyer.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: followups });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /followups - Combined followup + buyer assistance data
router.get("/followups-buyer", async (req, res) => {
  try {
    // Fetch followups sorted by updatedAt (newest to oldest)
    const followups = await FollowUpBuyer.find().sort({ updatedAt: -1 });

    const baIds = followups.map((f) => Number(f.ba_id));
    const buyerData = await BuyerAssistance.find({ ba_id: { $in: baIds } });

    // Create a map for faster lookup
    const buyerMap = {};
    buyerData.forEach((buyer) => {
      buyerMap[buyer.ba_id] = buyer;
    });

    // Merge data
    const mergedData = followups.map((f, index) => ({
      sl: index + 1,
      ba_id: f.ba_id,
      phoneNumber: f.phoneNumber,
      followupStatus: f.followupStatus,
      followupType: f.followupType,
      followupDate: f.followupDate,
      adminName: f.adminName,
      remarks: f.remarks,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      buyer: buyerMap[Number(f.ba_id)] || {},
    }));

    res.status(200).json({ success: true, data: mergedData });
  } catch (err) {
    console.error("Error fetching combined followup data:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
