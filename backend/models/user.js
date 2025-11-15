const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Your name cannot exceed 30 characters']
    },
    username: {
        type: String,
        required: [true, 'Please enter a username'],
        unique: true,
        trim: true,
        lowercase: true,
        minLength: [3, 'Username must be at least 3 characters'],
        maxLength: [20, 'Username cannot exceed 20 characters'],
        validate: {
            validator: function(v) {
                // No spaces allowed in username
                return /^\S+$/.test(v);
            },
            message: 'Username cannot contain spaces'
        }
    },
    email: {
        type: String,
        required: false, // Optional since Firebase handles auth
        unique: true,
        sparse: true, // Allow null values but enforce uniqueness when present
        validate: {
            validator: function(v) {
                // Only validate if email is provided
                return !v || validator.isEmail(v);
            },
            message: 'Please enter valid email address'
        }
    },
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true // Allow null values but enforce uniqueness when present
    },
    password: {
        type: String,
        required: false, // Password is optional since Firebase handles auth
        minlength: [6, 'Your password must be longer than 6 characters'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: false
        },
        url: {
            type: String,
            required: false
        }
    },
    role: {
        type: String,
        default: 'user'
    },
    isDeactivated: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
})
userSchema.pre('save', async function (next) {
    // Only hash password if it exists and has been modified
    if (!this.password || !this.isModified('password')) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    next()
});

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Set token expire time
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

    return resetToken

}

module.exports = mongoose.model('User', userSchema);