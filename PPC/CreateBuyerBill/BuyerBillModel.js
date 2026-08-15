const mongo = require('mongoose');

const BillBuyerSchema = new mongo.Schema({
  adminOffice: { type: String, required: true },
  adminName: { type: String, required: true },
  ba_id: {
    type: Number,
    required: true,
  },  
  billNo: { type: String, required: true },
  billDate: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  paymentType: { type: String, required: true },
  planName: { type: String, required: true },
  billAmount: { type: Number, required: true },
  validity: { type: Number, required: true },
  noOfAds: { type: Number, required: true },
  featuredAmount: { type: Number, required: true },
  featuredValidity: { type: Number, required: true },
  featuredMaxAds: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  
  // Track who created and modified the bill
  billCreatedBy: {
    type: String,
    default: "Admin",
  },
  lastModifiedBy: {
    type: String,
    default: null
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
BillBuyerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update the updatedAt timestamp before updating
BillBuyerSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongo.model('BuyerBill', BillBuyerSchema);
