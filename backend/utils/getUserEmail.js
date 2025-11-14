const admin = require('../config/firebase');
const User = require('../models/user');

/**
 * Get user email - first from MongoDB, then from Firebase
 * @param {Object} user - User object from MongoDB
 * @returns {Promise<string>} User's email
 */
const getUserEmail = async (user) => {
    try {
        // First try MongoDB email
        if (user.email) {
            return user.email;
        }

        // If not in MongoDB, fetch from Firebase using UID
        if (user.firebaseUid) {
            const firebaseUser = await admin.auth().getUser(user.firebaseUid);
            return firebaseUser.email;
        }

        throw new Error('No email found for user');
    } catch (error) {
        console.error('Error getting user email:', error);
        throw new Error('Unable to retrieve user email');
    }
};

module.exports = { getUserEmail };
