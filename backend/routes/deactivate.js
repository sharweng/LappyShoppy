const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Deactivate a user (set isDeactivated)
router.put('/admin/user/:username/deactivate', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ success: false, message: 'Username required' });
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin' });
    if (user.isDeactivated) return res.status(400).json({ success: false, message: 'User already deactivated' });
    user.isDeactivated = true;
    await user.save();
    res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deactivating user' });
  }
});

// Activate a user (unset isDeactivated)
router.put('/admin/user/:username/activate', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ success: false, message: 'Username required' });
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isDeactivated = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User activated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error activating user' });
  }
});

// Get all deactivated users
router.get('/admin/deactivated-users', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const list = await User.find({ isDeactivated: true });
    res.status(200).json({ success: true, users: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching deactivated users' });
  }
});

module.exports = router;
