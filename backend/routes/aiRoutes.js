const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Sunishchit karein ki API key .env file se aa rahi hai
if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in the .env file");
}

// Google AI client ko initialize karein
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Route: POST /api/ai/chat
// Description: Gemini AI model se chat karein
// Access: Private
router.post('/chat', protect, async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required.' });
    }

    try {
        console.log("Sending prompt to Google Gemini:", prompt);

        // Model select karein (gemini-pro text ke liye accha hai)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        console.log("Received response from Gemini:", aiResponse);

        res.status(200).json({ reply: aiResponse });

    } catch (error) {
        console.error("Google Gemini API Error:", error);
        res.status(500).json({ message: 'Failed to get response from AI model.' });
    }
});

module.exports = router;