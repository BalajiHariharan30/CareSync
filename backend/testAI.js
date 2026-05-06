const dotenv = require('dotenv');
dotenv.config();
const aiService = require('./utils/aiService');

async function testAI() {
    console.log("Testing Gemini API Integration...");
    try {
        console.log("\n1. Testing getDoctorRecommendation...");
        const recommendation = await aiService.getDoctorRecommendation("I have persistent chest pain and shortness of breath.");
        console.log("Recommendation Result:", JSON.stringify(recommendation, null, 2));

        console.log("\n2. Testing processChatbotMessage...");
        const chatReply = await aiService.processChatbotMessage("How do I book an appointment?");
        console.log("Chat Reply:", chatReply);

        console.log("\nAI Verification Successful!");
    } catch (error) {
        console.error("\nAI Verification Failed!");
        console.error(error);
        process.exit(1);
    }
}

testAI();
