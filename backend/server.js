const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:5172', 'http://localhost:5173'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to DB (using a local database for now or mongo URI from env)
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';
mongoose.connect(mongoURI).then(() => {
    console.log('MongoDB Connected');
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
});

// Routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const recordRoutes = require('./routes/recordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Doctor Appointment API is running');
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the Express API for Vercel serverless functions
module.exports = app;
