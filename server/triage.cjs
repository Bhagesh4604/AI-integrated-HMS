const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// This function will make the call to the Gemini API
async function runGemini(userQuery, systemPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    // Add a check to see if the API key is missing or is the placeholder from .env.example
    if (!apiKey || apiKey === 'AIzaSyDaKO402U3hoLbUozwO1ghctfds3_u47NY') {
        const errorMsg = 'Error: Gemini API Key is not configured or is using the placeholder value. Please add your valid Gemini API Key to the .env file in the project root.';
        console.error(errorMsg);
        return errorMsg;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
    };

    if (systemPrompt) {
        payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API Error Response:", errorBody);
            // Provide a more specific error message to the client
            return `Error from AI service: ${response.status} ${response.statusText}. Check server logs for details.`;
        }

        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request.";

    } catch (error) {
        console.error("Gemini API call error:", error);
        // Provide more context on the connection error
        return `Error: Could not connect to the AI service. Details: ${error.message}. Please check the server's network connection and ensure the API key is valid.`;
    }
}


router.post('/ask', async (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms) {
        return res.status(400).json({ error: 'Symptoms are required.' });
    }

    const systemPrompt = `You are an AI symptom checker for a hospital called "Shree Medicare". Your goal is to suggest a hospital department based on the user's symptoms.
    You must adhere to the following rules:
    1.  Analyze the symptoms provided by the user.
    2.  Suggest one of the following departments: Cardiology, Orthopedics, Pediatrics, Emergency, or General Medicine.
    3.  Your response must be a short, helpful message. Start by acknowledging the symptoms, then suggest the department.
    4.  CRITICALLY IMPORTANT: You must end your response with the exact disclaimer: "Please note: This is an AI suggestion and not a medical diagnosis. For any medical emergencies, please visit the ER or contact a medical professional immediately."
    5.  Do not provide any medical advice, diagnosis, or treatment suggestions. Your only job is to suggest a department.`;

    const reply = await runGemini(symptoms, systemPrompt);

    res.json({ reply });
});

module.exports = router;