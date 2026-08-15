// ai_owner_lead — owner listing intake captured by the assistant. This is a
// lightweight LEAD (for the team to follow up + add photos/plan), NOT a public
// property listing. Fields mirror the SALE schema (price, totalArea, salesType).
const mongoose = require('mongoose');

const OwnerLeadSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true }, // verified session phone
    propertyMode: String,
    propertyType: String,
    bedrooms: String,
    floorNo: String,
    carParking: String,
    lift: String,
    price: String,
    totalArea: String,
    areaUnit: String,
    salesType: String,
    postedBy: String,
    area: String,
    pinCode: String,
    streetName: String,
    contactPhone: String,
    lang: String,
    // Admin follow-up workflow.
    status: { type: String, default: 'new' }, // new | contacted | preapproved | dropped
    remark: { type: String, default: '' },
    followupDate: Date,
    calledBy: String,
    ppcId: Number, // set once converted to a PreApproved property
  },
  { timestamps: true, collection: 'ai_owner_lead' }
);

module.exports = mongoose.models.AiOwnerLead ||
  mongoose.model('AiOwnerLead', OwnerLeadSchema);
