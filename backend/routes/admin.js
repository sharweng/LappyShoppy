const express = require('express');
const router = express.Router();
const User = require('../models/user');
const mongoose = require('mongoose');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Deactivate a user
router.put('/admin/users/:id/deactivate', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin' });
    user.isDeactivated = true;
    await user.save();
    res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deactivating user' });
  }
});

// Activate a user
router.put('/admin/users/:id/activate', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isDeactivated = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User activated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error activating user' });
  }
});

// Batch deactivate users
router.put('/admin/users/batch/deactivate', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ success: false, message: 'User IDs required' });
    const objectIds = userIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        console.error('Invalid ObjectId:', id);
        return null;
      }
    }).filter(id => id !== null);
    await User.updateMany(
      { _id: { $in: objectIds }, role: { $ne: 'admin' } },
      { isDeactivated: true }
    );
    res.status(200).json({ success: true, message: 'Users deactivated' });
  } catch (err) {
    console.error('Batch deactivate error:', err);
    res.status(500).json({ success: false, message: 'Error deactivating users' });
  }
});

// Batch activate users
router.put('/admin/users/batch/activate', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ success: false, message: 'User IDs required' });
    const objectIds = userIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        console.error('Invalid ObjectId:', id);
        return null;
      }
    }).filter(id => id !== null);
    await User.updateMany(
      { _id: { $in: objectIds } },
      { isDeactivated: false }
    );
    res.status(200).json({ success: true, message: 'Users activated' });
  } catch (err) {
    console.error('Batch activate error:', err);
    res.status(500).json({ success: false, message: 'Error activating users' });
  }
});

module.exports = router;
