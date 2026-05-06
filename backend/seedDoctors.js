const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');

const specializations = [
    'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Psychiatrist',
    'Orthopedic Surgeon', 'Gastroenterologist', 'Ophthalmologist', 'ENT Specialist',
    'Gynecologist', 'General Physician', 'Dentist', 'Oncologist', 'Urologist', 'Endocrinologist'
];

const qualifications = [
    'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'BDS, MDS', 'MBBS, MD (Medicine)', 'MBBS, MS (Surgery)'
];

const firstNames = [
    'Rajesh', 'Suresh', 'Amit', 'Priya', 'Anjali', 'Vikram', 'Sanjay', 'Sunita', 'Kiran', 'Deepak',
    'Rohan', 'Sneha', 'Rahul', 'Pooja', 'Arjun', 'Meera', 'Vijay', 'Anita', 'Aditya', 'Ishaan',
    'Kabir', 'Zoya', 'Aarav', 'Diya', 'Vihaan', 'Saisha', 'Advait', 'Ananya', 'Vivaan', 'Myra'
];

const lastNames = [
    'Kumar', 'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Reddy', 'Iyer', 'Mehta', 'Joshi',
    'Malhotra', 'Bose', 'Chatterjee', 'Deshmukh', 'Kulkarni', 'Nair', 'Pillai', 'Rao', 'Shetty', 'Venkatesh'
];

const clinicNames = [
    'City Care Clinic', 'Healwell Center', 'Metro Health', 'Sunrise Medical', 'Lifeline Hospital',
    'Family First Clinic', 'Global Diagnostics', 'Wellness Hub', 'Apex Healthcare', 'Elite Medical'
];

const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log('🧹 Clearing existing test doctors...');
        // Find them first before deleting the users
        const testUsers = await User.find({ email: /doctor.*@caresync.com/ }).select('_id');
        const userIds = testUsers.map(u => u._id);

        // Delete associated doctors and then the users
        await Doctor.deleteMany({ userId: { $in: userIds } });
        await User.deleteMany({ email: /doctor.*@caresync.com/ });

        // Also clear any other doctors just in case
        await Doctor.deleteMany({ userId: { $nin: userIds } }); // Clearing all doctors for a clean slate
        await User.deleteMany({ isDoctor: true });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('doctor123', salt);

        const doctorsToCreate = 10;
        let createdCount = 0;

        // Shuffle specializations to ensure variety for the 10 doctors
        const shuffledSpecs = [...specializations].sort(() => 0.5 - Math.random());

        for (let i = 1; i <= doctorsToCreate; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;
            // Unified easy emails: doctor1@caresync.com, doctor2@caresync.com, etc.
            const email = i === 1 ? 'doctor@caresync.com' : `doctor${i}@caresync.com`;
            const phone = `${Math.floor(6000000000 + Math.random() * 4000000000)}`;

            const user = await User.create({
                name: `${fullName}`,
                email,
                password: hashedPassword,
                phone,
                isDoctor: true,
                isAdmin: false,
            });

            // Use unique specialization for each of the 10 doctors
            const specialization = shuffledSpecs[i - 1] || 'General Physician';
            const qualification = qualifications[Math.floor(Math.random() * qualifications.length)];
            const experience = Math.floor(3 + Math.random() * 25);
            const fee = Math.floor(300 + Math.random() * 1700);
            const clinic = clinicNames[Math.floor(Math.random() * clinicNames.length)];
            const city = cities[Math.floor(Math.random() * cities.length)];

            const startHour = Math.floor(8 + Math.random() * 3); // 8-10 AM
            const endHour = Math.floor(16 + Math.random() * 5); // 4-9 PM

            await Doctor.create({
                userId: user._id,
                specialization,
                experience,
                qualification,
                clinicName: `${clinic} - ${city}`,
                clinicAddress: `${Math.floor(10 + Math.random() * 900)}, MG Road, ${city}`,
                consultationFee: Math.round(fee / 10) * 10, // Rounds to nearest 10
                workingHours: {
                    start: `${startHour.toString().padStart(2, '0')}:00`,
                    end: `${endHour.toString().padStart(2, '0')}:00`
                },
                isVerified: true,
                isApproved: true,
                availabilityStatus: 'Available'
            });

            createdCount++;
            console.log(`🚀 Created doctor ${createdCount}: ${fullName} (${specialization})`);
        }

        console.log(`\n✅ Successfully seeded ${createdCount} doctors!`);
        console.log('Login Details:');
        console.log('- Emails: doctor@caresync.com, doctor2@caresync.com ... doctor10@caresync.com');
        console.log('- Password for ALL: doctor123');

        mongoose.disconnect();
    } catch (err) {
        console.error('Error during seeding:', err.message);
        process.exit(1);
    }
};

run();
