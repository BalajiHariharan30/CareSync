const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    prediction: {
        type: String,
        required: true
    },
    confidence: {
        type: Number,
        required: true
    },
    doctorRemarks: {
        type: String,
        default: ''
    },
    remarkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('AiPrediction', aiPredictionSchema);
