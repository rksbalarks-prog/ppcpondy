// const mongoose = require('mongoose');

// const planSchema = new mongoose.Schema({
//   planName: { type: String, required: true },
//   planAmount: { type: String, required: true },
//   planValidity: { type: String, required: true },
//   numberOfAssistants: { type: String, required: true },
//   serviceType: { type: String, required: true },
//   createDate: { type: Date, default: Date.now },
//   status: {
//     type: String,
//     enum: ['active', 'hide'],
//     default: 'active'
// },
//   ba_id: {
//     type: Number,
//     unique: true,
//     required: true,
//   },
// });

// const BuyerPlan = mongoose.model('BuyerPlan', planSchema);

// module.exports = BuyerPlan;












const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  planName: { type: String, required: true },
  planAmount: { type: String, required: true },
  planValidity: { type: String, required: true },
  numberOfAssistants: { type: String, required: true },
  serviceType: { type: String, required: true },
  createDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'hide'],
    default: 'active'
  },
  // Replace ba_id with array of phoneNumbers objects
  phoneNumbers: [
    {
      number: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^[0-9]{10}$/.test(v);
          },
          message: 'Must be a valid 10-digit phone number'
        }
      },
      ba_id: {
        type: Number,
        required: true
      }
    }
  ],
  expireDate: {
    type: Date,
    required: false,  // optional, can be set based on plan start + validity
  }
});

const BuyerPlan = mongoose.model('BuyerPlan', planSchema);

module.exports = BuyerPlan;
