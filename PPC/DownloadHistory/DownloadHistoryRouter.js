const express = require('express');
const router = express.Router();
const DownloadHistory = require('./DownloadHistoryModel');

// Record a file download performed anywhere in the admin panel.
// Called by the global download tracker in the admin frontend.
router.post('/record-download', async (req, res) => {
  try {
    const { adminName, role, fileName, fileType, pageName, pagePath, downloadedAt } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, message: 'fileName is required' });
    }

    const doc = await DownloadHistory.create({
      adminName: adminName || 'Unknown',
      role: role || '',
      fileName,
      fileType: fileType || '',
      pageName: pageName || '',
      pagePath: pagePath || '',
      downloadedAt: downloadedAt ? new Date(downloadedAt) : new Date(),
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error recording download',
      error: error.message,
    });
  }
});

// Fetch download history, newest first.
router.get('/get-download-history', async (req, res) => {
  try {
    const data = await DownloadHistory.find()
      .sort({ downloadedAt: -1 })
      .limit(5000);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching download history',
      error: error.message,
    });
  }
});

module.exports = router;
