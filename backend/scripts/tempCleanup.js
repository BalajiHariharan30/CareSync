const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const dotenv = require('dotenv');
dotenv.config();

const cleanDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete all patients
        const userResult = await User.deleteMany({ email: { $ne: 'admin@care.com' } });
        console.log(`Deleted ${userResult.deletedCount} user accounts.`);

        // Also clean up appointments and other related data if necessary
        const aptResult = await Appointment.deleteMany({});
        console.log(`Deleted ${aptResult.deletedCount} appointments.`);

        console.log('Database cleanup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
};

cleanDB();
