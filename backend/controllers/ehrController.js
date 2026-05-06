const Prescription = require('../models/Prescription');
const HealthRecord = require('../models/HealthRecord');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get Master Health Summary (EHR)
// @route   GET /api/auth/ehr-summary
// @access  Private/Patient
const getEhrSummary = async (req, res) => {
    try {
        const patientId = req.user.userId || req.user.id;

        // 1. Fetch Prescriptions
        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'userId clinicName')
            .sort({ createdAt: -1 });

        // 2. Fetch Lab Reports/Records
        const records = await HealthRecord.find({ patientId }).sort({ createdAt: -1 });

        // 3. Fetch Appointments with Diagnoses
        const appointments = await Appointment.find({ 
            patientId, 
            status: 'Completed' 
        })
        .populate('doctorId', 'userId clinicName')
        .sort({ date: -1 });

        // 4. Fetch User Vitals History
        const user = await User.findById(patientId).select('healthTracker');

        res.json({
            prescriptions,
            records,
            appointments,
            vitals: user.healthTracker || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getEhrSummary };
