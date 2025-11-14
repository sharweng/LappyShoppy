const admin = require('../config/firebase');
const User = require('../models/user');

/**
 * Get user email - first from MongoDB, then from Firebase Admin SDK
 * Handles both regular and OAuth users
 * @param {Object} user - User object from MongoDB
 * @returns {Promise<string>} User's email
 */
const getUserEmail = async (user) => {
    try {
        console.log('getUserEmail Debug:');
        console.log('  User object exists:', !!user);
        console.log('  MongoDB email:', user?.email);
        console.log('  Firebase UID:', user?.firebaseUid);
        
        // First try MongoDB email (for email/password users or if stored)
        if (user.email) {
            console.log('  ✓ Using MongoDB email:', user.email);
            return user.email;
        }

        // If not in MongoDB, fetch from Firebase Admin SDK using UID
        if (user.firebaseUid) {
            console.log('  Fetching from Firebase Admin SDK with UID:', user.firebaseUid);
            const firebaseUser = await admin.auth().getUser(user.firebaseUid);
            
            console.log('  Firebase User Details:');
            console.log('    Primary email:', firebaseUser.email);
            console.log('    Display Name:', firebaseUser.displayName);
            console.log('    Providers:', firebaseUser.providerData?.map(p => p.providerId));
            
            // Try primary Firebase email first
            let emailToUse = firebaseUser.email;
            
            // If missing, check provider data (for OAuth users)
            if (!emailToUse && firebaseUser.providerData && firebaseUser.providerData.length > 0) {
                emailToUse = firebaseUser.providerData[0].email;
                console.log('    Email from providerData:', emailToUse);
            }
            
            if (emailToUse) {
                console.log('  ✓ Using Firebase email:', emailToUse);
                return emailToUse;
            }
            
            throw new Error('No email in Firebase user profile');
        }

        throw new Error('No email found for user - no MongoDB email and no firebaseUid');
    } catch (error) {
        console.error('Error getting user email:', error.message);
        console.error('  Error Details:', error);
        throw new Error('Unable to retrieve user email');
    }
};

module.exports = { getUserEmail };
