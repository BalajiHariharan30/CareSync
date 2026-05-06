const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/appointmentController');
const { protect, doctor } = require('../middlewares/authMiddleware');
const { upload } = require('../controllers/recordController');

router.route('/')
    .post(protect, bookAppointment);

router.route('/myappointments')
    .get(protect, getMyAppointments);

router.route('/:id/queue-info')
    .get(protect, getQueueInfo);

router.route('/doctor')
    .get(protect, doctor, getDoctorAppointments);

router.route('/:id/status')
    .put(protect, doctor, updateAppointmentStatus);

router.route('/:id/queue')
    .put(protect, doctor, manageQueue);

router.route('/:id/voice-note')
    .post(protect, doctor, upload.single('file'), uploadVoiceNote);

router.route('/:id/follow-up')
    .post(protect, doctor, scheduleFollowUp);

router.route('/:id/rebook')
    .post(protect, rebookAppointment);

router.route('/:id/start')
    .put(protect, doctor, startConsultation);

router.route('/:id/complete')
    .put(protect, doctor, completeConsultation);

router.route('/:id/priority')
    .put(protect, doctor, updatePriority);

router.route('/:id/reschedule')
    .put(protect, rescheduleAppointment);

router.route('/:id/cancel')
    .delete(protect, cancelAppointment);

router.route('/:id/callback')
    .post(protect, requestCallback);

module.exports = router;
