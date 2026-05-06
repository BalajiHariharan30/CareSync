const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    qualification: { type: String, required: true },
    clinicName: { type: String },
    clinicAddress: { type: String },
    consultationFee: { type: Number, required: true },
    ratings: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false }, // Admin needs to approve
    workingHours: {
        start: { type: String }, // e.g., "09:00"
        end: { type: String },   // e.g., "17:00"
    },
    averageConsultationTime: { type: Number, default: 15 }, // minutes
    isVerified: { type: Boolean, default: false }, // Explicit verification status
    prescriptionTemplates: [{
        title: { type: String },
        medicines: [{
            name: { type: String },
            dosage: { type: String },
            frequency: { type: String },
            duration: { type: String }
        }]
    }],
    availabilityStatus: {
        type: String,
        enum: ['Available', 'Busy', 'Break', 'Offline'],
        default: 'Offline'
    }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
