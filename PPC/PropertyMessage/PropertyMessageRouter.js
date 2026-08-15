

const express = require('express');
const router = express.Router();
const PropertyMessage = require('../PropertyMessage/PropertyMessageModel');
// AddModel is the property collection — used to derive a message's city base on
// upsert (findOneAndUpdate bypasses the model's pre('save') hook).
const AddModel = require('../AddModel');


router.post('/admin/property-message', async (req, res) => {
  try {
    const { ppcId, enumMessage = null, customMessage = null, setBy = 'Admin' } = req.body;

    if (!ppcId) {
      return res.status(400).json({ success: false, message: 'ppcId is required' });
    }

    if (!enumMessage && !customMessage) {
      return res.status(400).json({ success: false, message: 'Provide either enumMessage or customMessage' });
    }

    const validEnums = ['Sold Out', 'Waiting', 'Available', 'Coming Soon', 'Under Process', 'Blocked', 'Other'];
    if (enumMessage && !validEnums.includes(enumMessage)) {
      return res.status(400).json({ success: false, message: 'Invalid enumMessage value' });
    }

    // City base: a property message belongs to the same city as its property.
    // upsert bypasses the model's pre('save') hook, so on INSERT we stamp `base`
    // from the property itself (findOne is not city-scoped, so the lookup works
    // regardless of the admin's active scope). Defaults to 'PY' if not found.
    const property = await AddModel.findOne({ ppcId: Number(ppcId) }).select('base').lean();
    const base = property && property.base === 'CH' ? 'CH' : 'PY';

    const updatedMessage = await PropertyMessage.findOneAndUpdate(
      { ppcId },
      {
        $set: {
          enumMessage,
          customMessage,
          setBy,
          setAt: new Date(),
        },
        $setOnInsert: { base },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Property message set successfully', data: updatedMessage });
  } catch (err) {
    console.error('Error setting property message:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// GET /admin/property-messages
router.get('/get-property-messages', async (req, res) => {
  try {
    const messages = await PropertyMessage.find().sort({ setAt: -1 });

    res.json({
      success: true,
      total: messages.length,
      message: 'All property messages fetched successfully',
      data: messages,
    });
  } catch (err) {
    console.error('Error fetching all property messages:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// GET /user/property-message/:ppcId
router.get('/user/property-message/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;

    const messageDoc = await PropertyMessage.findOne({ ppcId });

    if (!messageDoc) {
      return res.status(404).json({ success: false, message: 'No message found for this property' });
    }

    res.json({
      success: true,
      data: {
        ppcId: messageDoc.ppcId,
        message: messageDoc.enumMessage || messageDoc.customMessage,
        messageType: messageDoc.enumMessage ? 'enum' : 'custom',
        setAt: messageDoc.setAt,
        setBy: messageDoc.setBy,
      },
    });
  } catch (err) {
    console.error('Error fetching property message:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.delete('/admin/property-message/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;

    const deleted = await PropertyMessage.findOneAndDelete({ ppcId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'No property message found to delete' });
    }

    res.json({ success: true, message: 'Property message deleted successfully', data: deleted });
  } catch (err) {
    console.error('Error deleting property message:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.put('/admin/property-message/:ppcId', async (req, res) => {
  try {
    const { ppcId } = req.params;
    const { enumMessage = null, customMessage = null, setBy = 'Admin' } = req.body;

    if (!enumMessage && !customMessage) {
      return res.status(400).json({ success: false, message: 'Provide either enumMessage or customMessage' });
    }

    const validEnums = ['Sold Out', 'Waiting', 'Available', 'Coming Soon', 'Under Process', 'Blocked', 'Other'];
    if (enumMessage && !validEnums.includes(enumMessage)) {
      return res.status(400).json({ success: false, message: 'Invalid enumMessage value' });
    }

    const updatedMessage = await PropertyMessage.findOneAndUpdate(
      { ppcId },
      {
        enumMessage,
        customMessage,
        setBy,
        setAt: new Date(),
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: 'Property message not found to update' });
    }

    res.json({ success: true, message: 'Property message updated successfully', data: updatedMessage });
  } catch (err) {
    console.error('Error updating property message:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



module.exports = router;
