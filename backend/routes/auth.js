const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { 
    registerUser,
    loginUser,
    getUserEmail,
    checkUsername,
    forgotPassword,
    resetPassword,
    verifyResetToken,
    resetPasswordWithFirebase,
    getUserProfile,
    updateProfile,
    updatePassword,
     allUsers,
    deleteUser,
    getUserDetails,
    updateUser,
} = require('../controllers/auth');


const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/auth')
const checkDeactivated = require('../middlewares/checkDeactivated');

router.post('/register', checkDeactivated, registerUser);
router.post('/login', checkDeactivated, loginUser);
router.post('/get-user-email', getUserEmail);
router.post('/check-username', checkUsername);
router.post('/password/forgot', forgotPassword);
router.get('/password/reset/:token/verify', verifyResetToken);
router.post('/password/reset/:token/auth', resetPasswordWithFirebase);
router.put('/password/reset/:token', resetPassword);
router.get('/me',  isAuthenticatedUser, getUserProfile)
router.put('/me/update', isAuthenticatedUser,  upload.single("avatar"), updateProfile)
router.put('/password/update', isAuthenticatedUser, updatePassword)
router.get('/admin/users', isAuthenticatedUser, authorizeRoles('admin'), allUsers)

router.route('/admin/user/:id').get(isAuthenticatedUser, getUserDetails ).delete(isAuthenticatedUser, deleteUser).put(isAuthenticatedUser,  updateUser)

module.exports = router;