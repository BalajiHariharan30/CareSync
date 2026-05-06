const Doctor = require('../models/Doctor');
const TimeSlot = require('../models/TimeSlot');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const User = require('../models/User');
const Review = require('../models/Review');

// @desc    Get all approved doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
    try {
        const { specialization, location } = req.query;
        let query = { isApproved: true };

        if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
        if (location) query.clinicAddress = { $regex: location, $options: 'i' };

        const doctors = await Doctor.find(query).populate('userId', 'name email phone');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current doctor's profile
// @route   GET /api/doctors/profile/me
// @access  Private/Doctor
const getDoctorProfileMe = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.userId }).populate('userId', 'name email phone');
        if (doctor) {
            res.json(doctor);
        } else {
            res.status(404).json({ message: 'Doctor profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a specific doctor's profile
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone');
        if (doctor) {
            res.json(doctor);
        } else {
            res.status(404).json({ message: 'Doctor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Doctor Profile
// @route   PUT /api/doctors/profile
// @access  Private/Doctor
const updateDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        doctor.specialization = req.body.specialization || doctor.specialization;
        doctor.experience = req.body.experience || doctor.experience;
        doctor.qualification = req.body.qualification || doctor.qualification;
        doctor.clinicName = req.body.clinicName || doctor.clinicName;
        doctor.clinicAddress = req.body.clinicAddress || doctor.clinicAddress;
        doctor.consultationFee = req.body.consultationFee || doctor.consultationFee;
        doctor.workingHours = req.body.workingHours || doctor.workingHours;

        const updatedDoctor = await doctor.save();
        res.json(updatedDoctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add time slots for a specific date
// @route   POST /api/doctors/timeslots
// @access  Private/Doctor
const addTimeSlots = async (req, res) => {
    try {
        const { date, slots } = req.body;
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // Ensure date is strictly UTC midnight (YYYY-MM-DDT00:00:00.000Z)
        const slotDate = new Date(date + 'T00:00:00.000Z');
        if (isNaN(slotDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // Filter out slots that already exist
        const existingSlots = await TimeSlot.find({
            doctorId: doctor._id,
            date: slotDate
        });

        const newSlots = slots.filter(slot => {
            return !existingSlots.find(es => es.startTime === slot.startTime);
        });

        if (newSlots.length === 0) {
            return res.status(400).json({ message: 'All specified slots already exist for this date' });
        }

        const timeSlots = newSlots.map(slot => ({
            doctorId: doctor._id,
            date: slotDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
        }));

        const createdSlots = await TimeSlot.insertMany(timeSlots);
        res.status(201).json(createdSlots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all time slots for the logged-in doctor
// @route   GET /api/doctors/my/timeslots
// @access  Private/Doctor
const getDoctorTimeSlotsMe = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const { date } = req.query;
        let query = { doctorId: doctor._id };

        if (date) {
            const slotDate = new Date(date + 'T00:00:00.000Z');
            if (!isNaN(slotDate.getTime())) {
                query.date = slotDate;
            }
        }

        const slots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a time slot
// @route   DELETE /api/doctors/timeslots/:id
// @access  Private/Doctor
const deleteTimeSlot = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const slot = await TimeSlot.findById(req.params.id);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });

        // Security check: must belong to the doctor
        if (slot.doctorId.toString() !== doctor._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this slot' });
        }

        // Check if booked
        if (slot.isBooked) {
            return res.status(400).json({ message: 'Cannot delete a booked slot' });
        }

        await TimeSlot.findByIdAndDelete(req.params.id);
        res.json({ message: 'Slot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteTimeSlotsByDate = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const slotDate = new Date(date + 'T00:00:00.000Z');
        if (isNaN(slotDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // Delete only unbooked slots for security/safety
        const result = await TimeSlot.deleteMany({
            doctorId: doctor._id,
            date: slotDate,
            isBooked: false
        });

        res.json({ message: `Successfully deleted ${result.deletedCount} unbooked slots` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/doctors/:id/timeslots
// @access  Public
const getDoctorTimeSlots = async (req, res) => {
    try {
        const { date } = req.query;
        let query = { doctorId: req.params.id, isBooked: false };

        if (date) {
            const slotDate = new Date(date + 'T00:00:00.000Z');
            if (!isNaN(slotDate.getTime())) {
                query.date = slotDate;
            }
        }

        const slots = await TimeSlot.find(query).sort({ startTime: 1 });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get aggregated heatmap data for a doctor's availability
// @route   GET /api/doctors/:id/heatmap
// @access  Public
const getDoctorHeatmap = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const slots = await TimeSlot.find({ doctorId });

        // Aggregate by date (YYYY-MM-DD string)
        const heatmap = {};

        slots.forEach(slot => {
            const dateStr = slot.date.toISOString().split('T')[0];
            if (!heatmap[dateStr]) {
                heatmap[dateStr] = { total: 0, booked: 0, free: 0 };
            }
            heatmap[dateStr].total++;
            if (slot.isBooked) {
                heatmap[dateStr].booked++;
            } else {
                heatmap[dateStr].free++;
            }
        });

        // Convert to array format for easy frontend usage
        const heatmapArray = Object.keys(heatmap).map(date => ({
            date,
            ...heatmap[date],
            availabilityRatio: heatmap[date].total > 0 ? (heatmap[date].free / heatmap[date].total) : 0
        }));

        res.json(heatmapArray);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save a prescription template
// @route   POST /api/doctors/prescription-template
// @access  Private/Doctor
const savePrescriptionTemplate = async (req, res) => {
    try {
        const { title, medicines } = req.body;
        const doctor = await Doctor.findOne({ userId: req.user.userId });

        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        doctor.prescriptionTemplates.push({ title, medicines });
        await doctor.save();

        res.status(201).json(doctor.prescriptionTemplates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient history (Appointments, Records)
// @route   GET /api/doctors/patients/:patientId/history
// @access  Private/Doctor
const getPatientHistory = async (req, res) => {
    try {
        const patientId = req.params.patientId;

        const patient = await User.findById(patientId).select('-password');
        const appointments = await Appointment.find({ patientId }).populate('doctorId', 'userId name specialization').sort('-date');
        const records = await HealthRecord.find({ patientId }).sort('-createdAt');

        res.json({
            patient,
            appointments,
            records
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Doctor Availability Status
// @route   PUT /api/doctors/status
// @access  Private/Doctor
const updateAvailabilityStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        doctor.availabilityStatus = status;
        await doctor.save();
        res.json({ message: 'Availability status updated', status: doctor.availabilityStatus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Doctor Daily Stats (Earnings & Patient Counts)
// @route   GET /api/doctors/stats/today
// @access  Private/Doctor
const getDoctorStats = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const appointmentsToday = await Appointment.find({
            doctorId: doctor._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const upcomingCount = await Appointment.countDocuments({
            doctorId: doctor._id,
            date: { $gte: tomorrow },
            status: { $in: ['Pending', 'Confirmed'] }
        });

        const stats = {
            totalToday: appointmentsToday.length,
            completed: appointmentsToday.filter(a => a.status === 'Completed').length,
            pending: appointmentsToday.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
            emergency: appointmentsToday.filter(a => a.isEmergency).length,
            totalEarnings: appointmentsToday
                .filter(a => a.status === 'Completed' || a.paymentStatus === 'Completed')
                .reduce((acc, curr) => acc + (doctor.consultationFee || 0), 0),
            totalUpcoming: upcomingCount
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add review for a doctor
// @route   POST /api/doctors/:id/reviews
// @access  Private/Patient
const addReview = async (req, res) => {
    try {
        const { rating, comment, appointmentId } = req.body;
        const doctorId = req.params.id;
        const patientId = req.user.userId || req.user.id;

        // Verify appointment completion
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (appointment.status !== 'Completed') {
            return res.status(400).json({ message: 'You can only review after a completed consultation' });
        }

        const review = await Review.create({
            doctorId,
            patientId,
            rating,
            comment,
            appointmentId
        });

        // Update doctor average rating
        const reviews = await Review.find({ doctorId });
        const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
        
        await Doctor.findByIdAndUpdate(doctorId, { ratings: avgRating.toFixed(1) });

        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this appointment' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a doctor
// @route   GET /api/doctors/:id/reviews
// @access  Public
const getDoctorReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ doctorId: req.params.id })
            .populate('patientId', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDoctors,
    getDoctorById,
    getDoctorProfileMe,
    updateDoctorProfile,
    addTimeSlots,
    getDoctorTimeSlotsMe,
    deleteTimeSlot,
    deleteTimeSlotsByDate,
    getDoctorTimeSlots,
    getDoctorHeatmap,
    savePrescriptionTemplate,
    getPatientHistory,
    updateAvailabilityStatus,
    getDoctorStats,
    addReview,
    getDoctorReviews
};
