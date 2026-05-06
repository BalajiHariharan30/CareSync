const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Complaint = require('../models/Complaint');
const Broadcast = require('../models/Broadcast');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');

// @desc    Get all users (patients and doctors)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update patient details by admin
// @route   PUT /api/admin/patients/:id
// @access  Private/Admin
const updatePatientByAdmin = async (req, res) => {
    try {
        const { name, email, phone, status } = req.body;
        const user = await User.findById(req.params.id);
        if (!user || user.isDoctor || user.isAdmin) return res.status(404).json({ message: 'Patient not found' });

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.status = status || user.status;

        await user.save();
        res.json({ message: 'Patient updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete patient permanently
// @route   DELETE /api/admin/patients/:id
// @access  Private/Admin
const deletePatientByAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.isDoctor || user.isAdmin) return res.status(404).json({ message: 'Patient not found' });

        await User.findByIdAndDelete(req.params.id);
        // Also clean up their appointments
        await Appointment.deleteMany({ patientId: req.params.id });

        res.json({ message: 'Patient account and records deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all appointments across platform
// @route   GET /api/admin/appointments
// @access  Private/Admin
const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({})
            .populate('patientId', 'name email')
            .populate({
                path: 'doctorId',
                populate: { path: 'userId', select: 'name' }
            })
            .sort('-createdAt');
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update any appointment status
// @route   PATCH /api/admin/appointments/:id/status
// @access  Private/Admin
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unapproved doctors
// @route   GET /api/admin/doctors/unapproved
// @access  Private/Admin
const getUnapprovedDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ isApproved: false }).populate('userId', 'name email phone');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a doctor
// @route   PUT /api/admin/doctors/:id/approve
// @access  Private/Admin
const approveDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        doctor.isApproved = true;
        doctor.isVerified = true;
        await doctor.save();

        res.json({ message: 'Doctor approved and verified successfully', doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Fraud Detection (Flag suspicious accounts)
// @route   GET /api/admin/fraud-detection
// @access  Private/Admin
const getFraudDetection = async (req, res) => {
    try {
        // Group appointments by patient and count cancellations
        const flaggedUsers = await Appointment.aggregate([
            { $match: { status: 'Cancelled' } },
            { $group: { _id: '$patientId', cancelCount: { $sum: 1 } } },
            { $match: { cancelCount: { $gte: 3 } } } // Flag if >= 3 cancellations
        ]);

        const populatedUsers = await User.populate(flaggedUsers, { path: '_id', select: 'name email status' });
        res.json(populatedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get AI Appointment Load Monitor
// @route   GET /api/admin/ai-load-monitor
// @access  Private/Admin
const getAiLoadMonitor = async (req, res) => {
    try {
        // Basic grouping by hour for today's appointments to signify load
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const load = await Appointment.aggregate([
            { $match: { date: { $gte: today } } },
            {
                $group: {
                    _id: { $hour: "$date" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({ peakHours: load });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all complaints
// @route   GET /api/admin/complaints
// @access  Private/Admin
const getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({}).populate('patientId', 'name').populate('doctorId', 'name userId').sort('-createdAt');
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resolve a complaint
// @route   PUT /api/admin/complaints/:id/resolve
// @access  Private/Admin
const resolveComplaint = async (req, res) => {
    try {
        const { adminResponse } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.status = 'Resolved';
        complaint.adminResponse = adminResponse || 'Resolved by Admin';
        await complaint.save();

        res.json({ message: 'Complaint resolved', complaint });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a system broadcast
// @route   POST /api/admin/broadcast
// @access  Private/Admin
const createBroadcast = async (req, res) => {
    try {
        const { message, targetAudience } = req.body;
        const broadcast = new Broadcast({
            adminId: req.user.id,
            message,
            targetAudience: targetAudience || 'All'
        });
        await broadcast.save();
        res.status(201).json({ message: 'Broadcast sent', broadcast });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isDoctor: false, isAdmin: false });
        const totalDoctors = await Doctor.countDocuments({ isApproved: true });
        const unapprovedDoctorsCount = await Doctor.countDocuments({ isApproved: false });
        const totalAppointments = await Appointment.countDocuments();

        const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });

        res.json({
            totalUsers,
            totalDoctors,
            unapprovedDoctorsCount,
            totalAppointments,
            completedAppointments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payment and fee analytics
// @route   GET /api/admin/payments
// @access  Private/Admin
const getPaymentAnalytics = async (req, res) => {
    try {
        const appointments = await Appointment.find({ paymentStatus: 'Completed' })
            .populate({
                path: 'doctorId',
                select: 'consultationFee',
                populate: { path: 'userId', select: 'name' }
            });

        const totalRevenue = appointments.reduce((acc, curr) => acc + (curr.doctorId?.consultationFee || 0), 0);
        const doctorEarnings = await Appointment.aggregate([
            { $match: { paymentStatus: 'Completed' } },
            {
                $group: {
                    _id: '$doctorId',
                    total: { $sum: 1 },
                }
            }
        ]);

        res.json({
            totalRevenue,
            doctorEarnings,
            transactionCount: appointments.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reviews for moderation
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('patientId', 'name')
            .populate({
                path: 'doctorId',
                populate: { path: 'userId', select: 'name' }
            })
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete inappropriate review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const deleteReviewByAdmin = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all doctors (for admin management table)
// @route   GET /api/admin/doctors
// @access  Private/Admin
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({}).populate('userId', 'name email phone');
        const withStats = await Promise.all(doctors.map(async (doc) => {
            const totalApts = await Appointment.countDocuments({ doctorId: doc._id });
            const completedApts = await Appointment.countDocuments({ doctorId: doc._id, status: 'Completed' });
            return { ...doc.toObject(), totalAppointments: totalApts, completedAppointments: completedApts };
        }));
        res.json(withStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new doctor (Admin creates user + doctor profile)
// @route   POST /api/admin/doctors
// @access  Private/Admin
const addDoctorByAdmin = async (req, res) => {
    try {
        const { name, email, phone, password, specialization, qualification, experience, consultationFee, clinicName, clinicAddress, workingHoursStart, workingHoursEnd } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'doctor123', salt);

        const newUser = await User.create({ name, email, phone, password: hashedPassword, isDoctor: true });

        const newDoctor = await Doctor.create({
            userId: newUser._id,
            specialization, qualification, experience: Number(experience),
            consultationFee: Number(consultationFee),
            clinicName, clinicAddress,
            workingHours: { start: workingHoursStart || '09:00', end: workingHoursEnd || '17:00' },
            isApproved: true, isVerified: true,
        });

        res.status(201).json({ message: 'Doctor added successfully', doctor: newDoctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update doctor details
// @route   PUT /api/admin/doctors/:id
// @access  Private/Admin
const updateDoctorByAdmin = async (req, res) => {
    try {
        const { specialization, qualification, experience, consultationFee, clinicName, clinicAddress, workingHoursStart, workingHoursEnd, name, phone } = req.body;
        const doctor = await Doctor.findById(req.params.id).populate('userId');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // Update User fields
        if (name || phone) {
            await User.findByIdAndUpdate(doctor.userId._id, { ...(name && { name }), ...(phone && { phone }) });
        }
        // Update Doctor fields
        if (specialization) doctor.specialization = specialization;
        if (qualification) doctor.qualification = qualification;
        if (experience) doctor.experience = Number(experience);
        if (consultationFee) doctor.consultationFee = Number(consultationFee);
        if (clinicName) doctor.clinicName = clinicName;
        if (clinicAddress) doctor.clinicAddress = clinicAddress;
        if (workingHoursStart) doctor.workingHours.start = workingHoursStart;
        if (workingHoursEnd) doctor.workingHours.end = workingHoursEnd;

        const updated = await doctor.save();
        res.json({ message: 'Doctor updated successfully', doctor: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle doctor active/inactive status
// @route   PUT /api/admin/doctors/:id/toggle-status
// @access  Private/Admin
const toggleDoctorStatus = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('userId');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // Toggle: use isApproved as active status
        doctor.isApproved = !doctor.isApproved;
        await doctor.save();

        const statusLabel = doctor.isApproved ? 'Activated' : 'Deactivated';
        res.json({ message: `Doctor ${statusLabel} successfully`, isActive: doctor.isApproved });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete doctor permanently
// @route   DELETE /api/admin/doctors/:id
// @access  Private/Admin
const deleteDoctorByAdmin = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        await User.findByIdAndDelete(doctor.userId);
        await Doctor.findByIdAndDelete(req.params.id);

        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get appointments of a specific doctor
// @route   GET /api/admin/doctors/:id/appointments
// @access  Private/Admin
const getDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.params.id })
            .populate('patientId', 'name email')
            .sort('-date');
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get doctor performance analytics
// @route   GET /api/admin/doctors/:id/performance
// @access  Private/Admin
const getDoctorPerformance = async (req, res) => {
    try {
        const total = await Appointment.countDocuments({ doctorId: req.params.id });
        const completed = await Appointment.countDocuments({ doctorId: req.params.id, status: 'Completed' });
        const cancelled = await Appointment.countDocuments({ doctorId: req.params.id, status: 'Cancelled' });
        const pending = await Appointment.countDocuments({ doctorId: req.params.id, status: { $in: ['Pending', 'Confirmed'] } });
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        res.json({ total, completed, cancelled, pending, completionRate });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUnapprovedDoctors,
    approveDoctor,
    getAnalytics,
    getFraudDetection,
    getAiLoadMonitor,
    getComplaints,
    resolveComplaint,
    createBroadcast,
    getAllDoctors,
    addDoctorByAdmin,
    updateDoctorByAdmin,
    toggleDoctorStatus,
    deleteDoctorByAdmin,
    getDoctorAppointments,
    getDoctorPerformance,
    updatePatientByAdmin,
    deletePatientByAdmin,
    getAllAppointments,
    updateAppointmentStatus,
    getPaymentAnalytics,
    getAllReviews,
    deleteReviewByAdmin,
};
