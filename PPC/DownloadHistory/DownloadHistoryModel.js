const mongoose = require('mongoose');

// One record per file an admin downloads anywhere in the admin panel
// (Excel / PDF / CSV exports). Written by POST /PPC/record-download.
const DownloadHistorySchema = new mongoose.Schema(
  {
    adminName: { type: String, default: 'Unknown' },
    role: { type: String, default: '' },
    fileName: { type: String, required: true },
    fileType: { type: String, default: '' }, // xlsx, pdf, csv, etc.
    pageName: { type: String, default: '' }, // human-readable page label
    pagePath: { type: String, default: '' }, // route path the download came from
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DownloadHistory', DownloadHistorySchema);
