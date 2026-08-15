const mongoose = require("mongoose");

// City-base (PY/CH) helpers — tag each address request on save and auto-filter
// list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require("../utils/baseFilter");
const { getScopedBase } = require("../utils/baseScope");
const cityScopePlugin = require("../utils/cityScopePlugin");

const AddressRequestSchema = new mongoose.Schema({
  ppcId: { type: Number },
  requesterPhoneNumber: { type: String, required: true },
  postedUserPhoneNumber: { type: String },
  city: { type: String },
  district: { type: String },
  area: { type: String },
  status: {
    type: String,
    enum: ["address request pending", "address sent", "address request rejected", "deleted"],
    default: "address request pending",
  },
  previousStatus: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },

  // ✅ City base: 'PY' = Pondicherry (default), 'CH' = Chennai. Legacy records
  // without this field are treated as 'PY' by the base filter.
  base: {
    type: String,
    enum: ["PY", "CH"],
    default: "PY",
  },
}, { timestamps: true });

// City-base tagging: stamp `base` on creation (or any untagged record). A
// PY/CH-scoped admin / city app forces that city; otherwise auto-classify from
// the request's city/district address.
AddressRequestSchema.pre("save", function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
AddressRequestSchema.plugin(cityScopePlugin);

module.exports = mongoose.model("AddressRequest", AddressRequestSchema);
