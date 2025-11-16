const mongoose = require('mongoose');
const User = require('../models/user');
const cloudinary = require('cloudinary');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Import Firebase Admin SDK
const firebaseAdmin = require('../config/firebase');

// Default admin avatar (a simple blue background with "A" letter)
const DEFAULT_ADMIN_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QTwvdGV4dD48L3N2Zz4=';

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB Database connected');

        // Check if admin already exists and delete them
        const adminEmail = 'admin@lappyshoppy.com';
        const existingAdmins = await User.find({ role: 'admin' });

        if (existingAdmins.length > 0) {
            console.log(`\n🔍 Found ${existingAdmins.length} existing admin user(s). Deleting from MongoDB and Firebase...\n`);

            for (const admin of existingAdmins) {
                try {
                    // Delete from Firebase if they have a Firebase UID
                    if (admin.firebaseUid) {
                        await firebaseAdmin.auth().deleteUser(admin.firebaseUid);
                        console.log(`   🗑️  Deleted from Firebase: ${admin.username} (${admin.firebaseUid})`);
                    }

                    // Delete from MongoDB
                    await User.findByIdAndDelete(admin._id);
                    console.log(`   🗑️  Deleted from MongoDB: ${admin.username} (${admin._id})`);
                } catch (deleteError) {
                    console.log(`   ⚠️  Failed to delete admin ${admin.username}: ${deleteError.message}`);
                }
            }
            console.log('✅ Existing admin users cleared from database and Firebase\n');
        }

        // Upload default avatar to Cloudinary
        console.log('Uploading admin avatar to Cloudinary...');
        let avatarData = {
            public_id: 'default_admin_avatar',
            url: 'https://res.cloudinary.com/dcug5cq7c/image/upload/v1234567890/default-avatar.png'
        };
        
        try {
            const result = await cloudinary.v2.uploader.upload(DEFAULT_ADMIN_AVATAR, {
                folder: 'avatars',
                width: 150,
                crop: "scale",
                timeout: 60000
            });
            avatarData = {
                public_id: result.public_id,
                url: result.secure_url
            };
            console.log('Avatar uploaded successfully');
        } catch (uploadError) {
            console.log('Avatar upload failed, using default');
        }

        // Create Firebase user for authentication
        console.log('Creating admin user in Firebase...');
        const adminPassword = 'admin123';
        let firebaseUser;
        
        try {
            firebaseUser = await firebaseAdmin.auth().createUser({
                email: adminEmail,
                password: adminPassword,
                displayName: 'Admin',
                emailVerified: true
            });
            console.log('Firebase user created successfully');
        } catch (firebaseError) {
            console.error('Failed to create Firebase user:', firebaseError.message);
            
            // If user already exists in Firebase, try to get the existing user
            if (firebaseError.code === 'auth/email-already-in-use') {
                try {
                    firebaseUser = await firebaseAdmin.auth().getUserByEmail(adminEmail);
                    console.log('Using existing Firebase user');
                } catch (getUserError) {
                    console.error('Failed to get existing Firebase user:', getUserError.message);
                    throw new Error('Firebase user creation failed');
                }
            } else {
                throw firebaseError;
            }
        }

        // Admin data with Firebase UID
        const adminData = {
            name: 'Admin',
            username: 'admin',
            email: adminEmail,
            firebaseUid: firebaseUser.uid,
            role: 'admin',
            avatar: avatarData
        };

        // Create admin user in MongoDB
        const admin = await User.create(adminData);

        console.log('\n✅ Admin user created successfully!');
        console.log('==========================================');
        console.log('Email:', adminEmail);
        console.log('Password: admin123');
        console.log('Role:', admin.role);
        console.log('Firebase UID:', firebaseUser.uid);
        console.log('==========================================');
        console.log('\n🎉 ADMIN SETUP COMPLETE!');
        console.log('\n✅ You can now login with:');
        console.log('   Email:', adminEmail, ' or Username: admin');
        console.log('   Password: admin123');
        console.log('\n💡 NOTE:');
        console.log('   - Both Firebase and MongoDB entries created automatically');
        console.log('   - Firebase handles authentication (email/password)');
        console.log('   - MongoDB stores user profile and role information');
        console.log('   - Admin role is checked from MongoDB\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
