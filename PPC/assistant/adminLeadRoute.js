// Admin-side routes for AI-assistant owner leads. Mounted under /PPC (same open
// posture as the rest of the admin API — the admin app has no auth layer).
//
//   GET  /PPC/assistant/admin/owner-leads                 list (newest first, ?status=)
//   PUT  /PPC/assistant/admin/owner-leads/:id              update follow-up
//   POST /PPC/assistant/admin/owner-leads/:id/preapprove   -> create a PreApproved
//        property (status 'complete', NEVER 'active'/live) and mark the lead.

const express = require('express');
const OwnerLead = require('./store/OwnerLeadModel');
const AddModel = require('../AddModel');

const router = express.Router();

router.get('/assistant/admin/owner-leads', async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const leads = await OwnerLead.find(q).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ success: true, count: leads.length, leads });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/assistant/admin/owner-leads/:id', async (req, res) => {
  try {
    const patch = {};
    ['status', 'remark', 'calledBy'].forEach((k) => {
      if (req.body[k] !== undefined) patch[k] = String(req.body[k]).slice(0, 500);
    });
    if (req.body.followupDate) patch.followupDate = new Date(req.body.followupDate);
    const lead = await OwnerLead.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true });
    if (!lead) return res.status(404).json({ success: false, error: 'lead_not_found' });
    res.json({ success: true, lead });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Convert a lead into a PreApproved property. status is forced to 'complete' so it
// lands on the PreApproved page; it is NEVER 'active', so it does not go live until
// an admin approves it there. Defaults fill the required fields the chat didn't ask.
router.post('/assistant/admin/owner-leads/:id/preapprove', async (req, res) => {
  try {
    const lead = await OwnerLead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'lead_not_found' });
    if (lead.ppcId) {
      return res.status(409).json({ success: false, error: 'already_preapproved', ppcId: lead.ppcId });
    }

    const latest = await AddModel.findOne().sort({ ppcId: -1 }).select('ppcId').lean();
    const ppcId = latest && latest.ppcId ? latest.ppcId + 1 : 1001;

    const phoneNumber = String(lead.contactPhone || lead.phone || '').replace(/\D/g, '').slice(-10);

    // Map lead -> property. Defaults satisfy the required fields the completeness
    // check looks at (propertyMode, propertyType, price, totalArea, areaUnit,
    // salesType, postedBy) so the property computes as complete and appears on the
    // PreApproved page.
    const doc = new AddModel({
      ppcId,
      phoneNumber,
      countryCode: '+91',
      propertyMode: lead.propertyMode || 'Sale',
      propertyType: lead.propertyType || 'Individual House',
      postedBy: lead.postedBy || 'Owner',
      salesType: lead.salesType || 'Direct',
      price: Number(lead.price) || 0,
      floorNo: lead.floorNo || '0',
      bedrooms: lead.bedrooms || '1',
      carParking: lead.carParking || 'No',
      lift: lead.lift || 'No',
      totalArea: Number(lead.totalArea) || 500,
      areaUnit: lead.areaUnit || 'Sqft',
      area: lead.area || '',
      streetName: lead.streetName || '',
      pinCode: Number(lead.pinCode) || undefined,
      city: 'Puducherry',
      district: 'Puducherry',
      state: 'Puducherry',
      base: 'PY',
      // Explicitly NOT 'active' — sits in PreApproved until an admin approves it.
      status: 'complete',
      addedBy: 'AI Assistant',
    });
    await doc.save();

    lead.status = 'preapproved';
    lead.ppcId = ppcId;
    await lead.save();

    res.json({ success: true, ppcId, message: 'Lead sent to PreApproved (not live).' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
