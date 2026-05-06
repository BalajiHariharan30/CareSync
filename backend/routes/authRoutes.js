const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    addFamilyMember,
    addHealthVitals,
    verifyEmail,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { googleLogin } = require('../controllers/googleAuthController');
const { getEhrSummary } = require('../controllers/ehrController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.post('/family', protect, addFamilyMember);
router.post('/health-tracker', protect, addHealthVitals);
router.get('/ehr-summary', protect, getEhrSummary);

// Email Verification & Password Reset
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
