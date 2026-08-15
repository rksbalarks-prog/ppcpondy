const mongoose = require("mongoose");

const PlanLimitSchema = new mongoose.Schema({
  planName: { type: String, required: true, unique: true }, // e.g., Free, Silver, GoldPlus
  planViewLimitPerDay: { type: Number, required: true }, // e.g., 20, 30, 50
  isDeleted: {
  type: Boolean,
  default: false
}

});

module.exports = mongoose.model("PlanLimit", PlanLimitSchema);
