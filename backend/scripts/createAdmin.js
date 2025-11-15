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

// Default admin avatar (a simple blue background with "A" letter)
const DEFAULT_ADMIN_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzM3NTFGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QTwvdGV4dD48L3N2Zz4=';

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB Database connected');

        // Check if admin already exists
        const adminEmail = 'admin@lappyshoppy.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('\n⚠️  Admin user already exists!');
            console.log('==========================================');
            console.log('Email:', adminEmail);
            console.log('Role:', existingAdmin.role);
            console.log('==========================================');
            console.log('\nTo create a new admin:');
            console.log('1. Delete the existing user from MongoDB');
            console.log('2. Run this script again');
            console.log('\nOR update the email in this script to create another admin.\n');
            process.exit(0);
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

        // Admin data - NO PASSWORD (Firebase handles authentication)
        const adminData = {
            name: 'Admin',
            username: 'admin',
            email: adminEmail,
            role: 'admin',
            avatar: avatarData
        };

        // Create admin user in MongoDB (without password)
        const admin = await User.create(adminData);

        console.log('\n✅ Admin user created in MongoDB successfully!');
        console.log('==========================================');
        console.log('Email:', adminEmail);
        console.log('Role:', admin.role);
        console.log('==========================================');
        console.log('\n📝 NEXT STEPS - Setup Firebase Authentication:');
        console.log('1. Go to: https://console.firebase.google.com');
        console.log('2. Select your project > Authentication > Users');
        console.log('3. Click "Add user"');
        console.log('4. Email:', adminEmail);
        console.log('5. Password: admin123 (or your preferred password)');
        console.log('6. Click "Add user"');
        console.log('\n✅ Then you can login with:');
        console.log('   Email:', adminEmail);
        console.log('   Password: (the one you set in Firebase)');
        console.log('\n💡 NOTE:');
        console.log('   - MongoDB stores: name, email, role, avatar');
        console.log('   - Firebase stores: email, password, authentication');
        console.log('   - Login happens through Firebase');
        console.log('   - Role (admin) is checked from MongoDB\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
