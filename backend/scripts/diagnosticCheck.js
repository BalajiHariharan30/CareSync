const mongoose = require('mongoose');
require('dotenv').config();

const checkAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('../models/User');
        const emails = [
            'balaji.bt22@bitsathy.ac.in',
            'santhoshkumar.bt22@bitsathy.ac.in',
            'padmaja.bt22@bitsathy.ac.in',
            'bhuvaneshwar.cs22@bitsathy.ac.in'
        ];
        
        console.log("Checking database for authorized emails...");
        const users = await User.find({ email: { $in: emails } });
        
        if (users.length === 0) {
            console.log("No users found with these emails.");
        } else {
            users.forEach(u => {
                console.log(`Email: ${u.email}`);
                console.log(` - isAdmin: ${u.isAdmin}`);
                console.log(` - isVerified: ${u.isVerified}`);
                console.log(` - googleId: ${u.googleId ? 'Yes' : 'No'}`);
            });
        }
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmins();
