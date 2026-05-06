const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    isDoctor: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    phone: { type: String },
    gender: { type: String },
    bloodGroup: { type: String },
    familyMembers: [{
        name: { type: String },
        relation: { type: String },
        age: { type: Number },
        gender: { type: String }
    }],
    healthMetrics: {
        weight: { type: Number }, // kg
        height: { type: Number }, // cm
        knownDiseases: [{ type: String }],
        allergies: [{ type: String }]
    },
    healthTracker: [{
        date: { type: Date, default: Date.now },
        bloodPressure: { type: String },
        sugarLevel: { type: Number },
        weight: { type: Number },
        temperature: { type: Number }
    }],
    status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
