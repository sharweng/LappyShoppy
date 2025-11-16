const mongoose = require('mongoose');
const User = require('../models/user');
const admin = require('../config/firebase');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Sample user data generator
const firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa',
    'Robert', 'Maria', 'James', 'Anna', 'William', 'Jennifer', 'Daniel', 'Michelle',
    'Matthew', 'Amanda', 'Joseph', 'Jessica', 'Andrew', 'Ashley', 'Ryan', 'Stephanie'
];

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'
];

const generateRandomName = () => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
};

const addSampleUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB Database connected\n');

        // Clear existing non-admin users from both MongoDB and Firebase
        console.log('🔍 Checking for existing non-admin users...');
        const existingNonAdminUsers = await User.find({ role: { $ne: 'admin' } });

        if (existingNonAdminUsers.length > 0) {
            console.log(`Found ${existingNonAdminUsers.length} non-admin users. Deleting from MongoDB and Firebase...\n`);

            for (const user of existingNonAdminUsers) {
                try {
                    // Delete from Firebase if they have a Firebase UID
                    if (user.firebaseUid) {
                        await admin.auth().deleteUser(user.firebaseUid);
                        console.log(`   🗑️  Deleted from Firebase: ${user.username} (${user.firebaseUid})`);
                    }

                    // Delete from MongoDB
                    await User.findByIdAndDelete(user._id);
                    console.log(`   🗑️  Deleted from MongoDB: ${user.username} (${user._id})`);
                } catch (deleteError) {
                    console.log(`   ⚠️  Failed to delete user ${user.username}: ${deleteError.message}`);
                }
            }
            console.log('✅ Non-admin users cleared from database and Firebase\n');
        }

        console.log('🔄 Adding 24 sample users to Firebase and MongoDB...\n');

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i <= 24; i++) {
            try {
                const username = `user${i}`;
                const email = `user${i}@example.com`;
                const password = 'password123';
                const name = generateRandomName();

                console.log(`Creating user ${i}: ${name} (${username})`);

                // Step 1: Create user in Firebase
                let firebaseUser;
                try {
                    firebaseUser = await admin.auth().createUser({
                        email: email,
                        password: password,
                        displayName: name,
                        emailVerified: true
                    });
                    console.log(`   ✅ Created in Firebase: ${firebaseUser.uid}`);
                } catch (firebaseError) {
                    console.error(`   ❌ Firebase creation failed for ${username}:`, firebaseError.message);
                    // If Firebase creation fails, skip this user
                    errorCount++;
                    continue;
                }

                // Step 2: Create user in MongoDB with Firebase UID
                try {
                    const userData = {
                        name,
                        username: username.toLowerCase(),
                        email,
                        firebaseUid: firebaseUser.uid
                        // No password in MongoDB - Firebase handles authentication
                    };

                    const mongoUser = await User.create(userData);
                    console.log(`   ✅ Created in MongoDB: ${mongoUser._id}\n`);
                    successCount++;
                } catch (mongoError) {
                    console.error(`   ❌ MongoDB creation failed for ${username}:`, mongoError.message);
                    // If MongoDB creation fails, delete the Firebase user
                    try {
                        await admin.auth().deleteUser(firebaseUser.uid);
                        console.log(`   🗑️  Cleaned up Firebase user due to MongoDB error`);
                    } catch (cleanupError) {
                        console.log(`   ⚠️  Failed to cleanup Firebase user: ${cleanupError.message}`);
                    }
                    errorCount++;
                }

            } catch (error) {
                console.error(`❌ Error creating user${i}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n==========================================');
        console.log('Sample Users Summary:');
        console.log(`✅ Successfully added: ${successCount} users`);
        console.log(`❌ Failed: ${errorCount} users`);
        console.log('==========================================\n');

        console.log('\n🎉 Sample users have been added to both Firebase and MongoDB!');
        console.log('\n📝 User Details:');
        console.log('- Username: user1, user2, ..., user24');
        console.log('- Password: password123 (for all users)');
        console.log('- Email: user1@example.com, user2@example.com, etc.');
        console.log('- Names: Randomly generated');
        console.log('- Authentication: Firebase (can login through frontend)');
        console.log('\n💡 You can now use these users to test the application');
        console.log('💡 Non-admin users were cleared before adding new ones');

        process.exit(0);
    } catch (error) {
        console.error('Error adding sample users:', error);
        process.exit(1);
    }
};

addSampleUsers();