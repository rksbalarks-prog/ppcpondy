// routes/rolePermissions.js
const express = require('express');
const router = express.Router();
const RolePermission = require('../AdminRolls/AdminRollModel');

//  -- GET: Fetch all role permissions -------------------------------------------
router.get('/get-role-permissions', async (req, res) => {
  try {
    const permissions = await RolePermission.find({});
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch permissions', error: error.message });
  }
});
 
// -- GET: Fetch permissions for a specific role --------------------------------
router.get('/get-role-permissions/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const permission = await RolePermission.findOne({ role });
    if (!permission) {
      return res.status(200).json({ role, viewedFiles: [] });
    }
    res.status(200).json(permission);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch permissions', error: error.message });
  }
});
 
// -- POST: Create or update role permissions (upsert) -------------------------
//   Body: { role: "manager", viewedFiles: ["Statistics", "Login Report", ...] }
router.post('/update-role-permissions', async (req, res) => {
  try {
    const { role, viewedFiles } = req.body;
 
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
 
    const updated = await RolePermission.findOneAndUpdate(
      { role },
      { role, viewedFiles: viewedFiles || [] },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
 
    res.status(200).json({
      message: 'Permissions updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update permissions', error: error.message });
  }
});
 
// -- POST: Bulk update multiple roles at once ----------------------------------
//   Body: [{ role: "admin", viewedFiles: [...] }, { role: "manager", viewedFiles: [...] }]
router.post('/bulk-update-role-permissions', async (req, res) => {
  try {
    const updates = req.body; // array of { role, viewedFiles }
 
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Body must be an array of role-permission objects' });
    }
 
    const results = await Promise.all(
      updates.map(({ role, viewedFiles }) =>
        RolePermission.findOneAndUpdate(
          { role },
          { role, viewedFiles: viewedFiles || [] },
          { upsert: true, new: true }
        )
      )
    );
 
    res.status(200).json({ message: 'Bulk update successful', data: results });
  } catch (error) {
    res.status(500).json({ message: 'Bulk update failed', error: error.message });
  }
});
 
// -- DELETE: Remove a role's permissions entry ---------------------------------
router.delete('/delete-role-permissions/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const deleted = await RolePermission.findOneAndDelete({ role });
    if (!deleted) {
      return res.status(404).json({ message: 'Role permissions not found' });
    }
    res.status(200).json({ message: 'Role permissions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete permissions', error: error.message });
  }
});
 
module.exports = router;