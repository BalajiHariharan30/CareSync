const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected\n');

    const user = await User.findOne({ email: 'admin@caresync.com' });
    if (!user) {
        console.log('❌ admin@caresync.com does NOT exist in DB!');
    } else {
        console.log('--- Found User ---');
        console.log('Name    :', user.name);
        console.log('Email   :', user.email);
        console.log('isAdmin :', user.isAdmin);
        console.log('isDoctor:', user.isDoctor);
        console.log('_id     :', user._id);

        if (!user.isAdmin) {
            console.log('\n⚠️  isAdmin is FALSE — forcing update now...');
            user.isAdmin = true;
            await user.save();
            const check = await User.findOne({ email: 'admin@caresync.com' });
            console.log('✅ After save — isAdmin:', check.isAdmin);
        } else {
            console.log('\n✅ isAdmin is already TRUE in DB');
        }
    }

    mongoose.disconnect();
};

run().catch(err => { console.error(err.message); process.exit(1); });
