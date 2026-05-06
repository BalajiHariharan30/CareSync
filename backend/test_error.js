const dotenv = require('dotenv');
dotenv.config();
const aiService = require('./utils/aiService');

async function test() {
    try {
        const res = await aiService.getDoctorRecommendation("headache");
        console.log("SUCCESS:", res);
    } catch(err) {
        console.log("ERROR_MESSAGE:", err.message);
        console.log("RAW_ERROR:", err);
    }
}
test();
