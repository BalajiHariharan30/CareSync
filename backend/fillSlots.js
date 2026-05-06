const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Doctor = require('./models/Doctor');
const TimeSlot = require('./models/TimeSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const doctors = await Doctor.find({});
        console.log(`Found ${doctors.length} doctors. Starting slot generation...`);

        const daysToSeed = 7;
        const slotsPerBatch = 500;
        let totalSlotsCreated = 0;
        let batch = [];

        // Clear existing slots to avoid duplicates if re-running
        console.log('🧹 Cleaning up old slots...');
        await TimeSlot.deleteMany({});

        for (const doctor of doctors) {
            let startHour = 9;
            let endHour = 17;

            if (doctor.workingHours && doctor.workingHours.start && doctor.workingHours.end) {
                try {
                    startHour = parseInt(doctor.workingHours.start.split(':')[0]);
                    endHour = parseInt(doctor.workingHours.end.split(':')[0]);
                } catch (e) {
                    console.log(`⚠️ Invalid hours for Dr ${doctor._id}, using default 9-5`);
                }
            } else {
                console.log(`ℹ️ No hours specified for Dr ${doctor._id}, using default 9-5`);
            }

            for (let d = 0; d < daysToSeed; d++) {
                const date = new Date();
                date.setDate(date.getDate() + d);
                date.setHours(0, 0, 0, 0);

                for (let hour = startHour; hour < endHour; hour++) {
                    // Create two 30-min slots per hour
                    const slot1 = {
                        doctorId: doctor._id,
                        date: date,
                        startTime: `${hour.toString().padStart(2, '0')}:00`,
                        endTime: `${hour.toString().padStart(2, '0')}:30`,
                        isBooked: false
                    };
                    const slot2 = {
                        doctorId: doctor._id,
                        date: date,
                        startTime: `${hour.toString().padStart(2, '0')}:30`,
                        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                        isBooked: false
                    };

                    batch.push(slot1, slot2);

                    if (batch.length >= slotsPerBatch) {
                        await TimeSlot.insertMany(batch);
                        totalSlotsCreated += batch.length;
                        batch = [];
                    }
                }
            }
        }

        // Insert remaining
        if (batch.length > 0) {
            await TimeSlot.insertMany(batch);
            totalSlotsCreated += batch.length;
        }

        console.log(`\n✅ Successfully generated ${totalSlotsCreated} time slots for ${doctors.length} doctors!`);
        console.log(`Coverage: Next ${daysToSeed} days.`);

        mongoose.disconnect();
    } catch (err) {
        console.error('Error during slot seeding:', err.message);
        process.exit(1);
    }
};

run();
