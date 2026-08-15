const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/send-message", async (req, res) => {
  try {
    const { to, message } = req.body;

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

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
