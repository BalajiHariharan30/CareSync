const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/symptoms', aiController.checkSymptoms);
router.get('/health-risk', protect, aiController.getHealthRisk);
router.get('/cancellation-risk/:patientId', protect, aiController.getCancellationRisk);
router.post('/chat', aiController.chat);

module.exports = router;
