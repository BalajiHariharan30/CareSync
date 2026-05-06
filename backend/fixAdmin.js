const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Force-set isAdmin=true for the admin account
    const result = await User.findOneAndUpdate(
        { email: 'admin@caresync.com' },
        { $set: { isAdmin: true, isDoctor: false } },
        { new: true }
    );

    if (result) {
        console.log('✅ Admin fixed! isAdmin =', result.isAdmin, '| email =', result.email);
    } else {
        console.log('❌ admin@caresync.com not found. Creating fresh...');
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@caresync.com',
            password: await bcrypt.hash('admin123', salt),
            isAdmin: true,
            isDoctor: false,
        });
        console.log('✅ New admin created! isAdmin =', admin.isAdmin);
    }

    mongoose.disconnect();
};

run().catch(err => { console.error(err.message); process.exit(1); });
