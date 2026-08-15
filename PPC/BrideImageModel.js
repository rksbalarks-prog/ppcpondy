const mongoose = require('mongoose');

const uploadBrideSchema = new mongoose.Schema({
   images: {
    type: [String],
    default: [],
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  updateDate: {
    type: Date,
    default: Date.now
  },
  deleteDate: {
    type: Date,
    default: null
  }
},{ timestamps: { createdAt: 'uploadDate' } });

module.exports = mongoose.model('UploadImagesBride', uploadBrideSchema);
