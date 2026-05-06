const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true }
}, { timestamps: true });

// Ensure one review per appointment
reviewSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
