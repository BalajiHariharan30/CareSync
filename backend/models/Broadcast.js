const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    targetAudience: { type: String, enum: ['All', 'Patients', 'Doctors'], default: 'All' }
}, { timestamps: true });

module.exports = mongoose.model('Broadcast', broadcastSchema);
