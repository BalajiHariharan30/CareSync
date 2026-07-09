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

async function processChatbotMessage(message, history = [], doctorList = []) {
    const doctorsInfoStr = doctorList.length > 0 
        ? doctorList.map(doc => `- Dr. ${doc.name} (Specialty: ${doc.specialization}, Fee: ₹${doc.consultationFee}, Rating: ${doc.ratings}/5, Status: ${doc.availabilityStatus})`).join('\n')
        : 'None available currently';

    const context = `
    You are the official CareSync Pro Medical Reception & Support Chatbot. Your persona must be highly professional, polite, clinical, empathetic, and organized.

    YOUR TASKS:
    1. Help patients understand how to use the app (booking appointments, dashboard, upload X-rays for Pneumonia AI Health Check).
    2. Check doctor availability/specialties using ONLY the actual data list below.
    3. Respond to general health queries with basic medical info, always ending with a clear professional disclaimer.

    LIST OF ACTUAL APPROVED DOCTORS IN OUR DATABASE:
    ${doctorsInfoStr}

    CRITICAL RULES:
    1. HALLUCINATION PREVENTION: You MUST ONLY recommend, reference, or mention doctor names and specialties present in the list above. Do NOT invent other doctor names. If a user asks for a specialty/doctor we don't have, politely say: "We currently do not have a registered specialist in that category on CareSync Pro. However, here are the specialties and doctors currently available to book: [list them briefly]."
    2. PROFESSIONAL TONE: Always use formal, clear, and empathetic language. Avoid slang or overly casual phrases.
    3. BOOKING GUIDANCE: If a user asks to book an appointment, instruct them to log in to their dashboard, navigate to "Find Doctors", select their preferred doctor, and pick an available slot.
    4. MEDICAL DISCLAIMER: For any symptom checks or medical inquiries, always include this professional notice: "Disclaimer: I am an AI assistant. This information is for general educational purposes and does not constitute clinical advice. Please schedule an appointment with a doctor for a professional evaluation."
    `;

    const formattedHistory = history.map(h => {
        return {
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        };
    });

    const contents = [
        { role: 'user', parts: [{ text: context }] },
        { role: 'model', parts: [{ text: "Understood. How can I help you today?" }] },
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
