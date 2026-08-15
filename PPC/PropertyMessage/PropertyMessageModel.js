const mongoose = require('mongoose');

// City-base (PY/CH) helpers — tag each property message on save and auto-filter
// list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require('../utils/baseFilter');
const { getScopedBase } = require('../utils/baseScope');
const cityScopePlugin = require('../utils/cityScopePlugin');

const PropertyMessageSchema = new mongoose.Schema({
  ppcId: {
    type: Number,
    required: true,
    index: true,
    unique: true,
  },

  // Option 1: Admin can choose from predefined list
  enumMessage: {
    type: String,
    enum: ['Sold Out', 'Waiting', 'Available', 'Coming Soon', 'Under Process', 'Blocked', 'Other'],
    default: null,
  },

  // Option 2: Admin can write a custom message
  customMessage: {
    type: String,
    default: null,
    trim: true,
  },

  setBy: {
    type: String,
    default: 'Admin',
  },

  setAt: {
    type: Date,
    default: Date.now,
  },

  // ✅ City base: 'PY' = Pondicherry (default), 'CH' = Chennai. Legacy records
  // without this field are treated as 'PY' by the base filter.
  base: {
    type: String,
    enum: ['PY', 'CH'],
    default: 'PY',
  },
}, {
  timestamps: true,
});

// ✅ Custom validation: Either enumMessage or customMessage must be provided
PropertyMessageSchema.pre('validate', function (next) {
  if (!this.enumMessage && !this.customMessage) {
    return next(new Error('Either enumMessage or customMessage must be provided'));
  }
  next();
});

// City-base tagging: stamp `base` on creation (or any untagged record). A
// PY/CH-scoped admin / city app forces that city; otherwise default to PY.
PropertyMessageSchema.pre('save', function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
PropertyMessageSchema.plugin(cityScopePlugin);

module.exports = mongoose.model('PropertyMessage', PropertyMessageSchema);
