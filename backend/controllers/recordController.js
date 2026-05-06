const multer = require('multer');
const path = require('path');
const fs = require('fs');
const HealthRecord = require('../models/HealthRecord');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// @desc    Upload a health record
// @route   POST /api/records/upload
// @access  Private
const uploadRecord = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { documentType, notes } = req.body;

        const newRecord = await HealthRecord.create({
            patientId: req.user.userId || req.user.id,
            documentUrl: `/uploads/${req.file.filename}`,
            documentType,
            notes
        });

        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all health records for a user
// @route   GET /api/records
// @access  Private
const getMyRecords = async (req, res) => {
    try {
        const records = await HealthRecord.find({ patientId: req.user.userId || req.user.id }).sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    upload,
    uploadRecord,
    getMyRecords
};
