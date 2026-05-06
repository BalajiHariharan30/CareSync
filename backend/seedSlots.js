const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Doctor = require('./models/Doctor');
const TimeSlot = require('./models/TimeSlot');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find the doctor user
        const doctorUser = await User.findOne({ email: 'doctor@caresync.com' });
        if (!doctorUser) {
            console.error('❌ Doctor user not found. Run createAdmin.js and resetAdmin.js first.');
            process.exit(1);
        }

        const doctor = await Doctor.findOne({ userId: doctorUser._id });
        if (!doctor) {
            console.error('❌ Doctor profile not found.');
            process.exit(1);
        }

        console.log(`Seeding slots for Dr. ${doctorUser.name} (${doctor._id})`);

        // Helper to get next 7 days
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            date.setUTCHours(0, 0, 0, 0);
            dates.push(date);
        }

        // Define standard slots
        const standardSlots = [
            { start: '09:00', end: '09:30' },
            { start: '10:00', end: '10:30' },
            { start: '11:00', end: '11:30' },
            { start: '14:00', end: '14:30' },
            { start: '15:00', end: '15:30' },
            { start: '16:00', end: '16:30' },
        ];

        let totalCreated = 0;
        for (const date of dates) {
            const existing = await TimeSlot.findOne({ doctorId: doctor._id, date: date });
            if (existing) {
                console.log(`ℹ️ Slots already exist for ${date.toISOString().split('T')[0]}`);
                continue;
            }

            const slotsToInsert = standardSlots.map(s => ({
                doctorId: doctor._id,
                date: date,
                startTime: s.start,
                endTime: s.end,
                isBooked: false
            }));

            await TimeSlot.insertMany(slotsToInsert);
            totalCreated += slotsToInsert.length;
            console.log(`✅ Created slots for ${date.toISOString().split('T')[0]}`);
        }

        console.log(`\n🎉 Success! Seeded ${totalCreated} total slots.`);
        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
