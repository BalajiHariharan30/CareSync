const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const TimeSlot = require('./models/TimeSlot');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const doctor = await Doctor.findOne();
        const patient = await User.findOne({ isDoctor: false });
        const timeSlot = await TimeSlot.findOne({ doctorId: doctor._id, isBooked: false });

        if (!doctor || !patient || !timeSlot) {
            console.log('Missing data:', { doctor: !!doctor, patient: !!patient, slot: !!timeSlot });
            return mongoose.disconnect();
        }

        console.log(`Simulating booking for Patient ${patient.name} with Doctor ${doctor.specialization}`);

        // Mock request object for the controller logic
        const req = {
            body: {
                doctorId: doctor._id.toString(),
                timeSlotId: timeSlot._id.toString(),
                date: timeSlot.date,
                reason: 'Test Booking',
                isEmergency: false,
                paymentMethod: 'Offline',
                paymentStatus: 'Pending'
            },
            user: { userId: patient._id.toString() }
        };

        const res = {
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { this.data = j; return this; }
        };

        // Note: We are importing the controller logic here manually for simulation
        const { bookAppointment } = require('./controllers/appointmentController');
        
        await bookAppointment(req, res);

        console.log('Response Status:', res.statusCode || 200);
        console.log('Response Data:', res.data);

        const checkApt = await Appointment.findOne({ doctorId: doctor._id });
        console.log('Appointment in DB:', checkApt ? 'YES' : 'NO');

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

run();
