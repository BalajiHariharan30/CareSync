const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
    try {
        const fetch = (await import('node-fetch')).default || require('node-fetch');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch(err) {
        console.error("Fetch error", err);
    }
}
listModels();
