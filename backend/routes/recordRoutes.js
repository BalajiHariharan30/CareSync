const express = require('express');
const router = express.Router();
const { upload, uploadRecord, getMyRecords } = require('../controllers/recordController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/upload', protect, upload.single('file'), uploadRecord);
router.get('/', protect, getMyRecords);

module.exports = router;
