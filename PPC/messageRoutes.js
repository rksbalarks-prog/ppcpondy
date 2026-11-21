const express = require("express");
const axios = require("axios");
const { logWhatsApp } = require("./WhatsAppActivity/logWhatsApp");
const router = express.Router();

router.post("/send-message", async (req, res) => {
  const { to, message } = req.body || {};
  try {
    if (!to || !message) {
      return res.status(400).json({ error: "Missing 'to' or 'message'" });
    }

    const response = await axios.post(
      "https://app.onemsg.io/api/create-message",
      new URLSearchParams({
        appkey: process.env.ONEMSG_APPKEY,
        authkey: process.env.ONEMSG_AUTHKEY,
        to,
        message
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    logWhatsApp(req, { to, message, data: response.data });
    res.json(response.data);
  } catch (err) {
    logWhatsApp(req, { to, message, data: err.response && err.response.data, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
