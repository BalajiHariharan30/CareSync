const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    timeSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Approved', 'Delayed', 'Skipped'],
        default: 'Pending'
    },
    reason: { type: String },
    paymentMethod: { type: String, enum: ['Online', 'Offline'], default: 'Offline' },
    paymentStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    isEmergency: { type: Boolean, default: false },
    queueNumber: { type: Number },
    expectedWaitTime: { type: Number }, // in minutes
    telemedicineLink: { type: String }, // URL for video call
    voiceNoteUrl: { type: String },
    isRebook: { type: Boolean, default: false },
    symptomsSummary: { type: String },
    priorityTag: {
        type: String,
        enum: ['Regular', 'Emergency', 'Follow-up', 'First Visit', 'Chronic'],
        default: 'Regular'
    },
    consultationStartedAt: { type: Date },
    consultationCompletedAt: { type: Date },
    medicalFiles: [{
        name: { type: String },
        url: { type: String },
        fileType: { type: String }
    }],
    callbackRequested: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
