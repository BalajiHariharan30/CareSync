const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./models/User');

const createBhuvan = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'bhuvankattur@gmail.com';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('bhuvan123', salt);

        // Delete any existing one first to be safe
        await User.deleteMany({ email });

        const user = await User.create({
            name: 'Bhuvan',
            email: email,
            password: hashedPassword,
            isDoctor: false,
            isAdmin: false,
            status: 'Active'
        });

        console.log('✅ Bhuvan Patient Account Created Successfully:');
        console.log(`   Email:    ${user.email}`);
        console.log(`   Password: bhuvan123`);

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

createBhuvan();
