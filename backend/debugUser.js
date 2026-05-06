const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./models/User');

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'bhuvankattur@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('✅ User Found:');
            console.log(`   Name:     ${user.name}`);
            console.log(`   Email:    ${user.email}`);
            console.log(`   isAdmin:  ${user.isAdmin}`);
            console.log(`   isDoctor: ${user.isDoctor}`);
            console.log(`   ID:       ${user._id}`);
        } else {
            console.log(`❌ User with email ${email} NOT found in database.`);

            // List some users to see what's there
            const allUsers = await User.find({}).limit(5);
            console.log('\nSample Users in DB:');
            allUsers.forEach(u => console.log(` - ${u.email} (${u.isAdmin ? 'Admin' : u.isDoctor ? 'Doctor' : 'Patient'})`));
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkUser();
