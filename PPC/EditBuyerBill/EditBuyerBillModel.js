const mongoose = require('mongoose');

/**
 * EditBuyerBillModel - Schema for editing buyer bills
 * Shares the same structure as BillModel but organized separately
 * for clarity and to support edit-specific operations
 */

const EditBuyerBillSchema = new mongoose.Schema({
  // Core Bill Information
  adminOffice: { 
    type: String, 
    required: true 
  },
  adminName: { 
    type: String, 
    required: true 
  },
  ba_id: { 
    type: String, 
    required: true,
    index: true  // Index for faster queries
  },
  billNo: { 
    type: String, 
    required: true,
    unique: true
  },
  billDate: { 
    type: String, 
    required: true,
    validate: {
      validator: function(value) {
        const billDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return billDate >= today;
      },
      message: 'Bill date must be today or a future date'
    }
  },

  // Customer Information
  ownerPhone: { 
    type: String, 
    required: true 
  },

  // Payment and Plan Details
  paymentType: { 
    type: String, 
    required: true 
  },
  planName: { 
    type: String, 
    required: true 
  },

  // Bill Amounts
  billAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  discount: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  netAmount: { 
    type: Number, 
    required: true,
    min: 0
  },

  // Validity and Ad Information
  validity: { 
    type: Number, 
    required: true,
    min: 1
  },
  noOfAds: { 
    type: Number, 
    required: true,
    min: 0
  },

  // Featured Ads Details
  featuredAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  featuredValidity: { 
    type: Number, 
    required: true,
    min: 0
  },
  featuredMaxAds: { 
    type: Number, 
    required: true,
    min: 0
  },

  // System Metadata
  billCreatedBy: {
    type: String,
    default: "User",
    enum: ['User', 'Admin', 'System']
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true  // CreatedAt should not be changed
  },
  updatedAt: { 
    type: Date, 
    default: Date.now
  },
  lastModifiedBy: {
    type: String,
    default: null
  },

  // Soft Delete Fields
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true
  },
  deletedAt: { 
    type: Date, 
    default: null
  },
  deletedBy: {
    type: String,
    default: null
  },
});

// Index for common queries
EditBuyerBillSchema.index({ ba_id: 1, isDeleted: 1 });
EditBuyerBillSchema.index({ createdAt: -1 });

// Update the updatedAt timestamp before saving
EditBuyerBillSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update the updatedAt timestamp before updating
EditBuyerBillSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('EditBuyerBill', EditBuyerBillSchema);
