const mongoose = require('mongoose');
require('dotenv').config();

const upgradeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('../models/User');
        const email = 'bhuvaneshwar.cs22@bitsathy.ac.in';
        
        console.log(`Searching for ${email}...`);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log("User not found!");
        } else {
            user.isAdmin = true;
            user.isVerified = true;
            await user.save();
            console.log(`SUCCESS: ${email} is now an ADMIN.`);
        }
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

upgradeAdmin();
