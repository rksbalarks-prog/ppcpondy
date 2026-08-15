const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Lazy load the model
let SingleSendWhatsapp = null;

async function loadModel() {
  if (SingleSendWhatsapp) return SingleSendWhatsapp;
  
  try {
    const module1 = await import("./Singlesendmsgmodel.js");
    SingleSendWhatsapp = module1.default;
  } catch (err1) {
    try {
      const module2 = await import("./SingleSendMsgModel.js");
      SingleSendWhatsapp = module2.default;
    } catch (err2) {
      try {
        const module3 = await import("./singlesendmsgmodel.js");
        SingleSendWhatsapp = module3.default;
      } catch (err3) {
        console.error("Failed to load model with all case variations:", {
          path1: "./Singlesendmsgmodel",
          path2: "./SingleSendMsgModel", 
          path3: "./singlesendmsgmodel",
          error: err3.message
        });
        throw new Error("SingleSendWhatsapp model not found. Check file exists at SingleSendWhatsapp/Singlesendmsgmodel.js");
      }
    }
  }
  
  return SingleSendWhatsapp;
}

console.log("✅ SingleSendWhatsapp router initialized");

/* ─────────────────────────────────────────────────────────────────────────
 * POST  /api/single-send-whatsapp
 * Save a new message record (and optionally trigger the WA API here)
 * ───────────────────────────────────────────────────────────────────────── */
router.post("/", async (req, res) => {
  try {
    const Model = await loadModel();
    const { title, phoneNumbers, message, sentBy } = req.body;

    /* ── basic validation ── */
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({ success: false, message: "At least one phone number is required" });
    }
    if (phoneNumbers.length > 200) {
      return res.status(400).json({ success: false, message: "Maximum 200 phone numbers allowed" });
    }

    /* ── sanitise numbers: digits only, 10-15 chars ── */
    const sanitised = [...new Set(
      phoneNumbers
        .map((n) => String(n).replace(/\D/g, "").trim())
        .filter((n) => n.length >= 10 && n.length <= 15)
    )];

    if (sanitised.length === 0) {
      return res.status(400).json({ success: false, message: "No valid phone numbers found" });
    }

    /* ── save to DB ── */
    const record = await Model.create({
      title:        title.trim(),
      phoneNumbers: sanitised,
      message:      message.trim(),
      sentBy:       sentBy || "admin",
      status:       "queued",
    });

    /* ─────────────────────────────────────────────────────────────────────
     * OPTIONAL: integrate your WhatsApp API here
     * Example using whatsapp-web.js / Twilio / Meta Cloud API:
     *
     *  let sentCount = 0, failedCount = 0;
     *  for (const number of sanitised) {
     *    try {
     *      await whatsappClient.sendMessage(`${number}@c.us`, message.trim());
     *      sentCount++;
     *    } catch { failedCount++; }
     *  }
     *  record.status      = failedCount === 0 ? "sent" : sentCount === 0 ? "failed" : "partial";
     *  record.sentCount   = sentCount;
     *  record.failedCount = failedCount;
     *  record.sentAt      = new Date();
     *  await record.save();
     * ───────────────────────────────────────────────────────────────────── */

    return res.status(201).json({
      success: true,
      message: `Message queued for ${sanitised.length} number(s)`,
      data: record,
    });

  } catch (err) {
    console.error("SingleSendWhatsapp POST error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────────────
 * GET  /api/single-send-whatsapp
 * Fetch all records, newest first
 * ───────────────────────────────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const Model = await loadModel();
    const { page = 1, limit = 50, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const records = await Model.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Model.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data:  records,
    });

  } catch (err) {
    console.error("SingleSendWhatsapp GET error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────────────
 * GET  /api/single-send-whatsapp/:id
 * Fetch a single record by ID
 * ───────────────────────────────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const Model = await loadModel();
    const record = await Model.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error("SingleSendWhatsapp GET/:id error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────────────
 * PATCH  /api/single-send-whatsapp/:id/status
 * Update the status of a message (e.g. after WA delivery callback)
 * ───────────────────────────────────────────────────────────────────────── */
router.patch("/:id/status", async (req, res) => {
  try {
    const Model = await loadModel();
    const { status, sentCount, failedCount } = req.body;

    const allowed = ["queued", "sent", "failed", "partial"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const update = { status };
    if (status === "sent" || status === "partial") {
      update.sentAt = new Date();
      if (sentCount   !== undefined) update.sentCount   = sentCount;
      if (failedCount !== undefined) update.failedCount = failedCount;
    }

    const record = await Model.findByIdAndUpdate(
      req.params.id, update, { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: record });

  } catch (err) {
    console.error("SingleSendWhatsapp PATCH error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/* ─────────────────────────────────────────────────────────────────────────
 * DELETE  /api/single-send-whatsapp/:id
 * Remove a record
 * ───────────────────────────────────────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const Model = await loadModel();
    const record = await Model.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    return res.status(200).json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    console.error("SingleSendWhatsapp DELETE error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;