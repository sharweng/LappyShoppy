const User = require('../models/user');
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail');
const { getForgotPasswordEmail } = require('../utils/emailTemplates');

exports.registerUser = async (req, res, next) => {
    try {
        console.log('Registration request received');
        console.log('Email:', req.body.email);
        console.log('Name:', req.body.name);
        console.log('Has avatar:', !!req.body.avatar);
        console.log('Firebase UID:', req.body.firebaseUid);
        
        const { name, email, password, avatar, firebaseUid } = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a name' 
            });
        }
        
        // For Firebase users, firebaseUid is required. For email/password users, email and password are required
        if (!firebaseUid && (!email || !password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password, or use social login' 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                ...(email ? [{ email }] : []),
                ...(firebaseUid ? [{ firebaseUid }] : [])
            ].filter(condition => Object.keys(condition).length > 0)
        });
        
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(200).json({ 
                success: true, 
                user: existingUser,
                token: existingUser.getJwtToken(),
                message: 'User already registered'
            });
        }
        
        let avatarData = {
            public_id: 'default_avatar',
            url: 'https://res.cloudinary.com/dcug5cq7c/image/upload/v1234567890/default-avatar.png'
        };
        
        // Upload avatar to Cloudinary if provided
        if (avatar && avatar.startsWith('data:image')) {
            console.log('Uploading avatar to Cloudinary...');
            try {
                const result = await cloudinary.v2.uploader.upload(avatar, {
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
                console.error('Avatar upload failed:', uploadError.message);
                // Continue with default avatar if upload fails
            }
        }
        
        // Create user
        console.log('Creating user in MongoDB...');
        const userData = {
            name,
            avatar: avatarData
        };
        
        // Add email if provided
        if (email) {
            userData.email = email;
        }
        
        // Add Firebase UID if provided
        if (firebaseUid) {
            userData.firebaseUid = firebaseUid;
        }
        
        // Only add password if provided (for password reset functionality)
        if (password) {
            userData.password = password;
        }
        
        const user = await User.create(userData);
        
        console.log('User created successfully:', user._id);
        
        // Generate token
        const token = user.getJwtToken();

        return res.status(201).json({
            success: true,
            user,
            token
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error during registration'
        });
    }
}

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    // Checks if email and password is entered by user
    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter email & password' })
    }


    // Finding user in database

    let user = await User.findOne({ email }).select('+password')
    if (!user) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }


    // Checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);


    if (!isPasswordMatched) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }
    const token = user.getJwtToken();

    res.status(201).json({
        success: true,
        token,
        user
    });
    //  user = await User.findOne({ email })
    // sendToken(user, 200, res)
}

exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })

    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const resetUrl = `${req.protocol}://localhost:5173/password/reset/${resetToken}`;
    
    try {
        // Get professional HTML email template
        const htmlEmail = getForgotPasswordEmail(resetUrl, user.name);

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request - LappyShoppy',
            html: htmlEmail
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message })
      
    }
}

exports.resetPassword = async (req, res, next) => {
    console.log(req.params.token)
    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    console.log(user)

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })
        
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })

    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });
   
}

// Verify reset token - returns user email if valid
exports.verifyResetToken = async (req, res, next) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Password reset token is invalid or has expired' 
            });
        }

        return res.status(200).json({
            success: true,
            email: user.email
        });
    } catch (error) {
        console.error('Verify reset token error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error verifying reset token' 
        });
    }
}

// Reset password using Firebase
exports.resetPasswordWithFirebase = async (req, res, next) => {
    try {
        const admin = require('../config/firebase');
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Password reset token is invalid or has expired' 
            });
        }

        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters' 
            });
        }

        // Update password in Firebase using Admin SDK
        try {
            // Get user from Firebase by email
            const firebaseUser = await admin.auth().getUserByEmail(user.email);
            
            // Update the password
            await admin.auth().updateUser(firebaseUser.uid, {
                password: newPassword
            });

            // Clear reset token in MongoDB
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (firebaseError) {
            console.error('Firebase password update error:', firebaseError);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to update password in authentication system' 
            });
        }
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error resetting password' 
        });
    }
}

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(user)

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updateProfile = async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // Update avatar
    if (req.body.avatar !== '') {
        let user = await User.findById(req.user.id)
        // console.log(user)
        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);
        // console.log("Res", res)
        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })
    if (!user) {
        return res.status(401).json({ message: 'User Not Updated' })
    }

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updatePassword = async (req, res, next) => {
    console.log(req.body.password)
    const user = await User.findById(req.user.id).select('+password');
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user,
        token
    });

}

exports.allUsers = async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
}

exports.deleteUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(401).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    // Remove avatar from cloudinary
    const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
        success: true,
    })
}

exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
}

exports.updateUser = async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        // useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}