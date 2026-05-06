const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, updateDoctorProfile, getDoctorProfileMe, addTimeSlots, getDoctorTimeSlots, getDoctorTimeSlotsMe, deleteTimeSlot, deleteTimeSlotsByDate, getDoctorHeatmap, savePrescriptionTemplate, getPatientHistory, updateAvailabilityStatus, getDoctorStats, addReview, getDoctorReviews } = require('../controllers/doctorController');
const { protect, doctor } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getDoctors);

router.route('/profile/me')
    .get(protect, doctor, getDoctorProfileMe);

router.route('/profile')
    .put(protect, doctor, updateDoctorProfile);

router.route('/timeslots')
    .post(protect, doctor, addTimeSlots)
    .delete(protect, doctor, deleteTimeSlotsByDate);

router.route('/my/timeslots')
    .get(protect, doctor, getDoctorTimeSlotsMe);

router.route('/timeslots/:id')
    .delete(protect, doctor, deleteTimeSlot);

router.route('/:id')
    .get(getDoctorById);

router.route('/:id/timeslots')
    .get(getDoctorTimeSlots);

router.route('/:id/heatmap')
    .get(getDoctorHeatmap);

router.route('/prescription-template')
    .post(protect, doctor, savePrescriptionTemplate);

router.route('/patients/:patientId/history')
    .get(protect, doctor, getPatientHistory);

router.route('/status')
    .put(protect, doctor, updateAvailabilityStatus);

router.route('/stats/today')
    .get(protect, doctor, getDoctorStats);

router.route('/:id/reviews')
    .get(getDoctorReviews)
    .post(protect, addReview);

module.exports = router;
