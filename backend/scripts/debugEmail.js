const mongoose = require('mongoose');
require('dotenv').config();

const debugEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('../models/User');
        const searchEmail = 'bhuvaneshwar.cs22@bitsathy.ac.in';
        
        console.log(`Searching for email exactly matching: "${searchEmail}"`);
        const userExact = await User.findOne({ email: searchEmail });
        console.log(`Exact match: ${!!userExact}`);
        
        console.log(`Searching for email containing: "${searchEmail}"`);
        const usersRegex = await User.find({ email: { $regex: searchEmail.trim(), $options: 'i' } });
        
        usersRegex.forEach(u => {
            console.log(`Found: "${u.email}" (Length: ${u.email.length})`);
            console.log(` - isAdmin: ${u.isAdmin}`);
            // Check for hidden chars
            const bytes = Buffer.from(u.email);
            console.log(` - Hex: ${bytes.toString('hex')}`);
        });
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugEmail();
