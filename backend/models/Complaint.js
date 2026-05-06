const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, // Optional target of complaint
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
    adminResponse: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
