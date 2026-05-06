const express = require('express');
const router = express.Router();
const { createPrescription, getMyPrescriptions } = require('../controllers/prescriptionController');
const { protect, doctor } = require('../middlewares/authMiddleware');

router.post('/', protect, doctor, createPrescription);
router.get('/my', protect, getMyPrescriptions);

module.exports = router;
