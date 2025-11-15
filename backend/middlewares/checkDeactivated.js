const User = require('../models/user');

// Middleware to check if user is deactivated
const checkDeactivated = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.username || req.body.identifier;
    if (!identifier) return next();
    let user;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ username: identifier.toLowerCase() });
    }
    if (user && user.isDeactivated) {
      return res.status(403).json({ success: false, message: 'User account is deactivated.' });
    }
    next();
  } catch (err) {
    next();
  }
};

module.exports = checkDeactivated;
