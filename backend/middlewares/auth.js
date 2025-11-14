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

        // Store Firebase email in request for email sending
        // For OAuth users, decodedToken.email might be undefined
        // So we need to fetch from Firebase Admin SDK
        let firebaseEmail = decodedToken.email;
        
        if (!firebaseEmail) {
            try {
                // Fetch user details from Firebase Admin SDK
                // This includes email, provider data, custom claims, etc.
                const firebaseUser = await admin.auth().getUser(decodedToken.uid);
                firebaseEmail = firebaseUser.email;
                
                console.log('Firebase User Details Retrieved:');
                console.log('  Email:', firebaseUser.email);
                console.log('  Display Name:', firebaseUser.displayName);
                console.log('  Providers:', firebaseUser.providerData?.map(p => p.providerId));
                
                if (!firebaseEmail && firebaseUser.providerData && firebaseUser.providerData.length > 0) {
                    // Sometimes OAuth providers store email in providerData
                    firebaseEmail = firebaseUser.providerData[0].email;
                    console.log('  Email from providerData:', firebaseEmail);
                }
                
                console.log('Fetched email from Firebase Admin SDK:', firebaseEmail);
            } catch (error) {
                console.warn('Could not fetch email from Firebase Admin SDK:', error.message);
            }
        }
        
        req.user = user;
        req.user.firebaseEmail = firebaseEmail;
        
        console.log('Auth Middleware - Firebase Token Verified:');
        console.log('  Firebase UID:', decodedToken.uid);
        console.log('  Firebase Email:', firebaseEmail);
        console.log('  Provider:', decodedToken.firebase?.sign_in_provider || 'unknown');
        console.log('  User MongoDB Email:', user.email);
        
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