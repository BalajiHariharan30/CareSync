const Prescription = require('../models/Prescription');

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
    try {
        const { appointmentId, patientId, medicines, instructions } = req.body;

        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findOne({ userId: req.user.userId || req.user.id });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const newPrescription = await Prescription.create({
            appointmentId,
            patientId,
            doctorId: doctor._id,
            medicines,
            instructions
        });

        res.status(201).json(newPrescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's prescriptions
// @route   GET /api/prescriptions/my
// @access  Private/Patient
const getMyPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.user.userId || req.user.id })
            .populate('doctorId', 'specialization clinicName userId')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPrescription,
    getMyPrescriptions
};
