const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing test doctors
        const testUsers = await User.find({ email: /doctor.*@caresync.com/ }).select('_id');
        const userIds = testUsers.map(u => u._id);
        await Doctor.deleteMany({ userId: { $in: userIds } });
        await User.deleteMany({ email: /doctor.*@caresync.com/ });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('doctor123', salt);

        const csvData = fs.readFileSync('Doctor_List_Full.csv', 'utf8');
        const lines = csvData.trim().split('\n');

        // Skip header (line 0)
        let createdCount = 0;
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const [name, email, password, specialization, clinicName] = lines[i].split(',');

            const phone = `${Math.floor(6000000000 + Math.random() * 4000000000)}`;

            const user = await User.create({
                name: name.trim(),
                email: email.trim(),
                password: hashedPassword,
                phone,
                isDoctor: true,
                isAdmin: false,
            });

            const experience = Math.floor(3 + Math.random() * 25);
            const fee = Math.floor(300 + Math.random() * 1700);

            const startHour = Math.floor(8 + Math.random() * 3); // 8-10 AM
            const endHour = Math.floor(16 + Math.random() * 5); // 4-9 PM

            await Doctor.create({
                userId: user._id,
                specialization: specialization.trim(),
                experience,
                qualification: 'MBBS, MD',
                clinicName: clinicName.trim(),
                clinicAddress: `Main St, City Center`,
                consultationFee: Math.round(fee / 10) * 10,
                workingHours: {
                    start: `${startHour.toString().padStart(2, '0')}:00`,
                    end: `${endHour.toString().padStart(2, '0')}:00`
                },
                isVerified: true,
                isApproved: true,
                availabilityStatus: 'Available'
            });

            createdCount++;
            console.log(`🚀 Created doctor: ${name.trim()} (${specialization.trim()})`);
        }

        console.log(`\n✅ Successfully seeded ${createdCount} doctors from CSV!`);
        mongoose.disconnect();
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
};

run();
