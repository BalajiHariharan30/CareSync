const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ALLOWED_ADMIN_EMAILS = [
    'balaji.bt22@bitsathy.ac.in',
    'santhoshkumar.bt22@bitsathy.ac.in',
    'padmaja.bt22@bitsathy.ac.in',
    'bhuvaneshwar.cs22@bitsathy.ac.in'
];

// @desc    Register a new user (Patient or Admin initially, Doctor uses separate flow or flag)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        console.log("Registration requested:", req.body);
        const { name, email, password, isDoctor } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include letters, numbers, and a special character.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            isDoctor: isDoctor || false,
            isAdmin: ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase()),
            verificationToken,
            verificationTokenExpire,
        });

        if (user) {
            // Send verification email
            const verificationUrl = `http://localhost:5172/verify/${verificationToken}`;
            const message = `Welcome to CareSync! Please verify your email by clicking the link: ${verificationUrl}`;
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to CareSync</h2>
                    <p>Thank you for registering. Please click the button below to verify your email and activate your account:</p>
                    <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                    <p>This link will expire in 24 hours.</p>
                </div>
            `;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify Your CareSync Account',
                    message,
                    html,
                });

                res.status(201).json({
                    message: 'Registration successful. Please check your email to verify your account.',
                    email: user.email,
                });
            } catch (emailError) {
                console.error("Verification email failed:", emailError);
                res.status(201).json({
                    message: 'User registered, but verification email failed to send. Please contact support.',
                    email: user.email,
                });
            }
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        console.log("Login requested:", req.body.email);
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (!user.isVerified && !user.isDoctor && !user.isAdmin) {
                return res.status(401).json({ message: 'Please verify your email first' });
            }

            if (user.isAdmin && !ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                return res.status(401).json({ message: 'Unauthorized admin access' });
            }

            generateToken(res, user._id, user.isAdmin, user.isDoctor);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                isDoctor: user.isDoctor,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a family member to user profile
// @route   POST /api/auth/family
// @access  Private
const addFamilyMember = async (req, res) => {
    try {
        const { name, relation, age, gender } = req.body;
        const user = await User.findById(req.user.userId || req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.familyMembers.push({ name, relation, age, gender });
        await user.save();

        res.status(201).json(user.familyMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add health vitals entry to tracker
// @route   POST /api/auth/health-tracker
// @access  Private
const addHealthVitals = async (req, res) => {
    try {
        const { bloodPressure, sugarLevel, weight, temperature } = req.body;
        const user = await User.findById(req.user.userId || req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.healthTracker.push({
            bloodPressure,
            sugarLevel,
            weight,
            temperature,
            date: new Date()
        });
        await user.save();

        res.status(201).json(user.healthTracker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify email token
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins
        await user.save();

        const resetUrl = `http://localhost:5172/reset-password/${resetToken}`;
        const message = `You requested a password reset. Please use the following link to set a new password: ${resetUrl}`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your CareSync password. Click the button below to proceed:</p>
                <a href="${resetUrl}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                <p>If you did not request this, please ignore this email. Link expires in 30 minutes.</p>
            </div>
        `;

        await sendEmail({ email: user.email, subject: 'CareSync Password Reset', message, html });
        res.json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(req.body.password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include letters, numbers, and a special character.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ message: 'Password reset successful! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    addFamilyMember,
    addHealthVitals,
    verifyEmail,
    forgotPassword,
    resetPassword,
};
