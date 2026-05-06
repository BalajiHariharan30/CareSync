const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documentUrl: { type: String, required: true },
    documentType: { type: String, enum: ['Prescription', 'Lab Report', 'X-ray', 'Other'], required: true },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
