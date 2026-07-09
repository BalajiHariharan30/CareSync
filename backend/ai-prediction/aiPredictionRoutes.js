const express = require('express');
const router = express.Router();
const { 
    upload, 
    predictPneumonia, 
    getMyPredictions, 
    getAllPredictions, 
    updatePredictionRemark 
} = require('./aiPredictionController');
const { protect, doctor } = require('../middlewares/authMiddleware');

// Patient endpoints
router.post('/pneumonia', protect, upload.single('image'), predictPneumonia);
router.get('/my-predictions', protect, getMyPredictions);

// Doctor endpoints
router.get('/all-predictions', protect, doctor, getAllPredictions);
router.put('/:id/remark', protect, doctor, updatePredictionRemark);

module.exports = router;
