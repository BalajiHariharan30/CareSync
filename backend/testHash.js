const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./models/User');

const testHashMatch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected to:', process.env.MONGO_URI.split('@')[1]);

        const email = 'bhuvankattur@gmail.com';
        const plainPassword = 'bhuvan123';

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User ${email} NOT FOUND in database.`);
            return;
        }

        console.log(`✅ User found. Hashed password in DB: ${user.password}`);

        const isMatch = await bcrypt.compare(plainPassword, user.password);

        if (isMatch) {
            console.log('🎉 SUCCESS: bcrypt.compare returned TRUE for "bhuvan123"');
        } else {
            console.log('❌ FAILURE: bcrypt.compare returned FALSE for "bhuvan123"');

            // Let's try to re-hash and see what happens
            const salt = await bcrypt.genSalt(10);
            const testHash = await bcrypt.hash(plainPassword, salt);
            console.log(`Debug: New Test Hash for "bhuvan123": ${testHash}`);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

testHashMatch();
