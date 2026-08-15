

const mongoose = require("mongoose");

// City-base (PY/CH) helpers — tag each notification on save and auto-filter
// list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require("../utils/baseFilter");
const { getScopedBase } = require("../utils/baseScope");
const cityScopePlugin = require("../utils/cityScopePlugin");

const NotificationSchema = new mongoose.Schema(
  {
    userPhoneNumber: { type: String, required: true }, // User receiving the notification
    message: { type: String, required: true }, // Notification message
    type: { type: String, enum: ["message", "warning"], required: true }, // Type of notification
    ppcId: { type: Number, required: false }, // Linked property (if applicable)
    isRead: { type: Boolean, default: false }, // Read status
    createdAt: { type: Date, default: Date.now }, // Timestamp

    // ✅ City base: 'PY' = Pondicherry (default), 'CH' = Chennai. Legacy records
    // without this field are treated as 'PY' by the base filter.
    base: {
      type: String,
      enum: ["PY", "CH"],
      default: "PY",
    },
  },
  { timestamps: true }
);

// City-base tagging: stamp `base` on creation (or any untagged record). A
// PY/CH-scoped admin / city app forces that city; otherwise default to PY.
NotificationSchema.pre("save", function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
NotificationSchema.plugin(cityScopePlugin);

module.exports = mongoose.model("Notification", NotificationSchema);
