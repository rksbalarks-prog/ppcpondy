const express = require('express');
const router = express.Router();
// Option 1: Use the separate EditBuyerBillModel (recommended for better organization)
const EditBuyerBill = require('../EditBuyerBill/EditBuyerBillModel');

// Option 2: Use the original BillModel (if you want to use existing model)
// const EditBuyerBill = require('../CreateBill/BillModel');

/**
 * GET /buyer-get-bill/:ba_id
 * Fetch a buyer bill by ba_id
 * ba_id is stored in the ppId field of the model
 */
router.get('/buyer-get-bill/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;

    // Query bill using ba_id
    const bill = await EditBuyerBill.findOne({ ba_id: ba_id, isDeleted: false });

    if (!bill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found for this buyer assistance' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: bill 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

/**
 * PUT /buyer-update-bill/:ba_id
 * Update a buyer bill by ba_id
 * Validates billDate to ensure it's today or future date
 */
router.put('/buyer-update-bill/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;
    const updateData = req.body;
    const adminName = updateData.adminName || 'Unknown'; // Track who made the change

    // ? Validate billDate if it's being updated (allow only today or future date)
    if (updateData.billDate) {
      const inputDate = new Date(updateData.billDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize to start of the day

      if (inputDate < today) {
        return res.status(400).json({
          success: false,
          message: "Past dates are not accepted for the bill date. Please select today or a future date."
        });
      }
    }

    // Prepare update payload with metadata
    const updatePayload = {
      ...updateData,
      lastModifiedBy: adminName,
      updatedAt: new Date()
    };

    // Remove adminName from payload if not needed for storage
    delete updatePayload.adminName;

    // Update bill using ba_id
    const updatedBill = await EditBuyerBill.findOneAndUpdate(
      { ba_id: ba_id, isDeleted: false },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedBill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found for this buyer assistance' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Bill updated successfully', 
      data: updatedBill 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

/**
 * GET /buyer-get-default-bill-data
 * Get default bill data for creating new buyer bills
 * Returns next bill number and today's date
 */
router.get('/buyer-get-default-bill-data', async (req, res) => {
  try {
    // Find the latest bill by created date
    const lastBill = await EditBuyerBill.findOne({ isDeleted: false }).sort({ createdAt: -1 });

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
        adminOffice: 'AUROBINDO', // Can be made dynamic later
        billNo: nextBillNo,
        billDate: formattedDate,
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

/**
 * GET /buyer-bills
 * Get all buyer bills (excluding deleted ones)
 */
router.get('/buyer-bills', async (req, res) => {
  try {
    const bills = await EditBuyerBill.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: bills.length,
      data: bills 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

/**
 * GET /buyer-bills-all
 * Get all buyer bills (including deleted ones) - Admin only
 */
router.get('/buyer-bills-all', async (req, res) => {
  try {
    const bills = await EditBuyerBill.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: bills.length,
      data: bills 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

/**
 * DELETE /buyer-delete-bill/:ba_id
 * Soft delete a buyer bill by ba_id
 * Marks bill as deleted instead of removing from database
 */
router.delete('/buyer-delete-bill/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;
    const adminName = req.body?.adminName || 'Unknown';

    const deletedBill = await EditBuyerBill.findOneAndUpdate(
      { ba_id: ba_id, isDeleted: false },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date(),
          deletedBy: adminName 
        } 
      },
      { new: true }
    );

    if (!deletedBill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bill not found for this buyer assistance' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Bill deleted successfully', 
      data: deletedBill 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

/**
 * PUT /buyer-restore-bill/:ba_id
 * Restore a soft-deleted buyer bill
 */
router.put('/buyer-restore-bill/:ba_id', async (req, res) => {
  try {
    const { ba_id } = req.params;

    const restoredBill = await EditBuyerBill.findOneAndUpdate(
      { ba_id: ba_id, isDeleted: true },
      { 
        $set: { 
          isDeleted: false, 
          deletedAt: null,
          deletedBy: null 
        } 
      },
      { new: true }
    );

    if (!restoredBill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Deleted bill not found for this buyer assistance' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Bill restored successfully', 
      data: restoredBill 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
});

module.exports = router;
