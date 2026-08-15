const mongoose = require('mongoose');

const UserInteractionSchema = new mongoose.Schema({
    userName: { type: String}, // Name of the user


    phoneNumber: { type: String },
    role: {
        type: String,
    },
    viewedFile: { type: String, required: true }, // Name of the file being viewed
    viewTime: { type: Date, default: Date.now }, // Timestamp of the interaction
});

const UserInteraction = mongoose.model('UserInteraction', UserInteractionSchema);

module.exports = UserInteraction;












// const mongoose = require('mongoose');

// const UserInteractionSchema = new mongoose.Schema({
//   userName: { type: String },
//   phoneNumber: { type: String },
//   role: {
//     type: String,
//     enum: ['manager', 'admin', 'accountant'],
//   },
//   viewedFile: { type: String, required: true },
//   viewTime: { type: Date, default: Date.now },
//   transferHistory: [
//     {
//       from: String,
//       to: String,
//       date: { type: Date, default: Date.now },
//     },
//   ],
// });

// module.exports = mongoose.model('UserInteraction', UserInteractionSchema);
