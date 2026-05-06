const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

const dumpUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('../models/User');
        const users = await User.find({});
        
        let output = "ALL USERS IN DATABASE:\n";
        users.forEach(u => {
            output += `Email: ${u.email} | isAdmin: ${u.isAdmin} | isDoctor: ${u.isDoctor} | googleId: ${u.googleId ? 'Yes' : 'No'}\n`;
        });
        
        fs.writeFileSync('user_dump.txt', output);
        console.log("Dumped users to user_dump.txt");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dumpUsers();
