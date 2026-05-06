const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect, admin); // All routes below require auth + admin role

// Existing routes
router.get('/users', getAllUsers);
router.get('/doctors/unapproved', getUnapprovedDoctors);
router.put('/doctors/:id/approve', approveDoctor);
router.get('/analytics', getAnalytics);
router.get('/fraud-detection', getFraudDetection);
router.get('/ai-load-monitor', getAiLoadMonitor);
router.get('/complaints', getComplaints);
router.put('/complaints/:id/resolve', resolveComplaint);
router.post('/broadcast', createBroadcast);

// Doctor Management CRUD
router.get('/doctors', getAllDoctors);
router.post('/doctors', addDoctorByAdmin);
router.put('/doctors/:id', updateDoctorByAdmin);
router.put('/doctors/:id/toggle-status', toggleDoctorStatus);
router.delete('/doctors/:id', deleteDoctorByAdmin);
router.get('/doctors/:id/appointments', getDoctorAppointments);
router.get('/doctors/:id/performance', getDoctorPerformance);

// Patient Management
router.put('/patients/:id', updatePatientByAdmin);
router.delete('/patients/:id', deletePatientByAdmin);

// Global Appointment Management
router.get('/appointments', getAllAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);

// Payments & Reviews
router.get('/payments', getPaymentAnalytics);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReviewByAdmin);

module.exports = router;
