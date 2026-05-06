const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini API client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function parseCleanJson(text) {
    if (!text) return {};
    const cleanText = text.replace(/```(json)?\n?/gi, '').replace(/```\n?/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON:", cleanText);
        throw e;
    }
}

async function getDoctorRecommendation(symptoms) {
    const prompt = `
    You are an AI Symptom Checker & Doctor Recommendation assistant.
    The patient has the following symptoms: "${symptoms}".
    
    Based on these symptoms:
    1. Suggest 2-3 possible common conditions.
    2. Recommend the best medical specialist for these symptoms. 
    Specialties to choose from: General Physician, Cardiologist, Dentist, Dermatologist, Neurologist, Orthopedic, Gynecologist, Pediatrician, Psychiatrist, ENT Specialist, Ophthalmologist.
    3. Provide 2 short health tips.
    
    Format your response as a valid JSON object with the following keys:
    "possibleConditions" (array of strings),
    "recommendedSpecialist" (string),
    "healthTips" (array of strings)
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });
        return parseCleanJson(response.text);
    } catch (error) {
        console.error("Gemini API Error in getDoctorRecommendation:", error);
        throw error;
    }
}

async function predictHealthRisk(healthMetrics) {
    const metricsStr = JSON.stringify(healthMetrics);
    const prompt = `
    You are an AI Health Risk Predictor.
    A patient has the following health metrics and history: ${metricsStr}
    
    Based ONLY on these metrics, predict if the patient has a high, medium, or low risk for:
    - Diabetes
    - Heart Disease
    - Blood Pressure issues
    
    Format your response as a valid JSON object with the keys:
    "diabetesRisk" (string: High/Medium/Low),
    "heartDiseaseRisk" (string: High/Medium/Low),
    "bloodPressureRisk" (string: High/Medium/Low),
    "advice" (string)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json'
            }
        });
        return parseCleanJson(response.text);
    } catch (error) {
        console.error("Gemini API Error in predictHealthRisk:", error);
        throw error;
    }
}

async function predictCancellationRisk(patientHistory) {
    const historyStr = JSON.stringify(patientHistory);
    const prompt = `
    You are an AI system predicting whether a patient will show up for their appointment.
    Patient's past appointment history (status: Completed/Cancelled/NoShow): ${historyStr}
    
    Predict the likelihood of this patient cancelling or no-showing their next appointment.
    Format your response as a JSON object with keys:
    "cancellationProbability" (number between 0 and 100),
    "riskLevel" (string: High/Medium/Low),
    "recommendation" (string: e.g. "Suggest Backup Bookings")
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json'
            }
        });
        return parseCleanJson(response.text);
    } catch (error) {
        console.error("Gemini API Error in predictCancellationRisk:", error);
        throw error;
    }
}

async function processChatbotMessage(message, history = []) {
    const context = `
    You are a helpful AI assistant for a Doctor Appointment Booking system.
    You help patients book appointments, check doctor availability, hospital info, and answer basic health queries.
    Keep your answers concise and professional.
    If the user asks to book an appointment, instruct them to use the "Book Appointment" form on the dashboard.
    `;

    const formattedHistory = history.map(h => {
        return {
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        };
    });

    const contents = [
        { role: 'user', parts: [{ text: context }] },
        { role: 'model', parts: [{ text: "Understood. How can I help?" }] },
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error in processChatbotMessage:", error);
        throw error;
    }
}

module.exports = {
    getDoctorRecommendation,
    predictHealthRisk,
    predictCancellationRisk,
    processChatbotMessage
};
