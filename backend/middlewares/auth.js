const User = require('../models/user')
const admin = require('../config/firebase')

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Login first to access this resource' })
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Login first to access this resource' })
        }

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Find user by Firebase UID
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        req.user = user;
        next()
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
};

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {
        // console.log(roles, req.user, req.body);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to acccess this resource` })

        }
        next()
    }
}