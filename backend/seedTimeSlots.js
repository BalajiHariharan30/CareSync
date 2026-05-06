const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Doctor = require('./models/Doctor');
const TimeSlot = require('./models/TimeSlot');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing slots to avoid duplicates during testing
        console.log('🧹 Clearing existing time slots...');
        await TimeSlot.deleteMany({});

        const doctors = await Doctor.find();
        console.log(`👨‍⚕️ Found ${doctors.length} doctors. Generating slots...`);

        const timeSlots = [];
        const daysToSeed = 7;
        const startHour = 9; // 09:00
        const endHour = 17;   // 17:00
        const slotDuration = 30; // 30 minutes

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 0; d < daysToSeed; d++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + d);

            for (const doctor of doctors) {
                for (let hour = startHour; hour < endHour; hour++) {
                    for (let min = 0; min < 60; min += slotDuration) {
                        const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

                        let endH = hour;
                        let endM = min + slotDuration;
                        if (endM >= 60) {
                            endH++;
                            endM = 0;
                        }
                        const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                        timeSlots.push({
                            doctorId: doctor._id,
                            date: currentDate,
                            startTime,
                            endTime,
                            isBooked: false
                        });
                    }
                }
            }
            console.log(`📅 Prepared slots for day ${d + 1}/${daysToSeed}...`);
        }

        console.log(`🚀 Bulk inserting ${timeSlots.length} slots...`);

        // Use bulk insert for better performance
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < timeSlots.length; i += CHUNK_SIZE) {
            const chunk = timeSlots.slice(i, i + CHUNK_SIZE);
            await TimeSlot.insertMany(chunk);
            console.log(`✅ Inserted ${i + chunk.length} / ${timeSlots.length} slots...`);
        }

        console.log('\n✨ Successfully seeded time slots for all doctors!');
        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
