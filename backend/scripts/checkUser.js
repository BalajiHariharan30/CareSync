const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const findToken = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ isVerified: false, verificationToken: { $exists: true } });
        if (users.length > 0) {
            console.log(`FOUND_${users.length}_UNVERIFIED_USERS`);
            users.forEach(u => {
                console.log(`USER:${u.email}`);
                console.log(`TOKEN:${u.verificationToken}`);
            });
        } else {
            console.log('NO_UNVERIFIED_USERS_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
};

findToken();
