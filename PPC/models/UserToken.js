const mongoose = require("mongoose");

const userTokenSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  fcmToken: { type: String, required: true },
});

module.exports = mongoose.model("UserToken", userTokenSchema);
