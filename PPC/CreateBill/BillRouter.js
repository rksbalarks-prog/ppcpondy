const express = require('express');
const router = express.Router();
const Bill = require('../CreateBill/BillModel');
const AddModel = require('../AddModel');

// A bill counts as "Free" when EITHER its plan name or its payment type is Free
// (case-insensitive). The admin "Plan Name" dropdown offers a "Free" option;
// choosing it classifies the bill as free in the Free/Paid reports.
const FREE_RE = /^\s*free\s*$/i;





// router.post('/create-bill', async (req, res) => {
//   try {
//     const billData = req.body;

//     // Detect if request is from system or user
//     const requestSource = req.headers['x-request-source'];

//     if (requestSource === 'system') {
//       billData.billCreatedBy = "Admin";
//     } else {
//       billData.billCreatedBy = billData.billCreatedBy || "User";
//     }

//     // 1. Create new bill
//     const newBill = new Bill(billData);
//     await newBill.save();

//     // 2. Update property status to 'active'
//     const updatedProperty = await AddModel.findOneAndUpdate(
//       { ppcId: billData.ppId },
//       { $set: { status: 'active' } },  // ✅ Actually update status here
//       { new: true }
//     );

//     res.status(201).json({
//       success: true,
//       message: "Bill created successfully and property status set to Active",
//       data: {
//         ...newBill._doc,
//         status: updatedProperty?.status || 'N/A'
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// });



router.post('/create-bill', async (req, res) => {
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
        message: "Past dates are not accepted for the bill date. Please select today or a future date."
      });
    }

    // 1. Create new bill
    const newBill = new Bill(billData);
    await newBill.save();

    // 2. Update property status to 'active' and stamp who approved it (the admin who billed).
    const updatedProperty = await AddModel.findOneAndUpdate(
      { ppcId: billData.ppId },
      {
        $set: {
          status: 'active',
          approvedBy: billData.adminName || billData.billCreatedBy || null,
          approvedByRole: billData.adminRole || null,
          approvedAt: new Date(),
        },
      },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Bill created successfully and property status set to Active",
      data: {
        ...newBill._doc,
        status: updatedProperty?.status || 'N/A'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

router.get('/get-bill/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;

    const bill = await Bill.findOne({ ppId: ppcId });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});



router.put('/update-bill/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;
    const updateData = req.body;

    const updatedBill = await Bill.findOneAndUpdate(
      { ppId: ppcId },
      updateData,
      { new: true }
    );

    if (!updatedBill) {
      return res.status(404).json({ success: false, message: 'Bill not found for update' });
    }

    res.status(200).json({ success: true, message: 'Bill updated successfully', data: updatedBill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});



// Get default values for creating a bill
router.get('/get-default-bill-data', async (req, res) => {
  try {
    // Find the latest bill by created date
    const lastBill = await Bill.findOne().sort({ createdAt: -1 });

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
router.get('/bills', async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get bill by ID
router.get('/bill/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get all Free bills (Free plan name OR Free payment type)
router.get('/bills/free', async (req, res) => {
  try {
    const bills = await Bill.find({
      $or: [ { planName: FREE_RE }, { paymentType: FREE_RE } ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get all Paid bills (neither plan name nor payment type is Free)
router.get('/bills/non-free', async (req, res) => {
  try {
    const bills = await Bill.find({
      $and: [ { planName: { $not: FREE_RE } }, { paymentType: { $not: FREE_RE } } ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});


// ✅ Bulk Create Bills — ONE bill per property for a set of ppcIds.  [ADDITIVE]
// Mirrors /create-bill (save bill, activate property) but applies the SAME bill
// details to every supplied property, generating a unique sequential billNo for
// each. Skips any property that already has a bill. (Bill.ppId = property ppcId.)
router.post('/create-bill-bulk', async (req, res) => {
  try {
    const { items, billData = {} } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No properties supplied for bulk bill.' });
    }
    if (items.length > 5000) {
      return res.status(400).json({ success: false, message: 'Too many properties in one bulk bill (max 5000).' });
    }

    // Validate bill date (today or future) — same rule as the single route.
    const inputDate = new Date(billData.billDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(inputDate.getTime()) || inputDate < today) {
      return res.status(400).json({ success: false, message: 'Past dates are not accepted for the bill date. Please select today or a future date.' });
    }

    const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
    const shared = {
      adminOffice: billData.adminOffice,
      adminName: billData.adminName,
      billDate: billData.billDate,
      paymentType: billData.paymentType,
      planName: billData.planName,
      billAmount: num(billData.billAmount),
      validity: num(billData.validity),
      noOfAds: num(billData.noOfAds),
      featuredAmount: num(billData.featuredAmount),
      featuredValidity: num(billData.featuredValidity),
      featuredMaxAds: num(billData.featuredMaxAds),
      discount: num(billData.discount),
      netAmount: num(billData.netAmount),
      billCreatedBy: billData.billCreatedBy || 'Admin',
    };
    if (!shared.adminOffice || !shared.adminName || !shared.billDate || !shared.paymentType || !shared.planName) {
      return res.status(400).json({ success: false, message: 'Missing required bill fields (office, admin, date, payment type, plan).' });
    }

    // De-dupe ppcIds, keep string (Bill.ppId) and number (AddModel.ppcId) forms.
    const map = new Map();
    for (const it of items) {
      const idRaw = it && it.ppcId;
      if (idRaw === undefined || idRaw === null || String(idRaw).trim() === '') continue;
      const idStr = String(idRaw).trim();
      if (!map.has(idStr)) map.set(idStr, { idNum: Number(idStr), phone: it.phoneNumber ? String(it.phoneNumber) : '' });
    }
    const idStrs = [...map.keys()];
    if (idStrs.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid ppcIds supplied.' });
    }

    // One bill per property: skip ppcIds that already have a bill (Bill.ppId).
    const existing = await Bill.collection.find({ ppId: { $in: idStrs } }).toArray();
    const existingSet = new Set(existing.map(b => String(b.ppId)));

    // Sequential billNo continuing from the most recent bill (same scheme as single).
    const lastBill = await Bill.findOne().sort({ createdAt: -1 });
    let seq = lastBill?.billNo ? (parseInt(lastBill.billNo.split('-')[1]?.trim() || '0', 10) || 0) : 0;

    const billDocs = [];
    const activateNums = [];
    const skipped = [];
    for (const idStr of idStrs) {
      if (existingSet.has(idStr)) { skipped.push(idStr); continue; }
      const { idNum, phone } = map.get(idStr);
      seq += 1;
      billDocs.push({
        ...shared,
        ppId: idStr,
        ownerPhone: phone || '-',
        billNo: `RP - ${String(seq).padStart(3, '0')}`,
      });
      if (Number.isFinite(idNum)) activateNums.push(idNum);
    }

    let createdCount = 0;
    if (billDocs.length) {
      const inserted = await Bill.insertMany(billDocs, { ordered: false });
      createdCount = inserted.length;
      // Activate the billed properties (PreApproved/Pending -> Approved/active).
      if (activateNums.length) {
        await AddModel.updateMany(
          { ppcId: { $in: activateNums } },
          { $set: { status: 'active', approvedBy: shared.adminName || shared.billCreatedBy || null, approvedByRole: billData.adminRole || null, approvedAt: new Date() } }
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdCount} bill(s) and activated those properties; skipped ${skipped.length} that already had a bill.`,
      createdCount,
      skippedCount: skipped.length,
      totalRequested: idStrs.length,
      skippedPpcIds: skipped,
      fromBillNo: billDocs.length ? billDocs[0].billNo : null,
      toBillNo: billDocs.length ? billDocs[billDocs.length - 1].billNo : null,
    });
  } catch (error) {
    console.error('Bulk Create Bill Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during bulk bill creation.', error: error.message });
  }
});


module.exports = router;
