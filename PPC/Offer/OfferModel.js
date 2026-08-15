


const mongoose = require('mongoose');

// City-base (PY/CH) helpers — tag each offer on save and auto-filter
// list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require('../utils/baseFilter');
const { getScopedBase } = require('../utils/baseScope');
const cityScopePlugin = require('../utils/cityScopePlugin');

const offerSchema = new mongoose.Schema({
    price: { type: Number, required: true },
    ppcId: { type: Number, required: true },
    phoneNumber: { type: String, required: true }, // Buyer phone
    originalPrice: { type: Number },
    postedUserPhoneNumber: { type: String }, // Owner phone
    status: {
        type: String,
        enum: ['accept', 'reject', 'pending', 'offerSend', 'delete'],
        default: 'pending',
    },
    previousStatus: {
        type: String,
        enum: ['pending', 'accept', 'reject', 'delete']
    },
    bedrooms: { type: String },
    totalArea: { type: Number },
    
    areaUnit: { type: String },

    propertyMode: { type: String },
    ownership: { type: String },
    propertyType: { type: String },
    createdAt: {
        type: Date,
        default: Date.now
    },
      // ... your existing fields ...
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
   type:String,
    default: 'Admin'
  },

  // ✅ City base: 'PY' = Pondicherry (default), 'CH' = Chennai. Legacy records
  // without this field are treated as 'PY' by the base filter.
  base: {
    type: String,
    enum: ['PY', 'CH'],
    default: 'PY'
  }
});

// City-base tagging: stamp `base` on creation (or any untagged record). A
// PY/CH-scoped admin / city app forces that city; otherwise auto-classify from
// the record's address (offers carry no city, so this defaults to PY).
offerSchema.pre('save', function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
offerSchema.plugin(cityScopePlugin);

const Offer = mongoose.model('Offer', offerSchema);
module.exports = Offer;
