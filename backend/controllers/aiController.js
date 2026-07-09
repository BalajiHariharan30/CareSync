const aiService = require('../utils/aiService');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

exports.checkSymptoms = async (req, res) => {
    try {
        const { symptoms } = req.body;
        if (!symptoms) {
            return res.status(400).json({ message: "Symptoms are required" });
        }

        const recommendation = await aiService.getDoctorRecommendation(symptoms);
        res.status(200).json(recommendation);
    } catch (error) {
        console.error("Error in checkSymptoms controller:", error);
        res.status(500).json({ message: "Error generating recommendation", error: error.message });
    }
};

exports.getHealthRisk = async (req, res) => {
    try {
        // Assume req.user.id is available from authMiddleware
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const metrics = user.healthMetrics || { weight: null, height: null, knownDiseases: [] };
        const riskPrediction = await aiService.predictHealthRisk(metrics);
        res.status(200).json(riskPrediction);
    } catch (error) {
        console.error("Error in getHealthRisk controller:", error);
        res.status(500).json({ message: "Error predicting health risk", error: error.message });
    }
};

exports.getCancellationRisk = async (req, res) => {
    try {
        const { patientId } = req.params;
        const pastAppointments = await Appointment.find({ patientId }).select('status');

        const riskPrediction = await aiService.predictCancellationRisk(pastAppointments);
        res.status(200).json(riskPrediction);
    } catch (error) {
        console.error("Error in getCancellationRisk controller:", error);
        res.status(500).json({ message: "Error predicting cancellation risk", error: error.message });
    }
};

exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // Fetch approved doctors dynamically to populate chatbot context
        const approvedDoctors = await Doctor.find({ isApproved: true }).populate('userId', 'name');
        const doctorList = approvedDoctors.map(doc => ({
            name: doc.userId ? doc.userId.name : 'Unknown Doctor',
            specialization: doc.specialization,
            consultationFee: doc.consultationFee,
            ratings: doc.ratings,
            availabilityStatus: doc.availabilityStatus
        }));

        const reply = await aiService.processChatbotMessage(message, history, doctorList);
        res.status(200).json({ reply });
    } catch (error) {
        console.error("Error in chat controller:", error);
        res.status(500).json({ message: "Error processing chat message", error: error.message });
    }
};
