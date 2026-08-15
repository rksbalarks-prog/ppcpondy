

const mongoose = require('mongoose');

// City-base (PY/CH) helpers: tag each property's base on save and auto-filter
// list/count/aggregate queries to the request's active city.
const { resolveBaseForSave } = require('./utils/baseFilter');
const { getScopedBase } = require('./utils/baseScope');
const cityScopePlugin = require('./utils/cityScopePlugin');


// List of country codes (you can extend this as needed)
const countryCodes = [
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+61', country: 'Australia' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+34', country: 'Spain' },
  { code: '+55', country: 'Brazil' },
  { code: '+52', country: 'Mexico' },
  { code: '+86', country: 'China' },
  { code: '+39', country: 'Italy' },
  { code: '+7', country: 'Russia/Kazakhstan' },
  { code: '+82', country: 'South Korea' },
  { code: '+46', country: 'Sweden' },
  { code: '+31', country: 'Netherlands' },
  { code: '+41', country: 'Switzerland' },
  { code: '+32', country: 'Belgium' },
  { code: '+47', country: 'Norway' },
  { code: '+358', country: 'Finland' },
  { code: '+420', country: 'Czech Republic' },
  { code: '+48', country: 'Poland' },
  { code: '+30', country: 'Greece' },
  { code: '+351', country: 'Portugal' },
  { code: '+20', country: 'Egypt' },
  { code: '+27', country: 'South Africa' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+971', country: 'UAE' },
  { code: '+90', country: 'Turkey' },
  { code: '+62', country: 'Indonesia' },
  { code: '+63', country: 'Philippines' },
  { code: '+64', country: 'New Zealand' },
  { code: '+856', country: 'Laos' },
  { code: '+66', country: 'Thailand' },
  { code: '+84', country: 'Vietnam' },
  { code: '+92', country: 'Pakistan' },
  { code: '+94', country: 'Sri Lanka' },
  { code: '+880', country: 'Bangladesh' },
  { code: '+972', country: 'Israel' },
  { code: '+56', country: 'Chile' },
  { code: '+54', country: 'Argentina' },
  { code: '+595', country: 'Paraguay' },
  { code: '+57', country: 'Colombia' },
  { code: '+505', country: 'Nicaragua' },
  { code: '+503', country: 'El Salvador' },
  { code: '+509', country: 'Haiti' },
  { code: '+213', country: 'Algeria' },
  { code: '+216', country: 'Tunisia' },
  { code: '+225', country: 'Ivory Coast' },
  { code: '+234', country: 'Nigeria' },
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+591', country: 'Bolivia' },
  { code: '+593', country: 'Ecuador' },
  { code: '+375', country: 'Belarus' },
  { code: '+373', country: 'Moldova' },
  { code: '+380', country: 'Ukraine' }
];


const alternateCountryCode =[
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'India' },
  { code: '+61', country: 'Australia' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+34', country: 'Spain' },
  { code: '+55', country: 'Brazil' },
  { code: '+52', country: 'Mexico' },
  { code: '+86', country: 'China' },
  { code: '+39', country: 'Italy' },
  { code: '+7', country: 'Russia/Kazakhstan' },
  { code: '+82', country: 'South Korea' },
  { code: '+46', country: 'Sweden' },
  { code: '+31', country: 'Netherlands' },
  { code: '+41', country: 'Switzerland' },
  { code: '+32', country: 'Belgium' },
  { code: '+47', country: 'Norway' },
  { code: '+358', country: 'Finland' },
  { code: '+420', country: 'Czech Republic' },
  { code: '+48', country: 'Poland' },
  { code: '+30', country: 'Greece' },
  { code: '+351', country: 'Portugal' },
  { code: '+20', country: 'Egypt' },
  { code: '+27', country: 'South Africa' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+971', country: 'UAE' },
  { code: '+90', country: 'Turkey' },
  { code: '+62', country: 'Indonesia' },
  { code: '+63', country: 'Philippines' },
  { code: '+64', country: 'New Zealand' },
  { code: '+856', country: 'Laos' },
  { code: '+66', country: 'Thailand' },
  { code: '+84', country: 'Vietnam' },
  { code: '+92', country: 'Pakistan' },
  { code: '+94', country: 'Sri Lanka' },
  { code: '+880', country: 'Bangladesh' },
  { code: '+972', country: 'Israel' },
  { code: '+56', country: 'Chile' },
  { code: '+54', country: 'Argentina' },
  { code: '+595', country: 'Paraguay' },
  { code: '+57', country: 'Colombia' },
  { code: '+505', country: 'Nicaragua' },
  { code: '+503', country: 'El Salvador' },
  { code: '+509', country: 'Haiti' },
  { code: '+213', country: 'Algeria' },
  { code: '+216', country: 'Tunisia' },
  { code: '+225', country: 'Ivory Coast' },
  { code: '+234', country: 'Nigeria' },
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+591', country: 'Bolivia' },
  { code: '+593', country: 'Ecuador' },
  { code: '+375', country: 'Belarus' },
  { code: '+373', country: 'Moldova' },
  { code: '+380', country: 'Ukraine' }
]

const locationData = {
  "Tamil Nadu": {
    "Chennai": ["T. Nagar", "Adyar", "Velachery"],
    "Coimbatore": ["Gandhipuram", "RS Puram", "Peelamedu"],
    "Madurai": ["Anna Nagar", "KK Nagar", "Simmakkal"],
  },
  "Karnataka": {
    "Bangalore": ["Whitefield", "Electronic City", "Jayanagar"],
    "Mysore": ["Vijayanagar", "Hebbal", "Lakshmipuram"],
  },
  "Maharashtra": {
    "Mumbai": ["Andheri", "Borivali", "Dadar"],
    "Pune": ["Shivaji Nagar", "Hinjewadi", "Kothrud"],
  },
};

// Extract states, districts, and areas dynamically
const states = Object.keys(locationData);
const allDistricts = states.flatMap((state) => Object.keys(locationData[state]));
const allAreas = allDistricts.flatMap((district) =>
  Object.values(locationData).flatMap((state) => state[district] || [])
);

const AddSchema = new mongoose.Schema({
  phoneNumber: { type: String},
  ppcId: { type: Number},

  planName: { type: String }, // Plan name assigned to property
  planCreatedAt: { type: Date, default: Date.now },

    assignedPhoneNumber: String,
    
  setPpcId: { type: Boolean, default: false },

  setPpcIdAssignedAt: {
  type: Date
},

previouslyAssignedPhoneNumber: String,
previouslyAssignedAt: Date,


  views: { type: Number, default: 0 },

  countryCode: {
    type: String,
    required: true,
    default: '+91',
  },
  alternateCountryCode: {
    type: String,
    // required: true,
    default: '+91',
  },


  minPrice:{
    type:String,
  },
  maxPrice: {
    type:String,
  },

  paymentType:{
    type:String
  },

  propertyMode: { type: String },

  propertyType: { type: String },

  propertyAge: { type: String },

  // price: { type: Number   },

    price: { type: Number, default: 0 },

  
  status: {
    type: String,
    enum: ['incomplete','active','expired','pending', 'complete','sendInterest', 'soldOut', 'reportProperties', 'needHelp', 'contact', 'favorite', 'alreadySaved', 'favoriteRemoved', 'delete','undo','contact send'],
    default: 'incomplete',
  },


reason: {
  type: String,
  default: null,
  trim: true
},

updatedBy: {
  type: String,
  default: null,
  trim: true
},

// Stamp the admin who originally added this property (sent from AddProperty.jsx).
addedBy:     { type: String, default: null, trim: true },
addedByRole: { type: String, default: null, trim: true },
addedAt:     { type: Date,   default: null },

// Stamp the admin who approved this property (set by /create-bill when status flips to 'active').
approvedBy:     { type: String, default: null, trim: true },
approvedByRole: { type: String, default: null, trim: true },
approvedAt:     { type: Date,   default: null },

// Bulk Excel upload batch tag. Every property created in one upload shares a
// bulkUploadId so the whole batch can be reverted (deleted) together from the
// Bulk Upload Property page. Null for properties not added via bulk upload.
bulkUploadId: { type: String, default: null, index: true },
bulkUploadAt: { type: Date,   default: null },
bulkUploadBy: { type: String, default: null, trim: true },

newStatus:{type:String},

  

  previousStatus: { type: String, enum: ['incomplete', 'complete','delete','active','contact','contact send'] }, 

  featureStatus: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no',
  },


  interestRequests: [
    { phoneNumber: { type: String },
    date: { type: Date, default: Date.now },
   
  }

  ],

  soldOutReport: [{ phoneNumber: { type: String }, 
    date: { type: Date, default: Date.now },
   }],

  helpRequests: [{
    phoneNumber: { type: String },
    selectHelpReason: {
      type: String,
      enum: [
        'Help Me to Buy this Property',
        'Book for Property Visit',
        'Loan Help',
        'Property Valuation',
        'Document Verification',
        'Property Surveying',
        'EC',
        'Patta Name Change',
        'Registration Help',
        'Others'
      ],
    },
    comment: {
      type: String,
    },
    requestedAt: { type: Date, default: Date.now }
  }],
  
calledExprience: [{
  phoneNumber: { type: String },
  reasonCalled: { type: String },
  selectCalledReasons: {
    type: String,
    enum: ['Already Sold', 'Wrong Information', 'Not Responding', 'Fraud', 'Duplicate Ads', 'Other']
  },
  date: { type: Date, default: Date.now }
}],

  reportProperty: [{ phoneNumber: { type: String },
    reason: {
      type: String,
    },
    // Enforce one of your preset reasons
    selectReasons: {
      type: String,
      enum: [
        'Already Sold',
        'Wrong Information',
        'Not Responding',
        'Fraud',
        'Duplicate Ads',
        'Other'
      ],
    },
    date: { type: Date, default: Date.now },
   }],
   

  contactRequests: [{ phoneNumber: { type: String } ,
    date: { type: Date, default: Date.now },
  }],

  alreadySaved: [{ phoneNumber: { type: String } }],
  
  favoriteRemoved: [{ phoneNumber: { type: String },
    removedAt: { type: Date, default: Date.now },
    }],
    
  favoriteRequests: [{ phoneNumber: { type: String },
    date: { type: Date, default: Date.now },
   }],

   createdBy: {
    type: String,
    default: 'User'
  },

  
  deletedBy: {
    type: String,
    default: 'User'
  },
  
  deletedAt: {
    type: Date,
    default: Date.now // or null, depending on how you handle deletion
  },
  

  bankLoan: { type: String },
  negotiation: { type: String },

  length: { type: Number },
  breadth: { type: Number },
  totalArea: { type: Number },

  ownership: { type: String },

  bedrooms: { type: String },

  kitchen: { type: String },
  kitchenType: { type: String },

  balconies: { type: String },

  floorNo: { type: String },

  areaUnit: { type: String },

  propertyApproved: { type: String },
  postedBy: { type: String },

  facing: { type: String },

  salesMode: { type: String },
  salesType: { type: String },
  description: { type: String },

  furnished: { type: String },
  lift: { type: String },

  attachedBathrooms: { type: String },

  western: { type: String },

  numberOfFloors: { type: String },

  carParking: { type: String },

  rentalPropertyAddress: { type: String },
  country: { type: String },
  city: { type: String },
  state: { type: String },
  district: { type: String },
  pinCode: { type: Number },
  area: { type: String },
  streetName: { type: String },
  doorNumber: { type: String },
  nagar: { type: String },
  pinCode:{type:Number},

  locationCoordinates: {
    type: String, // Format: "latitude,longitude"
    default: '',
    trim: true,
  },
  

  ownerName: { type: String },
  email: { type: String },

  bestTimeToCall: { type: String },

  video: {   type: [String],
    default: [], },

  photos: {
    type: [String],
    default: [],
  },

  propertyDetails: {
    type: Object,   // You can define more fields if you want
},
// planName: {
//     type: String,   // Example: "Free", "Premium", "Gold"
// },

 planName: {
    type: String, // Free, Premium, etc.
    // default: "Free"
  },
  planCreatedAt: {
    type: Date,
    default: Date.now
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  reason: { type: String, default: null, trim: true },

  isDeleted: { type: Boolean, default: false },
  deletionReason: { type: String, default: null, trim: true },
  deletionDate: { type: Date, default: null },

  alternatePhone: { type: String },

    displayContact: {
    type: String,
    default: function() {
      return this.phoneNumber; // Default to owner's number
    }
  },

 planStatus: {
  type:Boolean
 },

onDemand: {
  type: Boolean,
  default: false
},

onDemandSetBy: {
  name: { type: String, default: null },
  date: { type: Date, default: null }
},

// ✅ City base: 'PY' = Pondicherry, 'CH' = Chennai.
// Default 'PY' because the platform launched in Pondicherry; legacy
// documents without this field are treated as 'PY' by the base filter.
base: {
  type: String,
  enum: ['PY', 'CH'],
  default: 'PY'
}


}, {
  timestamps: true,

});

AddSchema.pre('validate', async function (next) {
  if (!this.isNew) {
    const original = await this.constructor.findOne({ _id: this._id }).lean();
    this._originalStatus = original?.status || null;
  }
  next();
});


AddSchema.pre('save', function (next) {
  const allowedOverride = ['delete', 'pending', 'expired','complete'];

  if (this.isModified('status') && this._originalStatus === 'active') {
    if (!allowedOverride.includes(this.status)) {
      this.status = 'active'; // prevent override
    }
  }

  next();
});


AddSchema.methods.addFavoriteRequest = function (userPhone) {
  // Check if the user has already removed this property before
  const removedIndex = this.favoriteRemoved.findIndex(fav => fav.phoneNumber === userPhone);
  if (removedIndex !== -1) {
    this.favoriteRemoved.splice(removedIndex, 1); // Remove from favoriteRemoved
  }

  // Add to favoriteRequests only if not already in the list
  if (!this.favoriteRequests.some(fav => fav.phoneNumber === userPhone)) {
    this.favoriteRequests.push({ phoneNumber: userPhone });
  }

  return this.save();
};

AddSchema.methods.removeFavoriteRequest = function (userPhone) {
  // Remove from favoriteRequests
  this.favoriteRequests = this.favoriteRequests.filter(fav => fav.phoneNumber !== userPhone);

  // Add to favoriteRemoved
  this.favoriteRemoved.push({ phoneNumber: userPhone });

  return this.save();
};


AddSchema.pre('save', function (next) {
  // Clean direct phone fields
  if (this.phoneNumber) this.phoneNumber = this.phoneNumber.replace(/\s+/g, '');
  if (this.alternatePhone) this.alternatePhone = this.alternatePhone.replace(/\s+/g, '');

  // Clean nested arrays with phoneNumber
  const cleanPhoneArray = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (item.phoneNumber) item.phoneNumber = item.phoneNumber.replace(/\s+/g, '');
      });
    }
  };

  cleanPhoneArray(this.interestRequests);
  cleanPhoneArray(this.soldOutReport);
  cleanPhoneArray(this.helpRequests);
  cleanPhoneArray(this.reportProperty);
  cleanPhoneArray(this.contactRequests);
  cleanPhoneArray(this.alreadySaved);
  cleanPhoneArray(this.favoriteRemoved);
  cleanPhoneArray(this.favoriteRequests);

  // Prevent status override if not allowed
  const allowedOverride = ['delete', 'pending', 'expired', 'complete'];
  if (this.isModified('status') && this._originalStatus === 'active') {
    if (!allowedOverride.includes(this.status)) {
      this.status = 'active';
    }
  }

  next();
});


// AddSchema.statics.removePhoneNumberFromAllFields = async function(phoneNumber) {
//   const phone = phoneNumber.trim();

//   const update = {
//     $pull: {
//       interestRequests: { phoneNumber: phone },
//       soldOutReport: { phoneNumber: phone },
//       helpRequests: { phoneNumber: phone },
//       reportProperty: { phoneNumber: phone },
//       contactRequests: { phoneNumber: phone },
//       alreadySaved: { phoneNumber: phone },
//       favoriteRemoved: { phoneNumber: phone },
//       favoriteRequests: { phoneNumber: phone },
//     }
//   };

//   // Update all documents where any of these fields contain the phone number
//   const result = await this.updateMany(
//     {
//       $or: [
//         { "interestRequests.phoneNumber": phone },
//         { "soldOutReport.phoneNumber": phone },
//         { "helpRequests.phoneNumber": phone },
//         { "reportProperty.phoneNumber": phone },
//         { "contactRequests.phoneNumber": phone },
//         { "alreadySaved.phoneNumber": phone },
//         { "favoriteRemoved.phoneNumber": phone },
//         { "favoriteRequests.phoneNumber": phone },
//       ]
//     },
//     update
//   );

//   return result;
// };


// City-base tagging: stamp `base` (PY/CH) on creation (and on any doc that has
// not been tagged yet). A PY/CH-scoped admin forces their own city; otherwise
// the city is auto-classified from the property's address. Existing docs keep
// their stored base, so this is backwards-compatible.
AddSchema.pre('save', function (next) {
  if (this.isNew || !this.base) {
    this.base = resolveBaseForSave(getScopedBase(), this);
  }
  next();
});

// City-base scope: every list/count/aggregate query is auto-filtered to the
// request's active base (ALL/PY/CH). See utils/cityScopePlugin.js.
AddSchema.plugin(cityScopePlugin);

module.exports = mongoose.model('AddModel', AddSchema);




