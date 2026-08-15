const mongoose = require("mongoose");

// City-base (PY/CH) helpers — tag each buyer-assistance record on save and
// auto-filter list/count/aggregate queries to the active city.
const { resolveBaseForSave } = require("../utils/baseFilter");
const { getScopedBase } = require("../utils/baseScope");
const cityScopePlugin = require("../utils/cityScopePlugin");



const BuyerAssistanceSchema = new mongoose.Schema({
  ba_id: {
    type: Number,
    unique: true,
    required: true,
  },
  baName:{
    type:String
  },
  ppcId:{type: String},
  phoneNumber: { type: String },
  altPhoneNumber:{
    type: String,
  },

  // PPCID phone masking (mirrors the property feature in AddModel). When an
  // admin assigns a phone via "Set PPCID Assign", the buyer's real number is
  // hidden behind assignedPhoneNumber on the user side. unassign moves the
  // current value to previouslyAssignedPhoneNumber so it can be restored.
  assignedPhoneNumber: { type: String },
  setPpcId: { type: Boolean, default: false },
  setPpcIdAssignedAt: { type: Date },
  previouslyAssignedPhoneNumber: { type: String },
  previouslyAssignedAt: { type: Date },
  city: { type: String },
  area: { type: String},
  pincode: { type: String },
  loanInput: {
    type:String,
  },
  minPrice:{
    type:String,
  },
  maxPrice: {
    type:String,
  },

  
  totalArea:{
    type:String,
  },
  areaUnit: {
    type:String,
  },
  bedrooms: {
    type:String,
  },
  propertyMode: {
    type:String,  
  },

  propertyType:{
    type:String,
  },

  propertyAge:{
    type:String,
  },

  bankLoan: { type: String, }, 

  propertyApproved: { type: String,  }, 
  
  facing: {
    type:String,
  },
  state: { type: String},
  
  interestedUserPhone: { type: [String] }, 


ba_status: {
  type: String,
  enum: ["buyer-assistance-interest", "buyer-interest-tried", "baActive", "baPending","baExpired"], 
  default: "baPending",
},


  ba_postBy: {
    type: String,
    enum: ["User", "Admin"],
    default: "User",
  },
 
  paymentType: { type: String },
  description: String,

  // Stamp the admin who created this record (sent from AddBuyerAssistance.jsx).
  addedBy: { type: String, default: null },
  addedByRole: { type: String, default: null },
  addedAt: { type: Date, default: null },

  isDeleted: { type: Boolean, default: false },   // Soft delete flag
  deletedAt: { type: Date, default: null },

  // ✅ City base: 'PY' = Pondicherry (default), 'CH' = Chennai. Legacy records
  // without this field are treated as 'PY' by the base filter.
  base: {
    type: String,
    enum: ['PY', 'CH'],
    default: 'PY'
  }
}, { timestamps: true });

// City-base tagging: stamp `base` on creation (or any untagged record). A
// PY/CH-scoped admin / city app forces that city; otherwise auto-classify from
// the record's city/district address.
BuyerAssistanceSchema.pre('save', function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// Auto-filter list/count/aggregate queries to the request's active base.
BuyerAssistanceSchema.plugin(cityScopePlugin);

module.exports = mongoose.model("BuyerAssistance", BuyerAssistanceSchema);





// const BuyerAssistanceSchema = new mongoose.Schema({
//   ba_id: { 
//     type: Number, 
//     required: true, 
//     unique: true 
//   },
//   baName: {
//     type: String
//   },
//   ppcId: {
//     type: String
//   },
//   phoneNumber: { 
//     type: String, 
//     required: true 
//   },
//   altPhoneNumber: {
//     type: String
//   },
//   city: { 
//     type: String,
//     required: true 
//   },
//   area: { 
//     type: String, 
//     required: true 
//   },
//   loanInput: {
//     type: String
//   },
//   minPrice: {
//     type: String,
//     required: true
//   },
//   maxPrice: {
//     type: String,
//     required: true
//   },
//   totalArea: {
//     type: String
//   },
//   areaUnit: {
//     type: String,
//     required: true
//   },
//   bedrooms: {
//     type: String
//   },
//   propertyMode: {
//     type: String  
//   },
//   propertyType: {
//     type: String,
//     required: true
//   },
//   propertyAge: {
//     type: String
//   },
//   bankLoan: { 
//     type: String
//   },
//   propertyApproved: { 
//     type: String
//   },
//   facing: {
//     type: String
//   },
//   state: { 
//     type: String
//   },
//   interestedUserPhone: { 
//     type: [String],
//     default: [],
//     validate: {
//       validator: function(v) {
//         return v === null || 
//                v === undefined || 
//                (Array.isArray(v) && v.every(item => typeof item === "string"));
//       },
//       message: "interestedUserPhone must be an array of strings"
//     }
//   },
//   ba_status: {
//     type: String,
//     enum: ["buyer-assistance-interest", "remove-assistance-interest", "baActive", "baPending"],
//     default: "baPending"
//   },
//   paymentType: { 
//     type: String 
//   },
//   description: { 
//     type: String 
//   },
//   isDeleted: { 
//     type: Boolean, 
//     default: false 
//   },
//   deletedAt: { 
//     type: Date, 
//     default: null 
//   }
// }, { 
//   timestamps: true 
// });
// // Add this pre-save hook to prevent future issues
// BuyerAssistanceSchema.pre('save', function(next) {
//   if (this.interestedUserPhone && !Array.isArray(this.interestedUserPhone)) {
//     this.interestedUserPhone = [this.interestedUserPhone];
//   } else if (!this.interestedUserPhone) {
//     this.interestedUserPhone = [];
//   }
//   next();
// });


// module.exports = mongoose.model("BuyerAssistance", BuyerAssistanceSchema);