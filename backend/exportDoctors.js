const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const doctors = await Doctor.find().populate('userId', 'name email');

        // Requested order: Name, Email, Password, Specialization
        let csvContent = 'Name,Email Address,Password,Specialization,Clinic Name\n';

        // The password is common for all seeded doctors
        const COMMON_PASSWORD = 'doctor123';

        doctors.forEach((doc) => {
            const name = doc.userId?.name || 'N/A';
            const email = doc.userId?.email || 'N/A';
            const specialization = doc.specialization || 'N/A';
            const clinic = doc.clinicName || 'N/A';

            // Filters out original demo doctors if any, focusing on the 100 seeded ones if possible, 
            // but the user wants "all" so we'll just export all found.
            if (email === 'N/A') return; // Skip broken records

            // Clean up clinic names for CSV (remove commas)
            const cleanClinic = clinic.replace(/,/g, '');
            const cleanName = name.replace(/,/g, '');

            csvContent += `${cleanName},${email},${COMMON_PASSWORD},${specialization},${cleanClinic}\n`;
        });

        fs.writeFileSync('Doctor_List_Full.csv', csvContent);
        console.log('✅ Doctor_List_Full.csv generated successfully!');

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
