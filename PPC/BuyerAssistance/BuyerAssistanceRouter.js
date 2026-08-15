

const express = require("express");
const router = express.Router();
const moment = require('moment');

const BuyerAssistance = require("../BuyerAssistance/BuyerAssistanceModel");
const AddModel = require('../AddModel');
const NotificationUser = require('../Notification/NotificationDetailModel');
const PricingPlans = require('../plans/PricingPlanModel');
const Bill = require('../CreateBill/BillModel');
const FollowUp = require('../FollowUp/FollowUpModel'); // Import your model
const PaymentPayUBuyer =require('../PayuBuyer/PayuBuyerModel')
const BuyerPlan = require('../BuyerPlan/BuyerModel');  // adjust path if needed



router.get('/buyer-assistance-summary', async (req, res) => {
  try {
    const allBA = await BuyerAssistance.find({ isDeleted: false }).sort({ createdAt: -1 });

    const summaryMap = {};

    allBA.forEach((ba) => {
      const phone = ba.phoneNumber;

      if (!summaryMap[phone]) {
        summaryMap[phone] = {
          phoneNumber: phone,
          entries: [{
            ba_id: ba.ba_id,
            baName: ba.baName,
            ba_postBy: ba.ba_postBy, // ✅ Include ba_postBy
            createdAt: ba.createdAt,
            updatedAt: ba.updatedAt,
          }],
          count: 1
        };
      } else {
        summaryMap[phone].entries.push({
          ba_id: ba.ba_id,
          baName: ba.baName,
          ba_postBy: ba.ba_postBy, // ✅ Include ba_postBy
          createdAt: ba.createdAt,
          updatedAt: ba.updatedAt,
        });
        summaryMap[phone].count += 1;
      }
    });

    const summaryArray = Object.values(summaryMap).map(entry => ({
      phoneNumber: entry.phoneNumber,
      count: entry.count,
      entries: entry.entries.map(e => ({
        ba_id: e.ba_id,
        baName: e.baName,
        ba_postBy: e.ba_postBy, // ✅ Include ba_postBy in response
        createdAt: new Date(e.createdAt).toLocaleDateString("en-GB"),
        updatedAt: new Date(e.updatedAt).toLocaleDateString("en-GB"),
      }))
    }));

    res.status(200).json({ success: true, data: summaryArray });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// Fetch by phone number
router.get('/buyer-assistance-by-phone/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const buyerAssistances = await BuyerAssistance.find({ phoneNumber, isDeleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: buyerAssistances
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.get('/buyer-assistance-count-by-user', async (req, res) => {
  try {
    const buyerAssistances = await BuyerAssistance.find({ isDeleted: false }); // Optional: ignore soft-deleted

    const baCountByUser = buyerAssistances.reduce((acc, item) => {
      const phone = item.phoneNumber;
      if (!acc[phone]) {
        acc[phone] = 1;
      } else {
        acc[phone]++;
      }
      return acc;
    }, {});

    const baCountArray = Object.entries(baCountByUser).map(([phoneNumber, adsCount]) => ({
      phoneNumber,
      adsCount,
    }));

    res.status(200).json({
      message: 'Buyer assistance ad count per user fetched successfully!',
      data: baCountArray,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch buyer assistance ad counts',
      error: error.message,
    });
  }
});


router.get("/fetch-buyerAssistances", async (req, res) => {
  try {
    const { phoneNumber } = req.query; // Optional phoneNumber filter

    // 1. Base query for buyer assistance requests
    const baQuery = phoneNumber ? { phoneNumber } : {};
    const requests = await BuyerAssistance.find(baQuery);

    // 2. Get unique identifiers
    const userPhoneNumbers = [...new Set(requests.map(r => r.phoneNumber))];
    const ppcIds = [...new Set(requests.map(r => r.ppcId))];

    // 3. Fetch all related data in parallel
    const [properties, plans, bills, followups] = await Promise.all([
      AddModel.find({ ppcId: { $in: ppcIds } }),
      PricingPlans.find({ phoneNumber: { $in: userPhoneNumbers } }),
      Bill.find({ 
        $or: [
          { ownerPhone: { $in: userPhoneNumbers } },
          { ppId: { $in: ppcIds } }
        ]
      }),
      FollowUp.find({ ppcId: { $in: ppcIds } })
    ]);

    // 4. Helper functions
    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';
    
    const calculateExpiry = (startDate, durationDays) => {
      if (!startDate || !durationDays) return 'N/A';
      const expiry = new Date(startDate);
      expiry.setDate(expiry.getDate() + Number(durationDays));
      return formatDate(expiry);
    };

    // 5. Process each request
    const enhancedRequests = requests.map(request => {
      const property = properties.find(p => p.ppcId === request.ppcId) || {};
      const userPlan = plans.find(p => 
        Array.isArray(p.phoneNumber) 
          ? p.phoneNumber.includes(request.phoneNumber)
          : p.phoneNumber === request.phoneNumber
      );
      const propertyBill = bills.find(b => 
        b.ppId === request.ppcId || b.ownerPhone === request.phoneNumber
      );
      const propertyFollowups = followups
        .filter(f => String(f.ppcId) === String(request.ppcId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Plan details (e.g., Gold plan with 60 days duration)
      const planDetails = userPlan ? {
        planName: userPlan.name || 'N/A',
        planType: userPlan.packageType || 'N/A',
        planCreatedAt: formatDate(userPlan.createdAt),
        planDuration: `${userPlan.durationDays || 0} days`,
        planExpiry: calculateExpiry(userPlan.createdAt, userPlan.durationDays),
        planCreatedBy: userPlan.createdBy || 'System'
      } : {
        planName: 'No Plan',
        planType: 'N/A',
        planCreatedAt: 'N/A',
        planDuration: '0 days',
        planExpiry: 'N/A',
        planCreatedBy: 'N/A'
      };

      // Bill details
      const billDetails = propertyBill ? {
        billNo: propertyBill.billNo || 'N/A',
        billAmount: propertyBill.amount || 'N/A',
        billDate: formatDate(propertyBill.billDate),
        billExpiry: calculateExpiry(propertyBill.billDate, propertyBill.validity),
        billCreatedAt: formatDate(propertyBill.createdAt),
        billCreatedBy: propertyBill.createdBy || 'Admin',
        billStatus: propertyBill.status || 'N/A'
      } : {
        billNo: 'N/A',
        billAmount: 'N/A',
        billDate: 'N/A',
        billExpiry: 'N/A',
        billCreatedAt: 'N/A',
        billCreatedBy: 'N/A',
        billStatus: 'N/A'
      };

      // Followup details
      const latestFollowup = propertyFollowups[0] || {};
      const followupDetails = {
        lastFollowupAt: formatDate(latestFollowup.createdAt),
        lastFollowupBy: latestFollowup.adminName || 'N/A',
        followupStatus: latestFollowup.status || 'N/A',
        remarks: latestFollowup.remarks || 'N/A'
      };

      return {
        // Buyer Assistance details
        _id: request._id,
        ba_status: request.ba_status,
        createdAt: formatDate(request.createdAt),
        
        // User details
        phoneNumber: request.phoneNumber,
        
        // Property details
        property: {
          ppcId: request.ppcId,
          type: property.propertyType || 'N/A',
          price: property.price || 'N/A',
          status: property.status || 'N/A'
        },
        
        // Enhanced plan details (e.g., Gold plan)
        plan: planDetails,
        
        // Enhanced bill details
        bill: billDetails,
        
        // Followup details
        followup: followupDetails
      };
    });

    // 6. Calculate statistics
    const statusCounts = requests.reduce((acc, req) => {
      acc[req.ba_status] = (acc[req.ba_status] || 0) + 1;
      return acc;
    }, {});

    // 7. Prepare response
    const response = {
      success: true,
      message: phoneNumber 
        ? `Buyer assistance data for ${phoneNumber}`
        : "All buyer assistance records",
      stats: {
        total: requests.length,
        ...statusCounts,
        ba_active: statusCounts.ba_active || 0
      },
      data: enhancedRequests
    };

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer assistance data",
      error: error.message
    });
  }
});




router.get("/get-buyerAssistance", async (req, res) => {
  const { phoneNumber } = req.query; // Extract phoneNumber from query

  try {
    // 1. Fetch Buyer Assistance requests
    const requests = await BuyerAssistance.find({ phoneNumber });

    // 2. Fetch the user's plan details
    const userPlan = await PricingPlans.findOne({ phoneNumber });

    let planName = 'N/A';
    let planCreatedAt = 'N/A';
    let durationDays = 0;
    let planExpiryDate = 'N/A';
    let packageType = 'N/A';

    if (userPlan) {
      planName = userPlan.name || 'N/A';
      
      planCreatedAt = userPlan.createdAt
      ? new Date(userPlan.createdAt).toLocaleDateString()
      : 'N/A';
      
      durationDays = userPlan.durationDays || 0;
      packageType = userPlan.packageType || 'N/A';

      // Calculate expiry date
      if (userPlan.createdAt && userPlan.durationDays) {
        const expiryDate = new Date(userPlan.createdAt);
        expiryDate.setDate(expiryDate.getDate() + durationDays);
        planExpiryDate = new Date(expiryDate).toLocaleDateString();        
      }
    }

    // Send success response
    res.status(200).json({
      message: `Buyer Assistance requests and Plan details fetched for phone number: ${phoneNumber}`,
      planDetails: {
        planName,
        planCreatedAt, // Properly formatted creation date
        durationDays,
        planExpiryDate, // Properly formatted expiry date
        packageType,
      },
      data: requests, // Buyer Assistance requests
    });

  } catch (error) {

    // Handle server errors
    res.status(500).json({
      message: "Error fetching Buyer Assistance requests by phone number",
      error: error.message,
    });
  }
});



router.post('/contact-buyer-send', async (req, res) => {
  const { phoneNumber, ba_id } = req.body;

  try {
    // Search by ba_id as a number
    const buyer = await BuyerAssistance.findOne({ ba_id });

    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer entry not found' });
    }

    const updatedBuyer = await BuyerAssistance.findOneAndUpdate(
      { ba_id },  // Use ba_id in the query
      {
        $set: { callStatus: 'contacted', updatedAt: new Date() },
        $push: { callLogs: { phoneNumber, createdAt: new Date() } }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Buyer contacted successfully!',
      buyerDetails: {
        buyerName: updatedBuyer.baName,
        phoneNumber: updatedBuyer.phoneNumber,
        ppcId: updatedBuyer.ppcId,
        status: updatedBuyer.callStatus
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


router.get("/buyer-assistance-interests-phone", async (req, res) => {
  try {
    const { phone } = req.query;
    const filter = { ba_status: "buyer-assistance-interest" };
    if (phone) filter.interestedUserPhone = phone;

    const assistanceInterests = await BuyerAssistance.find(filter);

    if (!assistanceInterests.length) {
      return res.status(404).json({ message: "No buyer assistance interests found" });
    }

    res.status(200).json({
      message: "Buyer assistance interests fetched successfully",
      data: assistanceInterests,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Count buyer assistance interests for a phone number
router.get("/buyer-assistance-interests-phone/count", async (req, res) => {
  try {
    const { phone } = req.query;
    const filter = { ba_status: "buyer-assistance-interest" };
    if (phone) filter.interestedUserPhone = phone;

    const count = await BuyerAssistance.countDocuments(filter);

    res.status(200).json({
      message: "Buyer assistance interest count fetched successfully",
      count,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/matched-properties-by-phone/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // 🔹 Find the buyer's request using phoneNumber
    const buyerRequest = await BuyerAssistance.findOne({ phoneNumber });
    if (!buyerRequest) {
      return res.status(404).json({ success: false, message: "Buyer request not found" });
    }

    // 🔹 Construct search query based on buyer preferences
    const query = {
      propertyType: buyerRequest.propertyType,
      propertyMode: buyerRequest.propertyMode,
      city: buyerRequest.city,
      state: buyerRequest.state,
      district: buyerRequest.district,
      area: buyerRequest.area,
      price: {
        $gte: buyerRequest.minPrice ? parseInt(buyerRequest.minPrice) : 0,
        $lte: buyerRequest.maxPrice ? parseInt(buyerRequest.maxPrice) : Infinity,
      },
      bedrooms: buyerRequest.noOfBHK,
      areaUnit: buyerRequest.areaUnit,
      propertyAge: buyerRequest.propertyAge,
      propertyApproved: buyerRequest.propertyApproved,
      facing: buyerRequest.facing,
      bankLoan: buyerRequest.bankLoan,
    };

    // 🔹 Remove undefined/null fields from the query
    Object.keys(query).forEach((key) => {
      if (!query[key]) delete query[key];
    });

    // 🔹 Fetch matching properties
    const matchedProperties = await AddModel.find(query);

    return res.json({ success: true, buyerId: buyerRequest._id, matchedProperties });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/fetch-all-data/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;

    // 🔹 Find the buyer's request using buyerId
    const buyerRequest = await BuyerAssistance.findById(buyerId);
    if (!buyerRequest) {
      return res.status(404).json({ success: false, message: "Buyer request not found" });
    }

    // 🔹 Construct search query based on buyer's preferences
    let query = {
      propertyType: buyerRequest.propertyType,
      propertyMode: buyerRequest.propertyMode,
      city: buyerRequest.city,
      area: buyerRequest.area,
      price: {
        $gte: buyerRequest.minPrice ? parseInt(buyerRequest.minPrice) : 0,  
        $lte: buyerRequest.maxPrice ? parseInt(buyerRequest.maxPrice) : Infinity,
      },
    };

    // 🔹 Remove empty fields from the query
    Object.keys(query).forEach((key) => {
      if (query[key] === undefined || query[key] === null) {
        delete query[key];
      }
    });


    // 🔹 Fetch matched properties
    const matchedProperties = await AddModel.find(query).select(
      "ppcId price phoneNumber propertyMode propertyType city area"
    );


    return res.json({ success: true, message: "Matched properties fetched successfully!", matchedProperties });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});



router.get("/get-buyer-id/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // 🔹 Find the buyer request using phoneNumber
    const buyer = await BuyerAssistance.findOne({ phoneNumber });

    if (!buyer) {
      return res.status(404).json({ success: false, message: "Buyer not found" });
    }

    return res.json({ success: true, buyerId: buyer._id });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});




router.post("/add-buyerAssistance", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    let formattedPhoneNumber = phoneNumber.replace(/^\+91/, "").trim();

    // Always generate a new ba_id
    let lastRecord = await BuyerAssistance.findOne({}, { ba_id: 1 }).sort({ ba_id: -1 });
    let newBaId = lastRecord && lastRecord.ba_id ? lastRecord.ba_id + 1 : 100;

    const newRequest = new BuyerAssistance({ 
      ...req.body, 
      baName: req.body.baName || "Buyer",
      phoneNumber: formattedPhoneNumber,
      ba_id: newBaId,
       ba_postBy: req.body.ba_postBy || "User", // <-- ADD THIS

    });

    await newRequest.save();

    // Notify Admin/Support
    await NotificationUser.create({
      recipientPhoneNumber: "admin",
      senderPhoneNumber: formattedPhoneNumber,
      message: `New buyer assistance request submitted by ${formattedPhoneNumber}`,
      createdAt: new Date(),
    });

    // Find matched properties
    const matchedProperties = await AddModel.find({
      propertyMode: newRequest.propertyMode,
      propertyType: newRequest.propertyType,
      city: newRequest.city,
      area: newRequest.area,
      facing: newRequest.facing,
      price: {
        $gte: Number(newRequest.minPrice),
        $lte: Number(newRequest.maxPrice)
      }
    });

    // 🔔 Notify matching owners
    for (let property of matchedProperties) {
      await NotificationUser.create({
        recipientPhoneNumber: property.phoneNumber,
        senderPhoneNumber: formattedPhoneNumber,
        message: `A new buyer request matches your property in ${property.area} (${property.propertyType})`,
        createdAt: new Date(),
      });
    }

    // 🔔 Notify the buyer (if matching properties found)
    if (matchedProperties.length > 0) {
      await NotificationUser.create({
        recipientPhoneNumber: formattedPhoneNumber,
        senderPhoneNumber: "system",
        message: `We found ${matchedProperties.length} matching property(s) for your request in ${newRequest.area} (${newRequest.propertyType}). Check them out now!`,
        createdAt: new Date(),
      });
    }

    res.status(201).json({ 
      message: "Buyer Assistance request added successfully!", 
      data: newRequest 
    });

  } catch (error) {
    res.status(500).json({ message: "Error adding Buyer Assistance request", error });
  }
});





router.post("/add-buyerAssistance-admin", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    let formattedPhoneNumber = phoneNumber.replace(/^\+91/, "").trim();

    // Always generate a new ba_id
    let lastRecord = await BuyerAssistance.findOne({}, { ba_id: 1 }).sort({ ba_id: -1 });
    let newBaId = lastRecord && lastRecord.ba_id ? lastRecord.ba_id + 1 : 100;

    const newRequest = new BuyerAssistance({ 
      ...req.body, 
      baName: req.body.baName || "Buyer",
      phoneNumber: formattedPhoneNumber,
      ba_id: newBaId,
       ba_postBy: req.body.ba_postBy || "Admin", // <-- ADD THIS

    });

    await newRequest.save();

    // Notify Admin/Support
    await NotificationUser.create({
      recipientPhoneNumber: "admin",
      senderPhoneNumber: formattedPhoneNumber,
      message: `New buyer assistance request submitted by ${formattedPhoneNumber}`,
      createdAt: new Date(),
    });

    // Find matched properties
    const matchedProperties = await AddModel.find({
      propertyMode: newRequest.propertyMode,
      propertyType: newRequest.propertyType,
      city: newRequest.city,
      area: newRequest.area,
      facing: newRequest.facing,
      price: {
        $gte: Number(newRequest.minPrice),
        $lte: Number(newRequest.maxPrice)
      }
    });

    // 🔔 Notify matching owners
    for (let property of matchedProperties) {
      await NotificationUser.create({
        recipientPhoneNumber: property.phoneNumber,
        senderPhoneNumber: formattedPhoneNumber,
        message: `A new buyer request matches your property in ${property.area} (${property.propertyType})`,
        createdAt: new Date(),
      });
    }

    // 🔔 Notify the buyer (if matching properties found)
    if (matchedProperties.length > 0) {
      await NotificationUser.create({
        recipientPhoneNumber: formattedPhoneNumber,
        senderPhoneNumber: "system",
        message: `We found ${matchedProperties.length} matching property(s) for your request in ${newRequest.area} (${newRequest.propertyType}). Check them out now!`,
        createdAt: new Date(),
      });
    }

    res.status(201).json({ 
      message: "Buyer Assistance request added successfully!", 
      data: newRequest 
    });

  } catch (error) {
    res.status(500).json({ message: "Error adding Buyer Assistance request", error });
  }
});




// Update the status of a buyer assistance request
router.put("/update-buyerAssistance-status/:id", async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body; // Expected: { newStatus: "baActive" or "baPending" }

  try {
    // Find the request and update its status
    const updatedRequest = await BuyerAssistance.findByIdAndUpdate(
      id,
      { ba_status: newStatus },
      { new: true } // Return the updated document
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});




router.get("/get-buyerAssistance-all", async (req, res) => {
  try {
    const buyerAssistances = await BuyerAssistance.find({ isDeleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Buyer Assistance data fetched successfully!",
      data: buyerAssistances
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Buyer Assistance data", error });
  }
});



router.get("/buyer-assistance-count", async (req, res) => {
  try {
    const count = await BuyerAssistance.countDocuments();
    res.status(200).json({
      message: "Total buyer assistance count fetched successfully",
      count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching buyer assistance count",
      error: error.message,
    });
  }
});



router.post('/get-matched-property', async (req, res) => {
  try {
    const { ba_id, phoneNumber } = req.body;

    if (!ba_id && !phoneNumber) {
      return res.status(400).json({ success: false, message: "Either ba_id or phoneNumber must be provided" });
    }

    // Fetch Buyer Assistance data based on ba_id or phoneNumber
    let buyerAssistance = null;
    if (ba_id) {
      buyerAssistance = await BuyerAssistance.findOne({ ba_id });
    } else if (phoneNumber) {
      buyerAssistance = await BuyerAssistance.findOne({ phoneNumber });
    }

    if (!buyerAssistance) {
      return res.status(404).json({ success: false, message: "Buyer Assistance data not found" });
    }

    // Now match property using the phoneNumber from the Buyer Assistance data
    const matchedProperty = await AddModel.findOne({ phoneNumber: buyerAssistance.phoneNumber });

    if (!matchedProperty) {
      return res.status(404).json({ success: false, message: "Property not found for this buyer" });
    }

    // You can return the matched property data along with buyer assistance details
    return res.status(200).json({
      success: true,
      message: "Matched property found",
      matchedBuyerAssistance: {
        ba_id: buyerAssistance.ba_id,
        baName: buyerAssistance.baName,
        phoneNumber: buyerAssistance.phoneNumber,
        city: buyerAssistance.city,
        area: buyerAssistance.area,
        minPrice: buyerAssistance.minPrice,
        maxPrice: buyerAssistance.maxPrice,
        propertyType: buyerAssistance.propertyType,
        propertyMode: buyerAssistance.propertyMode,
      },
      matchedProperty: {
        ppcId: matchedProperty.ppcId,
        price: matchedProperty.price,
        status: matchedProperty.status,
        areaUnit: matchedProperty.areaUnit,
        totalArea: matchedProperty.totalArea,
        propertyMode: matchedProperty.propertyMode,
        propertyType: matchedProperty.propertyType,
        facing: matchedProperty.facing,
        city: matchedProperty.city,
        district: matchedProperty.district,
        area: matchedProperty.area,
        email: matchedProperty.email,
        phoneNumber: matchedProperty.phoneNumber,
        ownerName: matchedProperty.ownerName,
        photos: matchedProperty.photos,
        video: matchedProperty.video,
        createdAt: matchedProperty.createdAt,
        updatedAt: matchedProperty.updatedAt,
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});




// Get All Buyer Assistance Requests with baActive status
router.get("/get-buyerAssistances", async (req, res) => {
  try {
    // Fetch only requests with ba_status: "baActive" that haven't been
    // soft-deleted. Soft-deleted records live in Removed Buyer Assistant.
    const requests = await BuyerAssistance.find({
      ba_status: "baActive",
      isDeleted: { $ne: true },
    });

    res.status(200).json({
      message: "All 'baActive' Buyer Assistance requests fetched successfully!",
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Buyer Assistance requests", error });
  }
});

// Get count of all Buyer Assistance requests with ba_status: "baActive"
router.get("/get-buyerAssistances-count", async (req, res) => {
  try {
    const count = await BuyerAssistance.countDocuments({ ba_status: "baActive" });

    res.status(200).json({
      message: "Total 'baActive' Buyer Assistance requests count fetched successfully!",
      totalCount: count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Buyer Assistance request count",
      error,
    });
  }
});



router.get("/buyer-assistance-with-payment/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    const normalizedPhone = phoneNumber
      .replace(/[\s-]/g, "")
      .replace(/^(\+91|91|0)/, "")
      .trim();

    const buyerAssistances = await BuyerAssistance.find({
      phoneNumber: new RegExp(`${normalizedPhone}$`, "i"),
    });

    if (!buyerAssistances.length) {
      return res.status(404).json({ message: "No Buyer Assistance requests found for this phone number" });
    }

    const payments = await PaymentPayUBuyer.find().sort({ createdAt: -1 });

    const latestStatusByBaId = {};
    for (let payment of payments) {
      if (payment.ba_id && !latestStatusByBaId[payment.ba_id]) {
        latestStatusByBaId[payment.ba_id] = payment.payustatususer.toLowerCase();
      }
    }

    const mergedData = buyerAssistances.map((ba) => {
      const status = latestStatusByBaId[ba.ba_id] || "pay now";
      return {
        ba_id: ba.ba_id,
        baName: ba.baName,
        phoneNumber: ba.phoneNumber,
        city: ba.city,
        area: ba.area,
        minPrice: ba.minPrice,
        maxPrice: ba.maxPrice,
        propertyMode: ba.propertyMode,
        propertyType: ba.propertyType,
        facing: ba.facing,
        ba_status: ba.ba_status,
        createdAt: ba.createdAt,
        updatedAt: ba.updatedAt,
        payustatususer: status,
        showPayNowButton: status !== "paid"
      };
    });

    res.status(200).json({
      message: "Buyer Assistance data with payment status fetched successfully",
      phoneNumber,
      data: mergedData,
    });
  } catch (error) {
    console.error("Error fetching merged Buyer Assistance and payment data:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});



// Get Buyer Assistance Requests by Phone Number
router.get("/get-user-buyerAssistance/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const requests = await BuyerAssistance.find({ phoneNumber });
    res.status(200).json({
      message: `Buyer Assistance requests fetched for phone number: ${phoneNumber}`,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Buyer Assistance requests by phone number",
      error,
    });
  }
});

router.get("/get-user-buyerAssistance-count/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const count = await BuyerAssistance.countDocuments({
      phoneNumber: { $exists: true, $eq: phoneNumber }, // Explicit filter
    });

    res.status(200).json({
      message: `Buyer Assistance request count fetched for phone number: ${phoneNumber}`,
      count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Buyer Assistance request count by phone number",
      error,
    });
  }
});
















router.get("/get-buyerAssistance-all-plans", async (req, res) => {
  try {
    // 1. Fetch all Buyer Assistance requests
    const requests = await BuyerAssistance.find();

    // 2. Create a set of unique phone numbers from the requests
    const phoneNumbers = [...new Set(requests.map(req => req.phoneNumber))];

    // 3. Fetch all user plans matching those phone numbers
    const plans = await PricingPlans.find({ phoneNumber: { $in: phoneNumbers } });

    // 4. Create a map for quick lookup of plan by phone number
    const planMap = {};
    plans.forEach(plan => {
      const expiryDate = new Date(plan.createdAt);
      expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 0));
      planMap[plan.phoneNumber] = {
        planName: plan.name || 'N/A',
        planCreatedAt: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A',
        durationDays: plan.durationDays || 0,
        planExpiryDate: expiryDate.toLocaleDateString(),
        packageType: plan.packageType || 'N/A',
      };
    });

    // 5. Combine each request with its plan info
    const enrichedData = requests.map(req => ({
      ...req._doc,
      planDetails: planMap[req.phoneNumber] || {
        planName: 'N/A',
        planCreatedAt: 'N/A',
        durationDays: 0,
        planExpiryDate: 'N/A',
        packageType: 'N/A',
      }
    }));

    // 6. Send response
    res.status(200).json({
      message: "All Buyer Assistance requests with plan details fetched",
      data: enrichedData,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching all Buyer Assistance requests",
      error: error.message,
    });
  }
});



router.get("/baActive-buyerAssistance-all-plans", async (req, res) => {
  try {
    // 1. Fetch only Buyer Assistance requests with "baActive" status
    const requests = await BuyerAssistance.find({ ba_status: "baActive" });

    // 2. Create a set of unique phone numbers from the requests
    const phoneNumbers = [...new Set(requests.map(req => req.phoneNumber))];

    // 3. Fetch all user plans matching those phone numbers
    const plans = await PricingPlans.find({ phoneNumber: { $in: phoneNumbers } });

    // 4. Create a map for quick lookup of plan by phone number
    const planMap = {};
    plans.forEach(plan => {
      const expiryDate = new Date(plan.createdAt);
      expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 0));
      planMap[plan.phoneNumber] = {
        planName: plan.name || 'N/A',
        planCreatedAt: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A',
        durationDays: plan.durationDays || 0,
        planExpiryDate: expiryDate.toLocaleDateString(),
        packageType: plan.packageType || 'N/A',
      };
    });

    // 5. Combine each request with its plan info
    const enrichedData = requests.map(req => ({
      ...req._doc,
      planDetails: planMap[req.phoneNumber] || {
        planName: 'N/A',
        planCreatedAt: 'N/A',
        durationDays: 0,
        planExpiryDate: 'N/A',
        packageType: 'N/A',
      }
    }));

    // 6. Send response
    res.status(200).json({
      message: "All Buyer Assistance requests with 'baActive' status and plan details fetched",
      data: enrichedData,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching all Buyer Assistance requests",
      error: error.message,
    });
  }
});





// Get count of Buyer Assistance Requests by Phone Number
router.get("/count-buyerAssistance/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const count = await BuyerAssistance.countDocuments({ phoneNumber });
    res.status(200).json({
      message: `Buyer Assistance request count fetched for phone number: ${phoneNumber}`,
      count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Buyer Assistance request count by phone number",
      error,
    });
  }
});



// ✅ PUT: Update Buyer Assistance by ba_id (Number), not Mongo _id
router.put("/update-buyer-Assistance/:ba_id", async (req, res) => {
  try {
    const baId = Number(req.params.ba_id); // Convert to Number

    if (isNaN(baId)) {
      return res.status(400).json({ message: "Invalid ba_id. Must be a number." });
    }

    const updatedRequest = await BuyerAssistance.findOneAndUpdate(
      { ba_id: baId },
      req.body,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance request updated successfully!",
      data: updatedRequest
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating Buyer Assistance request", error });
  }
});


router.put("/update-buyerAssistance/:id", async (req, res) => {
  try {
    const updatedRequest = await BuyerAssistance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Buyer Assistance request updated successfully!", data: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error updating Buyer Assistance request", error });
  }
});




// Delete Buyer Assistance
router.delete("/delete-buyerAssistance/:id", async (req, res) => {
  try {
    const deletedRequest = await BuyerAssistance.findByIdAndDelete(req.params.id);
    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({
      message: "Buyer Assistance request deleted successfully!",
      data: deletedRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Buyer Assistance request",
      error,
    });
  }
});


// Update Buyer Assistance using Phone Number
router.put("/update-buyerAssistance-phone/:phoneNumber", async (req, res) => {
  try {
    const updatedRequest = await BuyerAssistance.findOneAndUpdate(
      { phoneNumber: req.params.phoneNumber },
      req.body,
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Buyer Assistance request updated successfully!", data: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error updating Buyer Assistance request", error });
  }
});




router.get("/fetch-matching-property", async (req, res) => {
  try {
    const { ba_id } = req.query;

    if (!ba_id) {
      return res.status(400).json({ message: "Buyer Assistance ID is required" });
    }

    const buyerRequest = await BuyerAssistance.findOne({ ba_id: ba_id });

    if (!buyerRequest) {
      return res.status(404).json({ message: "No Buyer Assistance request found for this ID" });
    }

    const { propertyMode, propertyType, minPrice, maxPrice, city, area, facing } = buyerRequest;

    const query = {
      propertyMode: propertyMode,
      propertyType: propertyType,
      city: city,
      area: area,
      facing: facing,
      price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) }, // Convert price range to numbers
      // status: { $in: ["active", "incomplete"] }, // Allow "incomplete" properties
    };


    const matchingProperties = await AddModel.find(query);

    if (matchingProperties.length === 0) {
      return res.status(404).json({ message: "No matching properties found" });
    }

    res.status(200).json({
      message: "Matching properties fetched successfully!",
      data: matchingProperties,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



router.get("/fetch-matched-properties", async (req, res) => {
  try {
    const { ba_id } = req.query;

    if (!ba_id) {
      return res.status(400).json({ message: "Buyer Assistance ID is required" });
    }

    // Fetch Buyer Assistance Request Data
    const buyerRequest = await BuyerAssistance.findOne({ ba_id: ba_id });
    if (!buyerRequest) {
      return res.status(404).json({ message: "No Buyer Assistance request found for this ID" });
    }

    const {
      phoneNumber: buyerPhoneNumber,
      propertyMode,
      propertyType,
      minPrice,
      maxPrice,
      city,
      area,
      facing
    } = buyerRequest;

    // 1️⃣ Fetch Buyer-Matched Properties (Properties posted by this buyer that match the buyer assistance request)
    const buyerMatchedProperties = await AddModel.find({
      phoneNumber: buyerPhoneNumber, // Owner's posted properties
      propertyMode: propertyMode,
      propertyType: propertyType,
      city: city,
      area: area,
      facing: facing,
      price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
      status: { $in: ["active", "incomplete"] },
    });

    // 2️⃣ Fetch Owner-Matched Properties (Properties that match this buyer assistance request)
    const ownerMatchedProperties = await AddModel.find({
      propertyMode: propertyMode,
      propertyType: propertyType,
      city: city,
      area: area,
      facing: facing,
      price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
      status: { $in: ["active", "incomplete"] },
    });

    res.status(200).json({
      message: "Matching properties fetched successfully!",
      buyerMatchedProperties: buyerMatchedProperties,
      ownerMatchedProperties: ownerMatchedProperties,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



router.get("/fetch-buyer-matched-properties-by-phone", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Fetch Properties Posted by This User
    const ownerProperties = await AddModel.find({
      $or: [
        { phoneNumber: phoneNumber },
        { phoneNumber: `+${phoneNumber}` },
      ]
    });


    if (!ownerProperties.length) {
      return res.status(404).json({ message: "No properties found for this user" });
    }

    // Extract unique property details
    const propertyConditions = ownerProperties.map(property => ({
      propertyMode: property.propertyMode,
      propertyType: property.propertyType,
      state: property.state,
      
      minPrice: { $lte: property.price },
      maxPrice: { $gte: property.price },
    }));


    // Fetch Buyer Assistance Requests that match these property details
    const matchedBuyerRequests = await BuyerAssistance.find({
      $or: propertyConditions,
      phoneNumber: { $ne: phoneNumber }
    });


    res.status(200).json({
      message: "Buyer-Matched Assistance Requests fetched successfully!",
      matchedBuyerRequests: matchedBuyerRequests,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});




router.put("/update-status-buyer-assistance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ba_status, userPhoneNumber } = req.body;

    if (!ba_status || !userPhoneNumber) {
      return res.status(400).json({ message: "Status and user phone number are required" });
    }

    if (!["buyer-assistance-interest"].includes(ba_status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ✅ Normalize phone number (Remove non-digits & keep last 10 digits)
    let normalizedUserPhone = userPhoneNumber.replace(/\D/g, "").slice(-10);

    // ✅ Update Buyer Assistance status and store user phone number
    const updatedAssistance = await BuyerAssistance.findByIdAndUpdate(
      id,
      {
        ba_status,
        interestedUserPhone: normalizedUserPhone, // Store user phone number
      },
      { new: true }
    );

    if (!updatedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance not found" });
    }

    res.status(200).json({
      message: `Buyer Assistance status updated to '${ba_status}' successfully!`,
      data: updatedAssistance,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/buyer-assistance-interests", async (req, res) => {
  try {
    const assistanceInterests = await BuyerAssistance.find({ ba_status: "buyer-assistance-interest" });

    if (!assistanceInterests.length) {
      return res.status(404).json({ message: "No buyer assistance interests found" });
    }

    res.status(200).json({
      message: "Buyer assistance interests fetched successfully",
      data: assistanceInterests, // Send full data
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



router.get("/fetch-buyerAssistance/:ba_id", async (req, res) => {
  const { ba_id } = req.params;

  if (!ba_id) {
    return res.status(400).json({ message: "BA ID is required" });
  }

  try {
    const request = await BuyerAssistance.findOne({ ba_id });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Buyer Assistance request fetched successfully!", data: request });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Buyer Assistance request", error });
  }
});



router.get("/fetch-matched-datas-buyer", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ message: "Buyer Assistance phone number is required" });
    }

    // Normalize the phone number
    const normalizedPhone = normalizePhone(phoneNumber);

    // Fetch all Buyer Assistance requests for this phone number
    const buyerRequests = await BuyerAssistance.find({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") },
    });

    if (!buyerRequests.length) {
      return res
        .status(404)
        .json({ message: "No Buyer Assistance requests found for this phone number" });
    }

    const matchedData = [];

    for (let buyerRequest of buyerRequests) {
      // Fetch matched properties
      const matchedProperties = await AddModel.find({
        propertyMode: buyerRequest.propertyMode,
        propertyType: buyerRequest.propertyType,
        // city: buyerRequest.city,
        // area: buyerRequest.area,
        // facing: buyerRequest.facing,
                    state:buyerRequest.state,

       
        price: {
          $gte: Number(buyerRequest.minPrice),
          $lte: Number(buyerRequest.maxPrice),
        },
      });

      // Only add buyer assistance with matched properties
      if (matchedProperties.length > 0) {
        matchedData.push({
          buyerAssistanceCard: {
            _id:buyerRequest._id,
            Ba_Id:buyerRequest.ba_id,
            name: buyerRequest.baName,
            phoneNumber: buyerRequest.phoneNumber,
            // city: buyerRequest.city,
            // area: buyerRequest.area,
            minPrice: buyerRequest.minPrice,
            maxPrice:buyerRequest.maxPrice,
            propertyType: buyerRequest.propertyType,
            // facing: buyerRequest.facing,
            propertyAge: buyerRequest.propertyAge,
            propertyMode: buyerRequest.propertyMode,
            paymentType: buyerRequest.paymentType,
            bankLoan: buyerRequest.bankLoan,
            state:buyerRequest.state,
          },
          matchedProperties: matchedProperties.map((property) => ({
            propertyId: property.ppcId,
            postedByUser: property.phoneNumber,
            price: property.price,
            // city: property.city,
            // area: property.area,
            state: property.state,
            propertyType: property.propertyType,
            // facing: property.facing,
            bedrooms:property.bedrooms,
        totalArea:property.totalArea,
        areaUnit:property.areaUnit,
        postedBy:property.postedBy,
        createdAt:property.createdAt,
          })),
        });
      }
    }

    if (matchedData.length === 0) {
      return res.status(404).json({ message: "No matched properties found" });
    }

    res.status(200).json({
      message: "Matched Data Fetched Successfully!",
      totalMatches: matchedData.length,
      data: matchedData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.get("/fetch-matched-datas-buyer-payment", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        message: "Buyer Assistance phone number is required"
      });
    }

    const normalizedPhone = normalizePhone(phoneNumber);

    const buyerRequests = await BuyerAssistance.find({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") },
    });

    if (!buyerRequests.length) {
      return res.status(404).json({
        message: "No Buyer Assistance requests found for this phone number"
      });
    }

    const matchedData = [];

    for (let buyerRequest of buyerRequests) {
      const paymentData = await PaymentPayUBuyer.findOne({ ba_id: buyerRequest.ba_id });
      const payustatususer = (paymentData?.payustatususer || "unpaid").toLowerCase();

      const matchedProperties = await AddModel.find({
        propertyMode: buyerRequest.propertyMode,
        propertyType: buyerRequest.propertyType,
        state: buyerRequest.state,
        price: {
          $gte: Number(buyerRequest.minPrice),
          $lte: Number(buyerRequest.maxPrice),
        },
      });

      if (matchedProperties.length > 0) {
        matchedData.push({
          buyerAssistanceCard: {
            _id: buyerRequest._id,
            Ba_Id: buyerRequest.ba_id,
            name: buyerRequest.baName,
            phoneNumber: buyerRequest.phoneNumber,
            minPrice: buyerRequest.minPrice,
            maxPrice: buyerRequest.maxPrice,
            propertyType: buyerRequest.propertyType,
            propertyAge: buyerRequest.propertyAge,
            propertyMode: buyerRequest.propertyMode,
            paymentType: buyerRequest.paymentType,
            bankLoan: buyerRequest.bankLoan,
            state: buyerRequest.state,
            payustatususer,
          },
          matchedProperties: matchedProperties.map((property) => ({
            propertyId: property.ppcId,
            postedByUser: property.phoneNumber,
            price: property.price,
            state: property.state,
            propertyType: property.propertyType,
            bedrooms: property.bedrooms,
            totalArea: property.totalArea,
            areaUnit: property.areaUnit,
            postedBy: property.postedBy,
            createdAt: property.createdAt,
          })),
        });
      }
    }

    if (!matchedData.length) {
      return res.status(404).json({ message: "No matched properties found" });
    }

    res.status(200).json({
      message: "Matched Data Fetched Successfully!",
      totalMatches: matchedData.length,
      data: matchedData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



// router.get("/fetch-matched-datas-buyer-payment", async (req, res) => {
//   try {
//     const { phoneNumber } = req.query;

//     if (!phoneNumber) {
//       return res
//         .status(400)
//         .json({ message: "Buyer Assistance phone number is required" });
//     }

//     const normalizedPhone = normalizePhone(phoneNumber);

//     const buyerRequests = await BuyerAssistance.find({
//       phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") },
//     });

//     if (!buyerRequests.length) {
//       return res
//         .status(404)
//         .json({ message: "No Buyer Assistance requests found for this phone number" });
//     }

//     const matchedData = [];

//     for (let buyerRequest of buyerRequests) {
//       // ✅ Fetch payment status by ba_id
//       const paymentData = await PaymentPayUBuyer.findOne({ ba_id: buyerRequest.ba_id });
//       const payustatususer = paymentData ? paymentData.payustatususer : "unpaid";

//       // ✅ Match properties
//       const matchedProperties = await AddModel.find({
//         propertyMode: buyerRequest.propertyMode,
//         propertyType: buyerRequest.propertyType,
//         state: buyerRequest.state,
//         price: {
//           $gte: Number(buyerRequest.minPrice),
//           $lte: Number(buyerRequest.maxPrice),
//         },
//       });

//       if (matchedProperties.length > 0) {
//         matchedData.push({
//           buyerAssistanceCard: {
//             _id: buyerRequest._id,
//             Ba_Id: buyerRequest.ba_id,
//             name: buyerRequest.baName,
//             phoneNumber: buyerRequest.phoneNumber,
//             minPrice: buyerRequest.minPrice,
//             maxPrice: buyerRequest.maxPrice,
//             propertyType: buyerRequest.propertyType,
//             propertyAge: buyerRequest.propertyAge,
//             propertyMode: buyerRequest.propertyMode,
//             paymentType: buyerRequest.paymentType,
//             bankLoan: buyerRequest.bankLoan,
//             state: buyerRequest.state,
//             payustatususer, // ✅ add payment status
//           },
//           matchedProperties: matchedProperties.map((property) => ({
//             propertyId: property.ppcId,
//             postedByUser: property.phoneNumber,
//             price: property.price,
//             state: property.state,
//             propertyType: property.propertyType,
//             bedrooms: property.bedrooms,
//             totalArea: property.totalArea,
//             areaUnit: property.areaUnit,
//             postedBy: property.postedBy,
//             createdAt: property.createdAt,
//           })),
//         });
//       }
//     }

//     if (matchedData.length === 0) {
//       return res.status(404).json({ message: "No matched properties found" });
//     }

//     res.status(200).json({
//       message: "Matched Data Fetched Successfully!",
//       totalMatches: matchedData.length,
//       data: matchedData,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });




router.get("/fetch-matched-data-owner", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Fetch all properties posted by the owner
    const properties = await AddModel.find({ phoneNumber });

    if (!properties.length) {
      return res
        .status(404)
        .json({ message: "No properties found for this owner" });
    }

    const matchedData = [];

    for (let property of properties) {
      // Match buyer assistance for each property
      const conditions = {
        propertyMode: property.propertyMode,
        propertyType: property.propertyType,
        // city: property.city,
        // area: property.area,
        // facing: property.facing,
        minPrice: { $lte: property.price },
        maxPrice: { $gte: property.price },
        state:property.state,
      };

      const matchedBuyers = await BuyerAssistance.find(conditions);

      if (matchedBuyers.length > 0) {
        matchedData.push({
          propertyDetails: {
            propertyId: property.ppcId,
            postedByUser: property.phoneNumber,
            price: property.price,
            // city: property.city,
            // area: property.area,
            state: property.state,
            propertyMode:property.propertyMode,
            propertyType: property.propertyType,
            // facing: property.facing,
              views:property.views,
                              floorNo:property.floorNo,
            bedrooms:property.bedrooms,
            totalArea:property.totalArea,
            areaUnit:property.areaUnit,
            postedBy:property.postedBy,
            createdAt:property.createdAt,
          },
          matchedBuyerRequests: matchedBuyers.map((buyer) => ({
            name: buyer.baName,
            phoneNumber: buyer.phoneNumber,
            // city: buyer.city,
            // area: buyer.area,
            priceRange: `${buyer.minPrice} - ${buyer.maxPrice}`,
            propertyType: buyer.propertyType,
            // facing: buyer.facing,
            state: buyer.state,

            propertyAge: buyer.propertyAge,
            Ba_Id: buyer.ba_id,
          })),
        });
      }
    }
    if (!matchedData.length) {
      return res
        .status(404)
        .json({ message: "No matched buyer assistance requests found" });
    }

    res.status(200).json({
      message: "Buyer-Matched Assistance Requests fetched successfully!",
      totalMatches: matchedData.length,
      data: matchedData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});




router.get("/count-matched-datas-buyer", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ message: "Buyer Assistance phone number is required" });
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    const buyerRequests = await BuyerAssistance.find({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") },
    });

    if (!buyerRequests.length) {
      return res.status(200).json({ totalMatches: 0 });
    }

    let count = 0;

    for (let buyerRequest of buyerRequests) {
      const matchedProperties = await AddModel.find({
        propertyMode: buyerRequest.propertyMode,
        propertyType: buyerRequest.propertyType,
        state: buyerRequest.state,
        price: {
          $gte: Number(buyerRequest.minPrice),
          $lte: Number(buyerRequest.maxPrice),
        },
      });

      if (matchedProperties.length > 0) {
        count++;
      }
    }

    return res.status(200).json({
      message: "Matched buyer property count fetched successfully",
      totalMatches: count,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
});



router.get("/count-matched-data-owner", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const properties = await AddModel.find({ phoneNumber });

    if (!properties.length) {
      return res.status(200).json({ totalMatches: 0 });
    }

    let count = 0;

    for (let property of properties) {
      const matchedBuyers = await BuyerAssistance.find({
        propertyMode: property.propertyMode,
        propertyType: property.propertyType,
        state: property.state,
        minPrice: { $lte: property.price },
        maxPrice: { $gte: property.price },
      });

      if (matchedBuyers.length > 0) {
        count++;
      }
    }

    return res.status(200).json({
      message: "Matched buyer request count fetched successfully",
      totalMatches: count,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
});




router.get("/fetch-all-matched-datas", async (req, res) => {
  try {
    const buyerRequests = await BuyerAssistance.find({});
    const matchedData = [];

    for (let buyerRequest of buyerRequests) {
      const matchedProperties = await AddModel.find({
        propertyMode: buyerRequest.propertyMode,
        propertyType: buyerRequest.propertyType,
        // city: buyerRequest.city,
        // area: buyerRequest.area,
        // facing: buyerRequest.facing,
        state: buyerRequest.state,

        price: {
          $gte: Number(buyerRequest.minPrice),
          $lte: Number(buyerRequest.maxPrice),
        },
      });

      if (matchedProperties.length > 0) {
        matchedData.push({
          buyerAssistanceCard: {
            _id: buyerRequest._id,
            Ba_Id: buyerRequest.ba_id,
            name: buyerRequest.baName,
            phoneNumber: buyerRequest.phoneNumber,
            city: buyerRequest.city,
            area: buyerRequest.area,
            minPrice: buyerRequest.minPrice,
            maxPrice: buyerRequest.maxPrice,
            propertyType: buyerRequest.propertyType,
            facing: buyerRequest.facing,
            propertyAge: buyerRequest.propertyAge,
            propertyMode: buyerRequest.propertyMode,
            paymentType: buyerRequest.paymentType,
            bankLoan: buyerRequest.bankLoan,
            state:buyerRequest.state,
          },
          matchedProperties: matchedProperties.map((property) => ({
            propertyId: property.ppcId,
            postedByUser: property.phoneNumber,
            price: property.price,
            city: property.city,
            area: property.area,
            state: property.state,
            propertyType: property.propertyType,
            facing: property.facing,
            bedrooms: property.bedrooms,
            totalArea: property.totalArea,
            areaUnit: property.areaUnit,
            postedBy: property.postedBy,
            createdAt: property.createdAt,
          })),
        });
      }
    }

    if (!matchedData.length) {
      return res
        .status(404)
        .json({ message: "No matched data found", success: false });
    }

    res.status(200).json({
      message: "All matched buyer-property data fetched successfully",
      totalMatches: matchedData.length,
      data: matchedData,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// ─── Match active buyers ⇄ approved properties ───────────────────────────
// Matching rules (per admin spec):
//   • property type  — must match (case-insensitive)
//   • property mode  — must match (case-insensitive)
//   • price / budget — property price must fall within the buyer's min–max
//   • BHK            — property bedrooms >= buyer's bedrooms;
//                      skipped entirely when the buyer wants land / plot
router.get("/get-matched-buyers-properties", async (req, res) => {
  try {
    // Active buyer assistance requests (same set as the Active Buyer page).
    const buyerRequests = await BuyerAssistance.find({
      ba_status: "baActive",
      isDeleted: { $ne: true },
    });
    // Approved / active properties (same set as the Approved Property page).
    const properties = await AddModel.find({ status: "active" });

    const norm = (v) => String(v == null ? "" : v).trim().toLowerCase();
    // BHK is not mandatory for land / plot type requests.
    const isLandOrPlot = (type) => {
      const t = norm(type);
      return t.includes("plot") || t.includes("land") || t.includes("agri");
    };

    const matchedData = [];

    for (const buyer of buyerRequests) {
      const minP = Number(buyer.minPrice);
      const maxP = Number(buyer.maxPrice);
      const buyerBhk = Number(buyer.bedrooms) || 0;
      const buyerType = norm(buyer.propertyType);
      const buyerMode = norm(buyer.propertyMode);
      const skipBhk = isLandOrPlot(buyer.propertyType);

      const matched = properties.filter((p) => {
        // Property type / mode must match
        if (buyerType && norm(p.propertyType) !== buyerType) return false;
        if (buyerMode && norm(p.propertyMode) !== buyerMode) return false;

        // Price must fall inside the buyer's budget
        const price = Number(p.price);
        if (!Number.isFinite(price)) return false;
        if (Number.isFinite(minP) && price < minP) return false;
        if (Number.isFinite(maxP) && price > maxP) return false;

        // BHK — property must have at least the buyer's BHK (skipped for land/plot)
        if (!skipBhk && buyerBhk > 0) {
          const propBhk = Number(p.bedrooms) || 0;
          if (propBhk < buyerBhk) return false;
        }
        return true;
      });

      if (matched.length > 0) {
        matchedData.push({
          buyerAssistanceCard: {
            _id: buyer._id,
            Ba_Id: buyer.ba_id,
            name: buyer.baName,
            phoneNumber: buyer.phoneNumber,
            city: buyer.city,
            area: buyer.area,
            minPrice: buyer.minPrice,
            maxPrice: buyer.maxPrice,
            bedrooms: buyer.bedrooms,
            propertyType: buyer.propertyType,
            propertyMode: buyer.propertyMode,
            facing: buyer.facing,
            bankLoan: buyer.bankLoan,
            isDeleted: !!buyer.isDeleted,
          },
          matchedProperties: matched.map((property) => ({
            propertyId: property.ppcId,
            ppcId: property.ppcId,
            phoneNumber: property.phoneNumber,
            postedBy: property.postedBy,
            postedByUser: property.phoneNumber,
            price: property.price,
            city: property.city,
            area: property.area,
            state: property.state,
            propertyType: property.propertyType,
            propertyMode: property.propertyMode,
            facing: property.facing,
            bedrooms: property.bedrooms,
            totalArea: property.totalArea,
            areaUnit: property.areaUnit,
            createdAt: property.createdAt,
            isDeleted: !!property.isDeleted,
          })),
        });
      }
    }

    res.status(200).json({
      message: "Matched buyers and properties fetched successfully",
      totalMatches: matchedData.length,
      data: matchedData,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error matching buyers and properties",
      error: error.message,
      success: false,
    });
  }
});















// *************** all buyer with matched property ***************

// Function to normalize phone numbers
const normalizePhone = (phone) => {
  return phone.replace(/\D/g, "").slice(-10);
};

router.get("/fetch-matched-data-buyer", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ message: "Buyer Assistance phone number is required" });
    }

    // Normalize the phone number
    const normalizedPhone = normalizePhone(phoneNumber);

    // Fetch all Buyer Assistance requests for this phone number
    const buyerRequests = await BuyerAssistance.find({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") },
    });

    if (!buyerRequests.length) {
      return res
        .status(404)
        .json({ message: "No Buyer Assistance requests found for this phone number" });
    }

    let matchedData = [];

    for (let buyerRequest of buyerRequests) {
      // Fetch matched properties based on buyer assistance criteria
      const matchedProperties = await AddModel.find({
        propertyMode: buyerRequest.propertyMode,
        propertyType: buyerRequest.propertyType,
        city: buyerRequest.city,
        area: buyerRequest.area,
        facing: buyerRequest.facing,
       
        price: {
          $gte: Number(buyerRequest.minPrice),
          $lte: Number(buyerRequest.maxPrice),
        },
      });

      matchedData.push({
        buyerAssistanceCard: {
          name: buyerRequest.baName,
          phoneNumber: buyerRequest.phoneNumber,
          city: buyerRequest.city,
          area: buyerRequest.area,
          priceRange: `${buyerRequest.minPrice} - ${buyerRequest.maxPrice}`,
          propertyType: buyerRequest.propertyType,
          facing: buyerRequest.facing,
          propertyAge: buyerRequest.propertyAge,
        },
        matchedProperties: matchedProperties.map((property) => ({
          propertyId: property.ppcId,
          postedByUser: property.phoneNumber,
          price: property.price,
          city: property.city,
          area: property.area,
          state: property.state,
          propertyType: property.propertyType,
          facing: property.facing,
        })),
      });
    }

    res.status(200).json({
      message: "Matched Data Fetched Successfully!",
      totalMatches: matchedData.length,
      data: matchedData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});




router.get("/fetch-owner-matched-properties", async (req, res) => {
  try {
    let { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Buyer Assistance phone number is required" });
    }

    const normalizedPhone = normalizePhone(phoneNumber);

    // Fetch all Buyer Assistance Requests for this phone number
    const buyerRequests = await BuyerAssistance.find({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") }
    });

    if (!buyerRequests.length) {
      return res.status(404).json({ message: "No Buyer Assistance requests found for this phone number" });
    }


    let matchedProperties = [];

    for (let buyerRequest of buyerRequests) {
  

      const properties = await AddModel.find({
        propertyMode: buyerRequest.propertyMode,
        propertyType: buyerRequest.propertyType,
        city: buyerRequest.city,
        area: buyerRequest.area,
                state: buyerRequest.state,

        facing: buyerRequest.facing,
        price: {
          $gte: Number(buyerRequest.minPrice),
          $lte: Number(buyerRequest.maxPrice)
        }
      });


      matchedProperties.push(...properties);
    }

    res.status(200).json({
      message: "Owner-Matched Properties fetched successfully!",
      total: matchedProperties.length,
      properties: matchedProperties
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



router.get("/fetch-matched-buyers-for-owner", async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const properties = await AddModel.find({ phoneNumber });

    if (!properties.length) {
      return res.status(404).json({ message: "No properties found for this owner" });
    }


    let allMatchedBuyers = [];

    for (let property of properties) {
      const conditions = {
        propertyMode: property.propertyMode,
        propertyType: property.propertyType,
        city: property.city,
        area: property.area,
        facing: property.facing,
        minPrice: { $lte: property.price },
        maxPrice: { $gte: property.price }
      };


      const matchedBuyers = await BuyerAssistance.find(conditions);

      allMatchedBuyers.push(...matchedBuyers);
    }

    if (!allMatchedBuyers.length) {
      return res.status(404).json({ message: "No matched buyer assistance requests found" });
    }

    res.status(200).json({
      message: "Buyer-Matched Assistance Requests fetched successfully!",
      matchedBuyerRequests: allMatchedBuyers
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



// ********************************************************************************************

router.get("/fetch-buyer-matched-properties/count", async (req, res) => {
  try {
    let { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // ✅ Normalize phone number (Remove non-digits & keep last 10 digits)
    let normalizedPhone = phoneNumber.replace(/\D/g, "").slice(-10);

    // ✅ Fetch property details using phone number
    const property = await AddModel.findOne({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") }
    });

    if (!property) {
      return res.status(200).json({ matchedPropertiesCount: 0 });
    }

    // ✅ Fetch Buyer Assistance requests matching property details
    const matchedBuyerRequestsCount = await BuyerAssistance.countDocuments({
      propertyMode: property.propertyMode,
      propertyType: property.propertyType,
      state: property.state,
      // area: property.area,
    });

    return res.status(200).json({ matchedPropertiesCount: matchedBuyerRequestsCount });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
});




router.get("/fetch-owner-matched-properties/count", async (req, res) => {
  try {
    let { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Buyer Assistance phone number is required" });
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/\D/g, "").slice(-10);


    // Fetch all Buyer Assistance Requests for this user
    const buyerRequests = await BuyerAssistance.find({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") }
    });

    if (!buyerRequests.length) {
      return res.status(404).json({ message: "No Buyer Assistance requests found for this phone number" });
    }


    let matchedPropertyCount = 0;

    for (let buyerRequest of buyerRequests) {
   

      // Count Owner-Matched Properties
      const count = await AddModel.countDocuments({
        propertyMode: buyerRequest.propertyMode,
        propertyType: buyerRequest.propertyType,
        state: buyerRequest.state,
        price: { $gte: Number(buyerRequest.minPrice), $lte: Number(buyerRequest.maxPrice) }
      });

      matchedPropertyCount += count;
    }

    res.status(200).json({
      message: "Owner-Matched Property count fetched successfully!",
      matchedPropertyCount
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



router.get("/fetch-buyerAssistance-user", async (req, res) => {
  try {
    let { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // ✅ Normalize input: Remove non-digit characters and keep only the last 10 digits
    let normalizedPhone = phoneNumber.replace(/\D/g, "").slice(-10);


    // ✅ MongoDB Query: Match all variations of the phone number
    const buyerRequests = await BuyerAssistance.find({
      phoneNumber: { $regex: new RegExp(`${normalizedPhone}$`, "i") }
    });

    if (!buyerRequests.length) {
      return res.status(404).json({ message: "No Buyer Assistance request found for this phone number" });
    }

    // ✅ Format phone number in response to always use +91
    const formattedResponse = buyerRequests.map(request => ({
      ...request.toObject(),
      phoneNumber: `+91${request.phoneNumber.replace(/^91/, "").replace(/^\+?/, "")}`
    }));

    res.status(200).json({ 
      message: "Buyer Assistance request(s) fetched successfully!", 
      data: formattedResponse 
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});






router.get("/expire-buyerAssistance", async (req, res) => {
  try {
    const buyerAssistanceList = await BuyerAssistance.find();
    const phoneNumbers = [...new Set(buyerAssistanceList.map(r => r.phoneNumber))];

    const plans = await PricingPlans.find({
      phoneNumber: { $in: phoneNumbers }
    });

    // 🔍 Get latest follow-up per phoneNumber
    const followUps = await FollowUp.aggregate([
      { $match: { phoneNumber: { $in: phoneNumbers } } },
      { $sort: { followupDate: -1 } },
      {
        $group: {
          _id: "$phoneNumber",
          adminName: { $first: "$adminName" }
        }
      }
    ]);

    const followUpMap = {};
    followUps.forEach(f => {
      followUpMap[f._id] = f.adminName;
    });

    const formatDate = (date) =>
      date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

    const calculateExpiry = (startDate, durationDays) => {
      if (!startDate || !durationDays) return null;
      const expiry = new Date(startDate);
      expiry.setDate(expiry.getDate() + Number(durationDays));
      return expiry;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);
    tenDaysFromNow.setHours(23, 59, 59, 999);

    const combinedData = buyerAssistanceList.map((ba) => {
      const plan = plans.find(p =>
        Array.isArray(p.phoneNumber)
          ? p.phoneNumber.includes(ba.phoneNumber)
          : p.phoneNumber === ba.phoneNumber
      );

      const expiryDate = calculateExpiry(plan?.createdAt, plan?.durationDays);
      let expiryMessage = "No active plan";

      if (expiryDate) {
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysRemaining > 0) {
          expiryMessage = `Your plan expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
        } else if (daysRemaining === 0) {
          expiryMessage = "Your plan expires today!";
        } else {
          expiryMessage = `Your plan expired ${Math.abs(daysRemaining)} ${daysRemaining === -1 ? 'day' : 'days'} ago`;
        }
      }

      return {
        ...ba._doc,
        planName: plan?.name || "No Plan",
        planCreatedAt: formatDate(plan?.createdAt),
        planExpiry: expiryDate ? formatDate(expiryDate) : "N/A",
        expiryMessage,
        planExpiryRaw: expiryDate,
        adminName: followUpMap[ba.phoneNumber] || "N/A"
      };
    });

    const filteredData = combinedData.filter(entry => {
      if (!entry.planExpiryRaw) return false;

      const expiryDate = new Date(entry.planExpiryRaw);
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysDifference = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      return daysDifference <= 10 && daysDifference >= -7;
    });

    filteredData.sort((a, b) => {
      const aDiff = a.planExpiryRaw ? a.planExpiryRaw.getTime() - today.getTime() : 0;
      const bDiff = b.planExpiryRaw ? b.planExpiryRaw.getTime() - today.getTime() : 0;
      return aDiff - bDiff;
    });

    const finalData = filteredData.map(entry => {
      const { planExpiryRaw, ...rest } = entry;
      return rest;
    });

    res.status(200).json({
      success: true,
      message: "Buyer Assistance requests with expiring plans fetched successfully!",
      stats: {
        total: finalData.length,
        expiringSoon: finalData.filter(d => d.expiryMessage.includes("expires in")).length,
        expiredRecently: finalData.filter(d => d.expiryMessage.includes("expired")).length
      },
      data: finalData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring buyer assistance data",
      error: error.message
    });
  }
});






router.post("/send-interest", async (req, res) => {
  try {
    const { ba_id, buyerPhone } = req.body;

    const ba = await BuyerAssistance.findOne({ ba_id });
    if (!ba) {
      return res.status(404).json({ message: "Buyer Assistance not found" });
    }

    const plan = await PricingPlans.findOne({ phoneNumber: buyerPhone });

    // Set the status based on the plan name
    let statusToSet = "buyer-interest-tried"; // Default for Free plan

    // If the user has a paid plan (not Free), set the status to full interest
    if (plan && plan.name && plan.name.toLowerCase() !== "free") {
      statusToSet = "buyer-assistance-interest";
    }

    // Add buyer phone to interested users if not already present
    if (!ba.interestedUserPhone.includes(buyerPhone)) {
      ba.interestedUserPhone.push(buyerPhone);
    }

    // Update ba_status to either 'buyer-assistance-interest' or 'buyer-interest-tried'
    ba.ba_status = statusToSet;

    // Save the updated BuyerAssistance record
    await ba.save();

    res.status(200).json({
      success: true,
      message: `Interest ${statusToSet === "buyer-assistance-interest" ? "sent" : "tried"} successfully.`,
      data: ba
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process interest request",
      error: error.message
    });
  }
});


router.post("/send-interest-with-plan", async (req, res) => {
  try {
    const { ba_id, buyerPhone } = req.body;

    // Step 1: Find the BuyerAssistance record
    const ba = await BuyerAssistance.findOne({ ba_id });
    if (!ba) {
      return res.status(404).json({ message: "Buyer Assistance not found" });
    }

    // Step 2: Find the buyer's plan
    const plan = await PricingPlans.findOne({ phoneNumber: buyerPhone });

    // Default status
    let statusToSet = "buyer-interest-tried"; // Free plan fallback

    // Step 3: Determine interest status based on plan
    if (plan && plan.name && plan.name.toLowerCase() !== "free") {
      statusToSet = "buyer-assistance-interest";
    }

    // Step 4: Update interestedUserPhone if not already present
    if (!ba.interestedUserPhone.includes(buyerPhone)) {
      ba.interestedUserPhone.push(buyerPhone);
    }

    // Step 5: Update status
    ba.ba_status = statusToSet;

    // Step 6: Save updated BuyerAssistance
    await ba.save();

    // Step 7: Calculate plan expiry if plan exists
    let expiryDate = null;
    if (plan) {
      const createdAt = new Date(plan.createdAt);
      const duration = plan.durationDays || 0;
      expiryDate = new Date(createdAt);
      expiryDate.setDate(expiryDate.getDate() + duration);
    }

    // Step 8: Respond with merged result
    return res.status(200).json({
      success: true,
      message: `Interest ${statusToSet === "buyer-assistance-interest" ? "sent" : "tried"} successfully.`,
      buyerAssistance: ba,
      plan: plan
        ? {
            phoneNumber: plan.phoneNumber,
            planName: plan.name,
            packageType: plan.packageType,
            durationDays: plan.durationDays,
            price: plan.price,
            createdAt: plan.createdAt,
            expiryDate: expiryDate?.toISOString().split("T")[0],
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process interest request",
      error: error.message,
    });
  }
});





router.get("/expires-buyerAssistance", async (req, res) => {
  try {
    const buyerAssistanceList = await BuyerAssistance.find();
    const phoneNumbers = [...new Set(buyerAssistanceList.map(r => r.phoneNumber))];

    const plans = await PricingPlans.find({
      phoneNumber: { $in: phoneNumbers }
    });

    const formatDate = (date) =>
      date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

    const calculateExpiry = (startDate, durationDays) => {
      if (!startDate || !durationDays) return null;
      const expiry = new Date(startDate);
      expiry.setDate(expiry.getDate() + Number(durationDays));
      return expiry;
    };

    const today = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);

    const combinedData = buyerAssistanceList.map((ba) => {
      const plan = plans.find(p =>
        Array.isArray(p.phoneNumber)
          ? p.phoneNumber.includes(ba.phoneNumber)
          : p.phoneNumber === ba.phoneNumber
      );

      const expiryDate = calculateExpiry(plan?.createdAt, plan?.durationDays);

      return {
        ...ba._doc,
        planName: plan?.name || "No Plan",
        planCreatedAt: formatDate(plan?.createdAt),
        planExpiry: expiryDate ? formatDate(expiryDate) : "N/A",
        planExpiryRaw: expiryDate // used for filtering
      };
    });

    // Filter entries where expiry is within the next 10 days
    const filteredData = combinedData.filter(entry =>
      entry.planExpiryRaw && entry.planExpiryRaw >= today && entry.planExpiryRaw <= tenDaysFromNow
    );

    // Remove raw expiry from final output
    const finalData = filteredData.map(entry => {
      const { planExpiryRaw, ...rest } = entry;
      return rest;
    });

    res.status(200).json({
      success: true,
      message: "Buyer Assistance requests fetched successfully!",
      data: finalData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer assistance data",
      error: error.message
    });
  }
});





router.get("/fetch-buyerAssistance", async (req, res) => {
  try {
    const buyerAssistanceList = await BuyerAssistance.find();

    const phoneNumbers = [...new Set(buyerAssistanceList.map(r => r.phoneNumber))];
    const plans = await PricingPlans.find({ phoneNumber: { $in: phoneNumbers } });

    const formatDate = (date) =>
      date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

    const calculateExpiry = (startDate, durationDays) => {
      if (!startDate || !durationDays) return "N/A";
      const expiry = new Date(startDate);
      expiry.setDate(expiry.getDate() + Number(durationDays));
      return formatDate(expiry);
    };

    const combinedData = buyerAssistanceList.map((ba) => {
      const plan = plans.find(p =>
        Array.isArray(p.phoneNumber)
          ? p.phoneNumber.includes(ba.phoneNumber)
          : p.phoneNumber === ba.phoneNumber
      );

      return {
        ...ba._doc,
        planName: plan?.name || "No Plan",
        planCreatedAt: formatDate(plan?.createdAt),
        planExpiry: calculateExpiry(plan?.createdAt, plan?.durationDays),
              durationDays: plan?.durationDays || "N/A"

      };
    });

    res.status(200).json({
      success: true,
      message: "Buyer Assistance requests fetched successfully!",
      data: combinedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer assistance data",
      error: error.message
    });
  }
});


// router.get("/fetch-buyerAssistance-free", async (req, res) => {
//   try {
//     const buyerAssistanceList = await BuyerAssistance.find();

//     const phoneNumbers = [...new Set(buyerAssistanceList.map(r => r.phoneNumber))];
//     const plans = await PricingPlans.find({ phoneNumber: { $in: phoneNumbers } });

//     const formatDate = (date) =>
//       date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

//     const calculateExpiry = (startDate, durationDays) => {
//       if (!startDate || !durationDays) return "N/A";
//       const expiry = new Date(startDate);
//       expiry.setDate(expiry.getDate() + Number(durationDays));
//       return formatDate(expiry);
//     };

//     const combinedData = buyerAssistanceList.map((ba) => {
//       const plan = plans.find(p =>
//         Array.isArray(p.phoneNumber)
//           ? p.phoneNumber.includes(ba.phoneNumber)
//           : p.phoneNumber === ba.phoneNumber
//       );

//       return {
//         ...ba._doc,
//         planName: plan?.name || "No Plan",
//         planCreatedAt: formatDate(plan?.createdAt),
//         planExpiry: calculateExpiry(plan?.createdAt, plan?.durationDays)
//       };
//     });

//     // ✅ Filter only those with plan name "Free"
//     const freePlanData = combinedData.filter(item => item.planName === "Free");

//     res.status(200).json({
//       success: true,
//       message: "Buyer Assistance requests with 'Free' plan fetched successfully!",
//       data: freePlanData
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch buyer assistance data",
//       error: error.message
//     });
//   }
// });

router.get("/fetch-buyerAssistance-free", async (req, res) => {
  try {
    const buyerAssistanceList = await BuyerAssistance.find();

    const phoneNumbers = [...new Set(buyerAssistanceList.map(r => r.phoneNumber))];
    const plans = await PricingPlans.find({ phoneNumber: { $in: phoneNumbers } });

    const formatDate = (date) =>
      date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

    const calculateExpiry = (startDate, durationDays) => {
      if (!startDate || !durationDays) return "N/A";
      const expiry = new Date(startDate);
      expiry.setDate(expiry.getDate() + Number(durationDays));
      return formatDate(expiry);
    };

    const combinedData = buyerAssistanceList.map((ba) => {
      const plan = plans.find(p =>
        Array.isArray(p.phoneNumber)
          ? p.phoneNumber.includes(ba.phoneNumber)
          : p.phoneNumber === ba.phoneNumber
      );

      return {
        ...ba._doc,
        planDetails: {
          planName: plan?.name || "No Plan",
          planCreatedAt: formatDate(plan?.createdAt),
          planExpiryDate: calculateExpiry(plan?.createdAt, plan?.durationDays),
                        durationDays: plan?.durationDays || "N/A"

        }
      };
    });

    // ✅ Filter only "Free" plan entries
    const freePlanData = combinedData.filter(item => item.planDetails.planName === "Free");

    res.status(200).json({
      success: true,
      message: "Buyer Assistance requests with 'Free' plan fetched successfully!",
      data: freePlanData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer assistance data",
      error: error.message
    });
  }
});


router.get("/fetch-buyerAssistance-paid", async (req, res) => {
  try {
    const buyerAssistanceList = await BuyerAssistance.find();

    const phoneNumbers = [...new Set(buyerAssistanceList.map(r => r.phoneNumber))];
    const plans = await PricingPlans.find({ phoneNumber: { $in: phoneNumbers } });

    const formatDate = (date) =>
      date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

    const calculateExpiry = (startDate, durationDays) => {
      if (!startDate || !durationDays) return "N/A";
      const expiry = new Date(startDate);
      expiry.setDate(expiry.getDate() + Number(durationDays));
      return formatDate(expiry);
    };

    const combinedData = buyerAssistanceList.map((ba) => {
      const plan = plans.find(p =>
        Array.isArray(p.phoneNumber)
          ? p.phoneNumber.includes(ba.phoneNumber)
          : p.phoneNumber === ba.phoneNumber
      );

      return {
        ...ba._doc,
        planName: plan?.name || "No Plan",
        planCreatedAt: formatDate(plan?.createdAt),
        planExpiry: calculateExpiry(plan?.createdAt, plan?.durationDays),
                      durationDays: plan?.durationDays || "N/A"

      };
    });

    // ✅ Filter out records with plan name "Free" or "No Plan"
    const paidPlansOnly = combinedData.filter(item =>
      item.planName !== "Free" && item.planName !== "No Plan"
    );

    res.status(200).json({
      success: true,
      message: "Buyer Assistance requests with paid plans fetched successfully!",
      data: paidPlansOnly
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyer assistance data",
      error: error.message
    });
  }
});




// Update Buyer Assistance by ID
router.put("/update-buyerAssistance/:id", async (req, res) => {
  try {
    const updatedRequest = await BuyerAssistance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Buyer Assistance request updated successfully!", data: updatedRequest });
  } catch (error) {
    res.status(500).json({ message: "Error updating Buyer Assistance request", error });
  }
});


// Fetch Buyer Assistance Requests with optional ba_status filter
router.get("/fetch-buyerAssistance", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { ba_status: status } : {};
    const requests = await BuyerAssistance.find(filter);
    res.status(200).json({
      message: "Buyer Assistance requests fetched successfully!",
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Buyer Assistance requests",
      error,
    });
  }
});







// List soft-deleted buyer assistance requests for the "Removed Buyer Assistant"
// admin page. Mirrors the shape of /fetch-buyerAssistance-pending so the
// frontend can reuse the same row layout.
router.get("/fetch-buyerAssistance-removed", async (req, res) => {
  try {
    const removed = await BuyerAssistance.find({ isDeleted: true }).sort({
      deletedAt: -1,
      updatedAt: -1,
    });
    res.status(200).json({ data: removed });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching removed buyer assistance requests.",
      error: error.message,
    });
  }
});


// GET /buyerAssistance-pending-with-plan
router.get("/fetch-buyerAssistance-pending", async (req, res) => {
  try {
    // Step 1: Fetch only pending requests that haven't been soft-deleted.
    // Soft-deleted records live in the Removed Buyer Assistant page and
    // shouldn't appear here even though they still carry ba_status="baPending".
    const pendingRequests = await BuyerAssistance.find({
      ba_status: "baPending",
      isDeleted: { $ne: true },
    });

    // Step 2: Extract phone numbers
    const phoneNumbers = [...new Set(pendingRequests.map(req => req.phoneNumber))];

    // Step 3: Fetch plan data for those phone numbers
    const plans = await PricingPlans.find({ phoneNumber: { $in: phoneNumbers } });

    // Step 4: Map phoneNumber → plan info
    const planMap = {};
    plans.forEach(plan => {
      const expiryDate = new Date(plan.createdAt);
      expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 0));
      planMap[plan.phoneNumber] = {
        planName: plan.name || 'N/A',
        planCreatedAt: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A',
        durationDays: plan.durationDays || 0,
        planExpiryDate: expiryDate.toLocaleDateString(),
        packageType: plan.packageType || 'N/A',
      };
    });

    // Step 5: Enrich each request with plan info
    const enrichedData = pendingRequests.map(req => ({
      ...req._doc,
      planDetails: planMap[req.phoneNumber] || {
        planName: 'N/A',
        planCreatedAt: 'N/A',
        durationDays: 0,
        planExpiryDate: 'N/A',
        packageType: 'N/A',
      }
    }));

    res.status(200).json({
      message: "Pending buyer assistance requests with plan details fetched successfully",
      data: enrichedData,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch enriched pending buyer assistance requests",
      error: error.message,
    });
  }
});



// Fetch Single Buyer Assistance Request by ID
router.get("/fetch-buyerAssistance/:id", async (req, res) => {
  try {
    const request = await BuyerAssistance.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Buyer Assistance request fetched successfully!", data: request });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Buyer Assistance request", error });
  }
});

// Delete Buyer Assistance Request
router.delete("/delete-buyerAssistance/:id", async (req, res) => {
  try {
    const deletedRequest = await BuyerAssistance.findByIdAndDelete(req.params.id);
    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Buyer Assistance request deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Buyer Assistance request", error });
  }
});





router.put("/update-status-buyer-assistance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ba_status, userPhoneNumber } = req.body;

    if (!ba_status || !userPhoneNumber) {
      return res.status(400).json({ message: "Status and user phone number are required" });
    }

    if (!["buyer-assistance-interest", "remove-assistance-interest"].includes(ba_status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ✅ Normalize phone number (Remove non-digits & keep last 10 digits)
    let normalizedUserPhone = userPhoneNumber.replace(/\D/g, "").slice(-10);

    // ✅ Use `$addToSet` to prevent duplicate entries in the array
    const updatedAssistance = await BuyerAssistance.findByIdAndUpdate(
      id,
      {
        ba_status,
        $addToSet: { interestedUserPhone: normalizedUserPhone }, // Add phone number without duplicates
      },
      { new: true }
    );

    if (!updatedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance not found" });
    }

    res.status(200).json({
      message: `Buyer Assistance status updated to '${ba_status}' successfully!`,
      data: updatedAssistance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.get("/buyer-assistance-interests", async (req, res) => {
  try {
    const assistanceInterests = await BuyerAssistance.find({ ba_status: "buyer-assistance-interest" });

    if (!assistanceInterests.length) {
      return res.status(404).json({ message: "No buyer assistance interests found" });
    }

    res.status(200).json({
      message: "Buyer assistance interests fetched successfully",
      data: assistanceInterests, // Send full data
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.put("/status-buyer-assistance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ba_status } = req.body;

    if (!ba_status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // ✅ Update Buyer Assistance status
    const updatedAssistance = await BuyerAssistance.findByIdAndUpdate(
      id,
      { ba_status },
      { new: true } // Return updated document
    );

    if (!updatedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance status updated successfully!",
      data: updatedAssistance
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});




router.delete("/delete-buyer-assistance/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Find and update record to soft delete
    const deletedAssistance = await BuyerAssistance.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!deletedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance request deleted successfully",
      data: deletedAssistance,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});




// ✅ API to Undo Delete (Restore Buyer Assistance)
router.put("/undo-delete-buyer-assistance/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Find and restore the deleted record
    const restoredAssistance = await BuyerAssistance.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!restoredAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(201).json({
      message: "Buyer Assistance request restored successfully",
      data: restoredAssistance,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// / API to Undo Delete (Restore Buyer Assistance by ba_id)
router.put("/undo-delete-buyer-assistance/:ba_id", async (req, res) => {
  try {
    const { ba_id } = req.params;

    // ✅ Find and update by ba_id
    const restoredAssistance = await BuyerAssistance.findOneAndUpdate(
      { ba_id: ba_id }, // Ensure numeric match
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!restoredAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(201).json({
      message: "Buyer Assistance request restored successfully",
      data: restoredAssistance,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// ✅ API to Soft Delete Buyer Assistance by ba_id
router.put("/delete-buyer-assistance/:ba_id", async (req, res) => {
  try {
    const { ba_id } = req.params;

    // ✅ Find and mark as deleted
    const deletedAssistance = await BuyerAssistance.findOneAndUpdate(
      { ba_id: ba_id }, // Ensure numeric type
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!deletedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance request deleted successfully",
      data: deletedAssistance,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// // Undo soft delete by ba_id (robust handling of param)
// router.put("/undo-delete-buyer-assistance/:ba_id", async (req, res) => {
//   try {
//     // sanitize incoming param
//     let raw = String(req.params.ba_id || "").trim();
//     // strip trailing dot or accidental punctuation like "201." -> "201"
//     raw = raw.replace(/\.$/, "");

//     if (!raw) {
//       return res.status(400).json({ message: "ba_id param is required" });
//     }

//     // Build query safely:
//     let query;
//     if (/^[0-9a-fA-F]{24}$/.test(raw)) {
//       // Looks like a Mongo ObjectId -> query by _id
//       query = { _id: raw };
//     } else if (/^\d+$/.test(raw)) {
//       // Pure digits -> treat as numeric ba_id
//       query = { ba_id: Number(raw) };
//     } else {
//       // Non-numeric string -> treat as string ba_id field
//       query = { ba_id: raw };
//     }

//     console.log("Undo-delete query:", query); // debug

//     const restoredAssistance = await BuyerAssistance.findOneAndUpdate(
//       query,
//       { $set: { isDeleted: false, deletedAt: null } },
//       { new: true }
//     );

//     if (!restoredAssistance) {
//       return res.status(404).json({ message: "Buyer Assistance request not found" });
//     }

//     return res.status(200).json({
//       message: "Buyer Assistance request restored successfully",
//       data: restoredAssistance,
//     });
//   } catch (error) {
//     console.error("Undo-delete error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

// // Soft delete by ba_id (use same sanitization)
// router.put("/delete-buyer-assistance/:ba_id", async (req, res) => {
//   try {
//     let raw = String(req.params.ba_id || "").trim();
//     raw = raw.replace(/\.$/, "");

//     if (!raw) {
//       return res.status(400).json({ message: "ba_id param is required" });
//     }

//     let query;
//     if (/^[0-9a-fA-F]{24}$/.test(raw)) {
//       query = { _id: raw };
//     } else if (/^\d+$/.test(raw)) {
//       query = { ba_id: Number(raw) };
//     } else {
//       query = { ba_id: raw };
//     }

//     console.log("Delete query:", query); // debug

//     const deletedAssistance = await BuyerAssistance.findOneAndUpdate(
//       query,
//       { $set: { isDeleted: true, deletedAt: new Date() } },
//       { new: true }
//     );

//     if (!deletedAssistance) {
//       return res.status(404).json({ message: "Buyer Assistance request not found" });
//     }

//     return res.status(200).json({
//       message: "Buyer Assistance request deleted successfully",
//       data: deletedAssistance,
//     });
//   } catch (error) {
//     console.error("Delete error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// });




// ✅ Soft Delete by _id
router.put("/delete-buyer-assistances/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAssistance = await BuyerAssistance.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!deletedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance request deleted successfully",
      data: deletedAssistance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Undo Soft Delete by _id
router.put("/undo-delete-buyer-assistances/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const restoredAssistance = await BuyerAssistance.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!restoredAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance request restored successfully",
      data: restoredAssistance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});




router.delete("/delete-buyer-assistance-by-ppcId/:ppcId", async (req, res) => {
  try {
    const { ppcId } = req.params;

    const deletedAssistance = await BuyerAssistance.findOneAndUpdate(
      { ppcId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!deletedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance request soft deleted successfully",
      data: deletedAssistance,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.put("/undo-delete-buyer-assistance-by-ppcId/:ppcId", async (req, res) => {
  try {
    const { ppcId } = req.params;

    const restoredAssistance = await BuyerAssistance.findOneAndUpdate(
      { ppcId },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!restoredAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({
      message: "Buyer Assistance request restored successfully",
      data: restoredAssistance,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



// ✅ Permanent Delete API
router.delete("/permanent-delete-buyer-assistance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAssistance = await BuyerAssistance.findByIdAndDelete(id);

    if (!deletedAssistance) {
      return res.status(404).json({ message: "Buyer Assistance request not found" });
    }

    res.status(200).json({ message: "Buyer Assistance request permanently deleted!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.get('/buyer-assistance-bankloan', async (req, res) => {
  try {
    const results = await BuyerAssistance.find({
      bankLoan: { $regex: /^yes$/i },
      isDeleted: false // optional filter to exclude soft-deleted entries
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Buyer Assistance with bank loan YES fetched successfully!',
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error fetching Buyer Assistance data with bank loan:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Utility: Build plan map for Buyer Assistance
const buildPlanMap = (plans) => {
  const map = {};
  plans.forEach(plan => {
    const expiryDate = new Date(plan.createdAt);
    expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 0));
    map[plan.phoneNumber] = {
      planName: plan.name || 'N/A',
      planCreatedAt: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A',
      durationDays: plan.durationDays || 0,
      planExpiryDate: expiryDate.toLocaleDateString(),
      packageType: plan.packageType || 'N/A',
    };
  });
  return map;
};

// Utility: Parse "30 days" / "1 month" to number of days
const parseValidityToDays = (validityStr) => {
  if (!validityStr) return 0;
  const lower = validityStr.toLowerCase();
  if (lower.includes('day')) return parseInt(validityStr) || 0;
  if (lower.includes('month')) return (parseInt(validityStr) || 0) * 30;
  return 0;
};

// Utility: Filter docs by createdAt or updatedAt
const filterDocsByDateRange = (docs, start, end) => {
  return docs.filter(doc => {
    const created = moment(doc.createdAt);
    const updated = moment(doc.updatedAt);
    return (
      created.isBetween(start, end, null, '[]') ||
      updated.isBetween(start, end, null, '[]')
    );
  });
};

router.get('/buyer-assistance-daily-report', async (req, res) => {
  try {
    // Define time ranges
    const startOfToday = moment().startOf('day');
    const endOfToday = moment().endOf('day');
    const startOfYesterday = moment().subtract(1, 'day').startOf('day');
    const endOfYesterday = moment().subtract(1, 'day').endOf('day');

    // --- 1. Buyer Assistance ---
    const baRequests = await BuyerAssistance.find({
      ba_status: { $in: ['baActive', 'baPending'] }
    });

    const todayBA = filterDocsByDateRange(baRequests, startOfToday, endOfToday);
    const yesterdayBA = filterDocsByDateRange(baRequests, startOfYesterday, endOfYesterday);

    const allBA = [...todayBA, ...yesterdayBA];
    const baPhones = [...new Set(allBA.map(req => req.phoneNumber))];

    const baPlans = await PricingPlans.find({ phoneNumber: { $in: baPhones } });
    const baPlanMap = buildPlanMap(baPlans);

    const enrichBA = (list) => list.map(req => ({
      ...req._doc,
      planDetails: baPlanMap[req.phoneNumber] || {
        planName: 'N/A',
        planCreatedAt: 'N/A',
        durationDays: 0,
        planExpiryDate: 'N/A',
        packageType: 'N/A',
      }
    }));

    const enrichedTodayBA = enrichBA(todayBA);
    const enrichedYesterdayBA = enrichBA(yesterdayBA);

    // --- 2. Payments ---
    const paymentStatuses = ['pay now', 'pay later', 'paid', 'pay failed'];
    const allPayments = await PaymentPayUBuyer.find({
      payustatususer: { $in: paymentStatuses }
    });

    const todayPayments = filterDocsByDateRange(allPayments, startOfToday, endOfToday);
    const yesterdayPayments = filterDocsByDateRange(allPayments, startOfYesterday, endOfYesterday);

    const buyerPlans = await BuyerPlan.find({ status: 'active' });
    const buyerPlanMap = {};
    buyerPlans.forEach(plan => {
      buyerPlanMap[plan.planName?.toLowerCase()] = plan;
    });

    const enrichPayments = (list) => list.map(payment => {
      const plan = buyerPlanMap[(payment.planName || '').toLowerCase()];
      let expiryDate = null;

      if (plan) {
        const createdAt = plan.createDate || new Date();
        const validityDays = parseValidityToDays(plan.planValidity);
        const expDate = new Date(createdAt);
        expDate.setDate(expDate.getDate() + validityDays);
        expiryDate = expDate.toISOString().split('T')[0];
      }

      return {
        ...payment.toObject(),
        planDetails: plan ? {
          planName: plan.planName,
          planAmount: plan.planAmount,
          planValidity: plan.planValidity,
          numberOfAssistants: plan.numberOfAssistants,
          serviceType: plan.serviceType,
          createDate: plan.createDate,
          expiryDate,
          status: plan.status,
          ba_id: plan.ba_id,
        } : null
      };
    });

    const enrichedTodayPayments = enrichPayments(todayPayments);
    const enrichedYesterdayPayments = enrichPayments(yesterdayPayments);

    // --- 3. Final Response ---
    return res.status(200).json({
      success: true,
      today: moment().format('YYYY-MM-DD'),
      yesterday: moment().subtract(1, 'day').format('YYYY-MM-DD'),

      buyerAssistance: {
        today: enrichedTodayBA,
        yesterday: enrichedYesterdayBA
      },

      paymentDetails: {
        today: enrichedTodayPayments,
        yesterday: enrichedYesterdayPayments
      }
    });

  } catch (error) {
    console.error("Buyer Assistance Daily Report Error:", error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});




const getBuyerDashboardData = async (req, res) => {
  try {
    // --- Parse date range from query ---
    let startDate, endDate;
    if (req.query.dates) {
      const dateParts = req.query.dates.split(",");
      if (dateParts.length !== 2) {
        return res.status(400).json({
          status: "error",
          message: "Invalid dates format. Use ?dates=YYYY-MM-DD,YYYY-MM-DD"
        });
      }
      startDate = new Date(dateParts[0]);
      endDate = new Date(dateParts[1]);
    } else if (req.query.date) {
      startDate = new Date(req.query.date);
      endDate = new Date(req.query.date);
    } else {
      return res.status(400).json({
        status: "error",
        message: "Please provide date(s) in query params"
      });
    }

    // Normalize start & end times
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // ---------------- Buyer Assistance ----------------
    const baQuery = {
      ba_status: { $in: ["baActive", "baPending"] },
      isDeleted: false
    };

    const buyerAssistanceData = await BuyerAssistance.find({
      ...baQuery,
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { updatedAt: { $gte: startDate, $lte: endDate } }
      ]
    }).lean();

    const buyerAssistanceSummary = {
      total: buyerAssistanceData.length,
      statusCounts: {
        baActive: buyerAssistanceData.filter(d => d.ba_status === "baActive").length,
        baPending: buyerAssistanceData.filter(d => d.ba_status === "baPending").length
      },
      list: buyerAssistanceData.map(d => ({
        ba_id: d.ba_id,
        ba_status: d.ba_status,
        phoneNumber: d.phoneNumber,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }))
    };

    // ---------------- Payments ----------------
    const statuses = ["pay now", "pay later", "paid", "pay failed"];
    const paymentsSummary = {};

    const allPlans = await BuyerPlan.find({ status: "active" }).lean();
    const planMap = {};
    allPlans.forEach(plan => {
      planMap[plan.planName.toLowerCase()] = plan;
    });

    const parseValidityToDays = (validityStr) => {
      if (!validityStr) return 0;
      const lower = validityStr.toLowerCase();
      if (lower.includes("day")) return parseInt(validityStr) || 0;
      if (lower.includes("month")) return (parseInt(validityStr) || 0) * 30;
      return 0;
    };

    for (const status of statuses) {
      const payments = await PaymentPayUBuyer.find({
        payustatususer: status,
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();

      paymentsSummary[status] = {
        total: payments.length,
        list: payments.map(payment => {
          const plan = planMap[(payment.planName || "").toLowerCase()];
          let expiryDate = null;
          if (plan) {
            const createdAt = payment.createdAt || new Date();
            const validityDays = parseValidityToDays(plan.planValidity);
            const expDate = new Date(createdAt);
            expDate.setDate(expDate.getDate() + validityDays);
            expiryDate = expDate.toISOString().split("T")[0];
          }
          return {
            paymentId: payment._id,
            amount: payment.amount,
            planName: payment.planName,
            payStatus: payment.payustatususer,
            createdAt: payment.createdAt,
            expiryDate,
            planDetails: plan || null
          };
        })
      };
    }

    // ---------------- Response ----------------
    res.json({
      status: "success",
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      buyerAssistance: buyerAssistanceSummary,
      payments: paymentsSummary
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message
    });
  }
};

// Endpoint
router.get("/buyer-dashboard-data", getBuyerDashboardData);



// ── Buyer-Assistance PPCID phone masking ──────────────────────────────────
// Mirrors the property /assign-phone family in AddRouter.js, keyed by ba_id.
// When assigned, the user side shows assignedPhoneNumber instead of the
// buyer's real phoneNumber (see DetailBuyerAssistance.jsx).

// POST /assign-buyer-phone  { ba_id, assignedPhoneNumber }
router.post('/assign-buyer-phone', async (req, res) => {
  try {
    const { ba_id, assignedPhoneNumber } = req.body;

    if (!ba_id || !assignedPhoneNumber) {
      return res.status(400).json({ error: 'ba_id and assignedPhoneNumber are required' });
    }

    const request = await BuyerAssistance.findOneAndUpdate(
      { ba_id: Number(ba_id) },
      {
        assignedPhoneNumber,
        setPpcId: true,
        setPpcIdAssignedAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Buyer assistance request not found' });
    }

    res.status(200).json({ message: 'Phone number assigned successfully', request });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /get-buyer-phone-assignments — list every BA record that has (or had) an assignment
router.get('/get-buyer-phone-assignments', async (req, res) => {
  try {
    const requests = await BuyerAssistance.find(
      {
        $or: [
          { assignedPhoneNumber: { $exists: true, $nin: [null, ''] } },
          { previouslyAssignedPhoneNumber: { $exists: true, $nin: [null, ''] } },
        ],
      },
      {
        ba_id: 1,
        baName: 1,
        assignedPhoneNumber: 1,
        phoneNumber: 1,
        setPpcId: 1,
        setPpcIdAssignedAt: 1,
        _id: 0,
      }
    ).sort({ setPpcIdAssignedAt: -1 });

    const formatted = requests.map((r) => ({
      ba_id: r.ba_id,
      baName: r.baName || '',
      assignedPhoneNumber: r.assignedPhoneNumber || null,
      originalPhoneNumber: r.phoneNumber || null,
      setPpcId: r.setPpcId || false,
      setPpcIdAssignedAt: r.setPpcIdAssignedAt || null,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /unassign-buyer-phone  { ba_id } — temporarily remove (keeps a backup for undo)
router.put('/unassign-buyer-phone', async (req, res) => {
  try {
    const { ba_id } = req.body;

    const request = await BuyerAssistance.findOne({ ba_id: Number(ba_id) });
    if (!request) {
      return res.status(404).json({ error: 'Buyer assistance request not found' });
    }

    const updated = await BuyerAssistance.findOneAndUpdate(
      { ba_id: Number(ba_id) },
      {
        previouslyAssignedPhoneNumber: request.assignedPhoneNumber,
        previouslyAssignedAt: request.setPpcIdAssignedAt,
        assignedPhoneNumber: null,
        setPpcIdAssignedAt: null,
        setPpcId: false,
      },
      { new: true }
    );

    res.status(200).json({ message: 'Assignment temporarily removed', updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /undo-unassign-buyer-phone  { ba_id } — restore a removed assignment
router.put('/undo-unassign-buyer-phone', async (req, res) => {
  try {
    const { ba_id } = req.body;

    const request = await BuyerAssistance.findOne({ ba_id: Number(ba_id) });
    if (!request || !request.previouslyAssignedPhoneNumber) {
      return res.status(404).json({ error: 'No backup data found for undo' });
    }

    const updated = await BuyerAssistance.findOneAndUpdate(
      { ba_id: Number(ba_id) },
      {
        assignedPhoneNumber: request.previouslyAssignedPhoneNumber,
        setPpcIdAssignedAt: request.previouslyAssignedAt || new Date(),
        setPpcId: true,
        previouslyAssignedPhoneNumber: null,
        previouslyAssignedAt: null,
      },
      { new: true }
    );

    res.status(200).json({ message: 'Assignment restored', updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;



















