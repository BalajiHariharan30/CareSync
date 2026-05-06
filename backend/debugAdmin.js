const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'admin@caresync.com';
        const password = 'admin123';

        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('👤 User found:', user.email);
        console.log('🔑 IsAdmin:', user.isAdmin);
        console.log('🔒 Hashed Password in DB:', user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('✅ Password Match:', isMatch);

        // Also check if there are others
        const count = await User.countDocuments({ email });
        console.log('📊 Total users with this email:', count);

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
