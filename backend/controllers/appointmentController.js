const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const Doctor = require('../models/Doctor');

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private/Patient
const bookAppointment = async (req, res) => {
    try {
        const { doctorId, timeSlotId, date, reason, isEmergency, paymentMethod, paymentStatus } = req.body;

        // 1. Conflict Prevention: strict check if slot is already booked
        const timeSlot = await TimeSlot.findById(timeSlotId);

        if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' });
        if (timeSlot.isBooked) return res.status(400).json({ message: 'Time slot is already booked. Please choose another slot.' });

        // 2. Mark slot as booked instantly
        timeSlot.isBooked = true;
        await timeSlot.save();

        // Queue Calculation Logic
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // Find existing appointments for this doctor on this date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const appointmentsToday = await Appointment.find({
            doctorId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['Pending', 'Confirmed'] }
        });

        // Current queue count
        const numberOfPatientsAhead = appointmentsToday.length;
        let queueNumber = numberOfPatientsAhead + 1;
        let expectedWaitTime = numberOfPatientsAhead * (doctor.averageConsultationTime || 15);

        // Emergency override
        if (isEmergency) {
            queueNumber = 1; // Put at the front
            expectedWaitTime = 0; // Immediate attention
        }

        // Generate Telemedicine Link
        const telemedicineLink = `https://meet.jit.si/doc-appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 3. Create appointment
        const appointment = await Appointment.create({
            patientId: req.user.userId || req.user.id, // Auth middleware uses req.user.userId but sometimes req.user.id
            doctorId,
            timeSlotId,
            date,
            reason,
            isEmergency: isEmergency || false,
            queueNumber,
            expectedWaitTime,
            telemedicineLink,
            paymentMethod: paymentMethod || 'Offline',
            paymentStatus: paymentStatus || 'Pending'
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's appointments
// @route   GET /api/appointments/myappointments
// @access  Private/Patient
const getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.userId })
            .populate('doctorId', 'specialization clinicName')
            .populate('timeSlotId', 'date startTime endTime')
            .sort({ date: -1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.userId });
        
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const appointments = await Appointment.find({ doctorId: doctor._id })
            .populate('patientId', 'name email phone')
            .populate('timeSlotId', 'date startTime endTime')
            .sort({ date: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Doctor or Admin
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.status = status;
        await appointment.save();

        // If cancelled, free up the time slot
        if (status === 'Cancelled') {
            const timeSlot = await TimeSlot.findById(appointment.timeSlotId);
            if (timeSlot) {
                timeSlot.isBooked = false;
                await timeSlot.save();
            }
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Smart Queue Management (Skip, Delay, Emergency)
// @route   PUT /api/appointments/:id/queue
// @access  Private/Doctor
const manageQueue = async (req, res) => {
    try {
        const { action, delayMinutes } = req.body; // action: 'Skip', 'Delay', 'Emergency'
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (action === 'Skip') {
            appointment.status = 'Skipped';
            appointment.queueNumber = null;
        } else if (action === 'Delay') {
            appointment.status = 'Delayed';
            appointment.expectedWaitTime += (delayMinutes || 15);
        } else if (action === 'Emergency') {
            appointment.isEmergency = true;
            appointment.queueNumber = 1; // Bump to front
        }

        await appointment.save();
        res.json({ message: `Queue action ${action} applied`, appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload Voice Note Medical Record
// @route   POST /api/appointments/:id/voice-note
// @access  Private/Doctor
const uploadVoiceNote = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No audio file uploaded' });

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.voiceNoteUrl = `/uploads/${req.file.filename}`;
        await appointment.save();

        res.json({ message: 'Voice note saved successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Schedule Auto Follow-Up
// @route   POST /api/appointments/:id/follow-up
// @access  Private/Doctor
const scheduleFollowUp = async (req, res) => {
    try {
        const { days } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        const followUpDate = new Date(appointment.date);
        followUpDate.setDate(followUpDate.getDate() + parseInt(days));

        appointment.followUpDate = followUpDate;
        await appointment.save();

        res.json({ message: `Follow-up scheduled for ${followUpDate.toDateString()}`, appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Rebook a past appointment (One-Click)
// @route   POST /api/appointments/:id/rebook
// @access  Private/Patient
const rebookAppointment = async (req, res) => {
    try {
        const { date, timeSlotId, isEmergency, paymentMethod, paymentStatus } = req.body;
        const oldAppointment = await Appointment.findById(req.params.id);

        if (!oldAppointment) return res.status(404).json({ message: 'Previous appointment not found' });
        if (oldAppointment.patientId.toString() !== (req.user.userId || req.user.id).toString()) {
            return res.status(403).json({ message: 'Not authorized to rebook this appointment' });
        }

        const timeSlot = await TimeSlot.findById(timeSlotId);
        if (!timeSlot) return res.status(404).json({ message: 'Time slot not found' });
        if (timeSlot.isBooked) return res.status(400).json({ message: 'Time slot is already booked' });

        timeSlot.isBooked = true;
        await timeSlot.save();

        const doctor = await Doctor.findById(oldAppointment.doctorId);
        const telemedicineLink = `https://meet.jit.si/doc-appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newAppointment = await Appointment.create({
            patientId: oldAppointment.patientId,
            doctorId: oldAppointment.doctorId,
            timeSlotId,
            date,
            reason: oldAppointment.reason,
            isEmergency: isEmergency || false,
            telemedicineLink,
            isRebook: true,
            familyMemberId: oldAppointment.familyMemberId,
            paymentMethod: paymentMethod || 'Offline',
            paymentStatus: paymentStatus || 'Pending'
        });

        res.status(201).json(newAppointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start Consultation (Timer Start)
// @route   PUT /api/appointments/:id/start
// @access  Private/Doctor
const startConsultation = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.consultationStartedAt = new Date();
        appointment.status = 'Confirmed'; // Ensure it's active
        await appointment.save();

        res.json({ message: 'Consultation started', startTime: appointment.consultationStartedAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete Consultation
// @route   PUT /api/appointments/:id/complete
// @access  Private/Doctor
const completeConsultation = async (req, res) => {
    try {
        const { notes, consultationTime } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.consultationCompletedAt = new Date();
        appointment.status = 'Completed';
        if (notes) appointment.symptomsSummary = notes;

        await appointment.save();

        res.json({ message: 'Consultation completed', endTime: appointment.consultationCompletedAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get real-time queue info for a specific appointment
// @route   GET /api/appointments/:id/queue-info
// @access  Private/Patient
const getQueueInfo = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate('doctorId');
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only for Pending or Confirmed/Delayed appointments
        if (!['Pending', 'Confirmed', 'Delayed'].includes(appointment.status)) {
            return res.json({
                status: appointment.status,
                queueNumber: appointment.queueNumber,
                patientsAhead: 0,
                currentPatientNumber: appointment.queueNumber
            });
        }

        const startOfDay = new Date(appointment.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointment.date);
        endOfDay.setHours(23, 59, 59, 999);

        // Find the "Current Patient" (earliest queue number NOT in final states)
        const activeAppointments = await Appointment.find({
            doctorId: appointment.doctorId._id,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['Pending', 'Confirmed', 'Delayed'] }
        }).sort({ queueNumber: 1 });

        const currentPatient = activeAppointments[0]; // The one currently with the doctor or next up

        // Count how many patients are actually ahead of the user in the active queue
        const patientsAhead = activeAppointments.filter(a => a.queueNumber < appointment.queueNumber).length;

        // Recalculate estimated wait time based on average time
        const avgTime = appointment.doctorId.averageConsultationTime || 15;
        const updatedWaitTime = patientsAhead * avgTime;

        res.json({
            status: appointment.status,
            queueNumber: appointment.queueNumber,
            currentPatientNumber: currentPatient ? currentPatient.queueNumber : appointment.queueNumber,
            patientsAhead,
            estimatedWaitTime: updatedWaitTime,
            doctorName: appointment.doctorId.userId?.name || appointment.doctorId.clinicName,
            isEmergency: appointment.isEmergency
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Patient Priority / Symptoms Summary
// @route   PUT /api/appointments/:id/priority
// @access  Private/Doctor
const updatePriority = async (req, res) => {
    try {
        const { priorityTag, symptomsSummary } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (priorityTag) appointment.priorityTag = priorityTag;
        if (symptomsSummary) appointment.symptomsSummary = symptomsSummary;

        await appointment.save();
        res.json({ message: 'Appointment priority updated', appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reschedule an appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private/Patient
const rescheduleAppointment = async (req, res) => {
    try {
        const { date, timeSlotId } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        
        // Check authorization
        if (appointment.patientId.toString() !== (req.user.userId || req.user.id).toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (appointment.status !== 'Pending' && appointment.status !== 'Confirmed') {
            return res.status(400).json({ message: 'Only active appointments can be rescheduled' });
        }

        // 1. Free up old slot
        const oldSlot = await TimeSlot.findById(appointment.timeSlotId);
        if (oldSlot) {
            oldSlot.isBooked = false;
            await oldSlot.save();
        }

        // 2. Book new slot
        const newSlot = await TimeSlot.findById(timeSlotId);
        if (!newSlot || newSlot.isBooked) {
            // Rollback if new slot is taken
            if (oldSlot) {
                oldSlot.isBooked = true;
                await oldSlot.save();
            }
            return res.status(400).json({ message: 'New time slot is unavailable' });
        }

        newSlot.isBooked = true;
        await newSlot.save();

        // 3. Update appointment
        appointment.date = date;
        appointment.timeSlotId = timeSlotId;
        appointment.status = 'Confirmed'; // Reset status if it was delayed/pending
        
        await appointment.save();
        res.json({ message: 'Appointment rescheduled successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel an appointment
// @route   DELETE /api/appointments/:id/cancel
// @access  Private/Patient
const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Check authorization
        if (appointment.patientId.toString() !== (req.user.userId || req.user.id).toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Free up slot
        const timeSlot = await TimeSlot.findById(appointment.timeSlotId);
        if (timeSlot) {
            timeSlot.isBooked = false;
            await timeSlot.save();
        }

        appointment.status = 'Cancelled';
        await appointment.save();

        res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request a callback for an appointment
// @route   POST /api/appointments/:id/callback
// @access  Private/Patient
const requestCallback = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Update appointment with callback request status
        appointment.callbackRequested = true;
        await appointment.save();

        res.json({ message: 'Callback requested successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    manageQueue,
    uploadVoiceNote,
    scheduleFollowUp,
    rebookAppointment,
    startConsultation,
    completeConsultation,
    updatePriority,
    getQueueInfo,
    rescheduleAppointment,
    cancelAppointment,
    requestCallback
};
