const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    // Check cookies for token
    token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded; // we will store userId, role (isAdmin, isDoctor) in token
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const doctor = (req, res, next) => {
    if (req.user && req.user.isDoctor) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as a doctor' });
    }
};

module.exports = { protect, admin, doctor };
