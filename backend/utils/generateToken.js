const jwt = require('jsonwebtoken');

const generateToken = (res, userId, isAdmin, isDoctor) => {
    const token = jwt.sign(
        { userId, isAdmin, isDoctor },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
    );

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: false, // false for local dev
        sameSite: 'lax', // lax is needed for cross-port dev proxy
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
    });
};

module.exports = generateToken;
