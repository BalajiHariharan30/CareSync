const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./models/User');

const resetUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'bhuvankattur@gmail.com';
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash('bhuvan123', salt);

        const result = await User.findOneAndUpdate(
            { email },
            {
                password: newPassword,
                isDoctor: false, // Reset to patient for testing
                isAdmin: false,
                status: 'Active'
            },
            { new: true }
        );

        if (result) {
            console.log('✅ User Reset Successfully:');
            console.log(`   Email:    ${result.email}`);
            console.log(`   Password (plain): bhuvan123`);
            console.log(`   isDoctor: ${result.isDoctor}`);
            console.log(`   isAdmin:  ${result.isAdmin}`);
            console.log(`   Status:   ${result.status}`);
        } else {
            console.log(`❌ User ${email} not found.`);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

resetUser();
