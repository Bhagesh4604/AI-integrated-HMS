const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Simple in-memory rate limiter (per IP). For production use a persistent store (Redis) and better limits.
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 15;
const ipRequests = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipRequests.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > rateLimitWindowMs) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count += 1;
  }
  ipRequests.set(ip, entry);
  return entry.count <= maxRequestsPerWindow;
}


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


// POST /api/ai/ask - Generic AI chat endpoint
router.post('/ask', async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const { messages } = req.body || {};
  
  if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Find the last user message to use as the main prompt
  const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
  if (!lastUserMessage) {
       return res.status(400).json({ error: 'No user message found.' });
  }
  
  // Find a system message if it exists
  const systemMessage = messages.find(m => m.role === 'system');

  const userQuery = lastUserMessage.content;
  const systemPrompt = systemMessage ? systemMessage.content : 'You are a helpful medical assistant. Keep answers concise, prioritize safety, and do not provide definitive medical diagnoses. When in doubt, recommend seeking medical attention.';
  
  const reply = await runGemini(userQuery, systemPrompt);
  res.json({ reply });
});

module.exports = router;
