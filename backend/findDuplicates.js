const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./models/User');

const findDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'bhuvankattur@gmail.com';
        const users = await User.find({ email });

        console.log(`Found ${users.length} users with email: ${email}`);
        users.forEach((u, i) => {
            console.log(`User ${i + 1}:`);
            console.log(`   ID:       ${u._id}`);
            console.log(`   Name:     ${u.name}`);
            console.log(`   isDoctor: ${u.isDoctor}`);
            console.log(`   isAdmin:  ${u.isAdmin}`);
            console.log(`   Status:   ${u.status}`);
            console.log(`   CreatedAt: ${u.createdAt}`);
        });

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

findDuplicates();
