const express = require('express');
const router = express.Router();
const BuyerBill = require('../CreateBuyerBill/BuyerBillModel');
const AddModel = require('../AddModel');
const BuyerAssistance = require("../BuyerAssistance/BuyerAssistanceModel");

// A buyer bill counts as "Free" when EITHER its plan name or its payment type is
// Free (case-insensitive). The admin "Plan Name" dropdown offers a "Free" option;
// choosing it classifies the bill as free in the Free/Paid reports.
const FREE_RE = /^\s*free\s*$/i;



router.post('/buyer-create-bill', async (req, res) => {
  try {
    const billData = req.body;

    // Detect if request is from system or user
    const requestSource = req.headers['x-request-source'];
    billData.billCreatedBy = requestSource === 'system' ? 'Admin' : (billData.billCreatedBy || 'User');

    // ✅ Validate billDate (allow only today or future date)
    const inputDate = new Date(billData.billDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to start of the day

    if (inputDate < today) {
      return res.status(400).json({
        success: false,
        message: "Buyer Past dates are not accepted for the bill date. Please select today or a future date."
      });
    }

    // 1. Create new bill
    const newBill = new BuyerBill(billData);
    await newBill.save();

    // 2. Update property status to 'active'
  const updatedProperty = await BuyerAssistance.findOneAndUpdate(
  { ba_id: billData.ba_id },
  { $set: { ba_status: 'baActive' } },
  { new: true }
);


   res.status(201).json({
  success: true,
  message: "Buyer Bill created successfully and property status set to Active",
  data: {
    ...newBill._doc,
    status: updatedProperty?.ba_status || 'N/A'
  }
});

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

router.get('/buyer-get-bill/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;

    const bill = await BuyerBill.findOne({ ba_id: ba_id });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Buyer Bill not found' });
    }

    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});



router.put('/buyer-update-bill/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;
    const updateData = req.body;
    const adminName = updateData.adminName || 'Unknown'; // Track who made the change

    // Remove adminName from data before saving (it's metadata, not bill data)
    delete updateData.adminName;

    // Prepare update payload with metadata tracking
    const updatePayload = {
      ...updateData,
      lastModifiedBy: adminName,
      updatedAt: new Date()
    };

    const updatedBill = await BuyerBill.findOneAndUpdate(
      { ba_id: ba_id },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedBill) {
      return res.status(404).json({ success: false, message: 'Buyer Bill not found for update' });
    }

    res.status(200).json({ success: true, message: 'Buyer Bill updated successfully', data: updatedBill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});



// Get default values for creating a bill
router.get('/buyer-get-default-bill-data', async (req, res) => {
  try {
    // Find the latest bill by created date
    const lastBill = await BuyerBill.findOne().sort({ createdAt: -1 });

    // Default first bill number
    let nextBillNo = 'RP - 001';

    // If there is a last bill, increment the bill number
    if (lastBill?.billNo) {
      const lastNumber = parseInt(lastBill.billNo.split('-')[1]?.trim() || '0', 10);
      const newNumber = (lastNumber + 1).toString().padStart(3, '0');
      nextBillNo = `RP - ${newNumber}`;
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Send default bill data
    res.status(200).json({
      success: true,
      data: {
        adminOffice: 'AUROBINDO', // Hardcoded for now, can make dynamic later
        // adminName:'',    // Hardcoded for now, can make dynamic later
        billNo: nextBillNo,
        billDate: formattedDate,
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


// Get all bills
router.get('/buyer-bills', async (req, res) => {
  try {
    const bills = await BuyerBill.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get bill by ID
router.get('/buyer-bill/:id', async (req, res) => {
  try {
    const bill = await BuyerBill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Buyer Bill not found' });
    }
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get all Free buyer bills (Free plan name OR Free payment type)
router.get('/buyer-bills/free', async (req, res) => {
  try {
    const bills = await BuyerBill.find({
      $or: [ { planName: FREE_RE }, { paymentType: FREE_RE } ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});




router.get('/buyer-bills/non-free', async (req, res) => {
  try {
    const bills = await BuyerBill.find({
      $and: [ { planName: { $not: FREE_RE } }, { paymentType: { $not: FREE_RE } } ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});



router.get('/buyer-bills/free-with-assistance', async (req, res) => {
  try {
    // Step 1: Fetch all Free buyer bills (Free plan name OR Free payment type)
    const freeBills = await BuyerBill.find({
      $or: [ { planName: FREE_RE }, { paymentType: FREE_RE } ]
    }).sort({ createdAt: -1 });

    if (!freeBills.length) {
      return res.status(404).json({ success: false, message: 'No Free Plan buyer bills found.' });
    }

    // Step 2: For each bill, fetch associated BuyerAssistance using ba_id
    const result = await Promise.all(freeBills.map(async (bill) => {
      const {
        billNo,
        planName,
        billAmount,
        netAmount,
        paymentType,
        validity,
        ownerPhone,
        adminOffice,
        adminName,
        billCreatedBy,
        createdAt,
        ba_id
      } = bill;

      const buyerAssistance = await BuyerAssistance.findOne({ ba_id, isDeleted: false });

      return {
        bill: {
          billNo,
          planName,
          billAmount,
          netAmount,
          paymentType,
          validity,
          ownerPhone,
          adminOffice,
          adminName,
          billCreatedBy,
          billCreatedAt: createdAt,
          ba_id
        },
        buyerAssistance
      };
    }));

    res.status(200).json({
      success: true,
      message: 'Fetched Free Plan buyer bills with associated Buyer Assistance successfully.',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching Free Plan buyer bills with assistance.',
      error: error.message
    });
  }
});


router.get('/buyer-bills/non-free-with-assistance', async (req, res) => {
  try {
    // Step 1: Get all Paid buyer bills (neither plan name nor payment type is Free)
    const paidBills = await BuyerBill.find({
      $and: [ { planName: { $not: FREE_RE } }, { paymentType: { $not: FREE_RE } } ]
    }).sort({ createdAt: -1 });

    if (!paidBills.length) {
      return res.status(404).json({ success: false, message: 'No Paid Plan buyer bills found.' });
    }

    // Step 2: For each bill, fetch the associated BuyerAssistance entry using ba_id
    const result = await Promise.all(
      paidBills.map(async (bill) => {
        const {
          billNo,
          planName,
          billAmount,
          netAmount,
          paymentType,
          validity,
          ownerPhone,
          adminOffice,
          adminName,
          billCreatedBy,
          createdAt,
          ba_id
        } = bill;

        const assistance = await BuyerAssistance.findOne({ ba_id, isDeleted: false });

        // Skip if no valid BuyerAssistance found
        if (!assistance) return null;

        // Enhance logic: required fields check
        const requiredFields = ['propertyMode', 'propertyType', 'minPrice', 'maxPrice', 'totalArea', 'areaUnit'];
        const required = requiredFields.every(field =>
          assistance[field] !== undefined &&
          assistance[field] !== null &&
          String(assistance[field]).trim() !== ''
        ) ? 'Yes' : 'No';

        const planExpiryDate = validity
          ? new Date(new Date(createdAt).getTime() + validity * 24 * 60 * 60 * 1000)
          : null;

        return {
          bill: {
            billNo,
            planName,
            billAmount,
            netAmount,
            paymentType,
            validity,
            ownerPhone,
            adminOffice,
            adminName,
            billCreatedBy,
            billCreatedAt: createdAt,
            planExpiryDate,
            ba_id
          },
          buyerAssistance: {
            ...assistance.toObject(),
            required
          }
        };
      })
    );

    // Filter out nulls (in case some ba_id had no match)
    const filteredResult = result.filter(entry => entry !== null);

    res.status(200).json({
      success: true,
      message: "Fetched Paid Plan BuyerBills with associated BuyerAssistance successfully.",
      data: filteredResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching Paid Plan BuyerBills with assistance.',
      error: error.message
    });
  }
});



module.exports = router;
