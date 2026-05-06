const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Define schema directly to avoid require() conflicts in simple scripts
const AppointmentSchema = new mongoose.Schema({}, { strict: false });
const DoctorSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const appointments = await Appointment.find();

        console.log(`Found ${appointments.length} appointments total.\n`);

        for (const apt of appointments) {
            console.log(`Appt ID: ${apt._id}`);
            console.log(`Patient ID: ${apt.patientId}`);
            console.log(`Doctor ID: ${apt.doctorId}`);
            console.log(`Date: ${apt.date}`);
            console.log(`Status: ${apt.status}`);
            console.log('-----------------------------------');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
