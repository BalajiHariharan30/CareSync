const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const salt = await bcrypt.genSalt(10);

        // --- Create Admin User ---
        const existingAdmin = await User.findOne({ email: 'admin@caresync.com' });
        if (!existingAdmin) {
            const admin = await User.create({
                name: 'Super Admin',
                email: 'admin@caresync.com',
                password: await bcrypt.hash('admin123', salt),
                isAdmin: true,
                isDoctor: false,
            });
            console.log('✅ Admin created:', admin.email);
        } else {
            console.log('ℹ️  Admin already exists:', existingAdmin.email);
        }

        // --- Create Doctor User ---
        const existingDoctor = await User.findOne({ email: 'doctor@caresync.com' });
        if (!existingDoctor) {
            const doctorUser = await User.create({
                name: 'Dr. Rajesh Kumar',
                email: 'doctor@caresync.com',
                password: await bcrypt.hash('doctor123', salt),
                isDoctor: true,
                isAdmin: false,
            });
            await Doctor.create({
                userId: doctorUser._id,
                specialization: 'General Physician',
                experience: 10,
                qualification: 'MBBS, MD',
                clinicName: 'CareSync Clinic',
                clinicAddress: 'Bangalore, India',
                consultationFee: 500,
                isVerified: true,
                isApproved: true,
            });
            console.log('✅ Doctor created:', doctorUser.email);
        } else {
            console.log('ℹ️  Doctor already exists:', existingDoctor.email);
        }

        console.log('\n🎉 Done! Use these credentials to test:');
        console.log('Admin  → admin@caresync.com   / admin123');
        console.log('Doctor → doctor@caresync.com  / doctor123');
        console.log('Patient → Register normally via the Patient Portal');

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
