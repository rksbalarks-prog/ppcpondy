// // models/ContactLog.js
// const mongoose = require('mongoose');

// const ContactLogSchema = new mongoose.Schema({
//   ppcId: {
//     type: Number,
//     required: true,
//   },
//   userPhone: {
//     type: String,
//     required: true,
//   },

//    postedUserPhone: {
//     type: String,
//     required: true,
//   },

//   contactedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model('ContactLog', ContactLogSchema);













// models/ContactLog.js
const mongoose = require('mongoose');

const ContactLogSchema = new mongoose.Schema({
  ppcId: {
    type: Number,
    required: true,
  },
  userPhone: {
    type: String,
    required: true,
  },
  postedUserPhone: {
    type: String,
    required: true,
  },
  contactedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "contactSend",
  }
},
  { timestamps: true });

module.exports = mongoose.model('ContactLog', ContactLogSchema);
