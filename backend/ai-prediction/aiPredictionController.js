const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const AiPrediction = require('./AiPrediction');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini API client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
});

// Ensure uploads directory exists (use /tmp on Vercel to support read-only filesystem)
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const uploadDir = isVercel 
    ? '/tmp' 
    : path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (err) {
        console.warn('Failed to create upload directory:', err.message);
    }
}

// Set up storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Only images (JPEG/JPG/PNG) are allowed!'));
    }
});

// Helper for local Python model fallback
const runPythonInference = (imagePath) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'predict.py');
        console.log(`[AI Prediction Fallback] Spawning Python process: py -u ${scriptPath} ${imagePath}`);
        const pythonProcess = spawn('py', ['-u', scriptPath, imagePath]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start local Python inference: ${err.message}`));
        });

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(stderrData || `Python process exited with code ${code}`));
            }
            try {
                const parsed = JSON.parse(stdoutData.trim());
                resolve(parsed);
            } catch (err) {
                reject(new Error(`Failed to parse Python output: ${err.message}`));
            }
        });
    });
};

// @desc    Upload image and run AI prediction
// @route   POST /api/ai-prediction/pneumonia
// @access  Private
const predictPneumonia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        const imagePath = req.file.path;
        let parsedResult;

        try {
            console.log(`[AI Prediction] Analyzing image with Gemini API... Path: ${imagePath}`);

            // Read image file as base64
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');

            const prompt = `
            You are a senior medical radiologist AI assistant. 
            Analyze this chest X-ray scan and determine if there are signs of Pneumonia or if it is Normal.
            Return your classification in a valid JSON format with the keys:
            "prediction": "Pneumonia" or "Normal",
            "confidence": a decimal number between 0.0 and 1.0 representing your confidence level.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: req.file.mimetype,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ],
                config: {
                    responseMimeType: 'application/json'
                }
            });

            const textResponse = response.text || '';
            console.log('[AI Prediction Gemini Response]:', textResponse);

            try {
                parsedResult = JSON.parse(textResponse.trim());
            } catch (e) {
                // Clean markdown blocks if any
                const cleanText = textResponse.replace(/```(json)?\n?/gi, '').replace(/```\n?/gi, '').trim();
                parsedResult = JSON.parse(cleanText);
            }
        } catch (geminiError) {
            console.warn('[AI Prediction] Gemini API failed (503/rate-limit). Falling back to local Python model...', geminiError.message);
            try {
                parsedResult = await runPythonInference(imagePath);
                console.log('[AI Prediction Fallback Success]:', parsedResult);
            } catch (fallbackError) {
                console.error('[AI Prediction Fallback Failed]:', fallbackError);
                throw new Error(`Both Gemini API and local Python inference failed. Python error: ${fallbackError.message}`);
            }
        }

        if (!parsedResult.prediction || typeof parsedResult.confidence === 'undefined') {
            throw new Error('Incomplete response keys from AI models');
        }

        // Standardize prediction formatting
        let prediction = parsedResult.prediction;
        if (prediction.toLowerCase().includes('pneumonia')) {
            prediction = 'Pneumonia';
        } else {
            prediction = 'Normal';
        }

        const confidence = parseFloat(parsedResult.confidence) || 0.90;

        // Create prediction record in database
        const predictionRecord = await AiPrediction.create({
            patient: req.user.userId || req.user.id,
            imageUrl: `/uploads/${req.file.filename}`,
            prediction: prediction,
            confidence: confidence
        });

        res.status(201).json({
            _id: predictionRecord._id,
            patient: predictionRecord.patient,
            imageUrl: predictionRecord.imageUrl,
            prediction: predictionRecord.prediction,
            confidence: predictionRecord.confidence,
            disclaimer: 'This is a proof-of-concept AI screening tool, not a clinical diagnosis. Please consult your doctor.',
            createdAt: predictionRecord.createdAt
        });

    } catch (error) {
        console.error('[AI Prediction Screening Error]:', error);
        res.status(500).json({ 
            message: 'AI prediction screening failed.', 
            error: error.message 
        });
    }
};

// @desc    Get all predictions of the logged in patient
// @route   GET /api/ai-prediction/my-predictions
// @access  Private
const getMyPredictions = async (req, res) => {
    try {
        const patientId = req.user.userId || req.user.id;
        const predictions = await AiPrediction.find({ patient: patientId }).sort({ createdAt: -1 });
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all predictions (for doctors)
// @route   GET /api/ai-prediction/all-predictions
// @access  Private (Doctor only)
const getAllPredictions = async (req, res) => {
    try {
        const predictions = await AiPrediction.find()
            .populate('patient', 'name email')
            .sort({ createdAt: -1 });
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add remark on a prediction result (for doctors)
// @route   PUT /api/ai-prediction/:id/remark
// @access  Private (Doctor only)
const updatePredictionRemark = async (req, res) => {
    try {
        const { remark } = req.body;
        const predictionId = req.params.id;

        const prediction = await AiPrediction.findById(predictionId);
        if (!prediction) {
            return res.status(404).json({ message: 'AI prediction record not found' });
        }

        prediction.doctorRemarks = remark;
        prediction.remarkedBy = req.user.userId || req.user.id;
        await prediction.save();

        res.json(prediction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    upload,
    predictPneumonia,
    getMyPredictions,
    getAllPredictions,
    updatePredictionRemark
};
