const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ALLOWED_ADMIN_EMAILS = [
    'balaji.bt22@bitsathy.ac.in',
    'santhoshkumar.bt22@bitsathy.ac.in',
    'padmaja.bt22@bitsathy.ac.in',
    'bhuvaneshwar.cs22@bitsathy.ac.in'
];

// @desc    Google Sign-In
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        console.log("Google Login Attempt - Token received:", !!idToken);
        console.log("Google Client ID from ENV:", process.env.GOOGLE_CLIENT_ID);

        if (!idToken) {
            return res.status(400).json({ message: 'Google ID Token is required' });
        }

        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;
        console.log("Google Payload:", { email, name, googleId });

        // 2. Find or Create User
        let user = await User.findOne({ email });

        if (user) {
            // Sync credentials and role
            if (!user.googleId) user.googleId = googleId;
            
            // If email is in allowed list, ensure they have admin rights
            if (ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())) {
                user.isAdmin = true;
                user.isVerified = true;
            }
            
            await user.save();
        } else {
            // Create new patient
            const isAuthorizedAdmin = ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
            user = await User.create({
                name,
                email,
                googleId,
                isDoctor: false, // Default to patient
                isAdmin: isAuthorizedAdmin,
                isVerified: true // Google accounts are pre-verified
            });
            console.log(`Backend: Created new user ${email}. isAdmin: ${user.isAdmin}`);
        }

        if (user) {
            console.log(`Backend: User ${user.email} found. isAdmin: ${user.isAdmin}`);
            if (user.isAdmin && !ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                return res.status(401).json({ message: 'Unauthorized admin access' });
            }

            generateToken(res, user._id, user.isAdmin, user.isDoctor);
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isDoctor: user.isDoctor,
                isAdmin: user.isAdmin,
                picture: picture
            });
            console.log(`Backend: Sent response for ${user.email} with isAdmin: ${user.isAdmin}`);
        } else {
            res.status(400).json({ message: 'User could not be created' });
        }
    } catch (error) {
        console.error("Google Login Catch Error:", error);
        res.status(500).json({ message: 'Google Login failed: ' + error.message });
    }
};

module.exports = { googleLogin };
