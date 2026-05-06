const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true }, // The day of the slot
    startTime: { type: String, required: true }, // e.g., "09:00"
    endTime: { type: String, required: true }, // e.g., "09:30"
    isBooked: { type: Boolean, default: false } // Used for conflict prevention
}, { timestamps: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
