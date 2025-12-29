const express = require('express');
const router = express.Router();
const { AzureOpenAI } = require("openai");

// Azure OpenAI Configuration
function getOpenAIClient() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentId = "gpt-4o";

    if (!endpoint || !apiKey) {
        console.error("Azure OpenAI credentials missing");
        return null;
    }
    const apiVersion = "2024-05-01-preview";
    return new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment: deploymentId });
}

async function runAzureOpenAI(userQuery, systemPrompt) {
    const client = getOpenAIClient();
    if (!client) {
        return "AI Service is temporarily unavailable. Please try again later or contact support.";
    }

    try {
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
        ];

        const result = await client.chat.completions.create({
            messages: messages,
            model: "",
        });

        return result.choices[0].message.content;
    } catch (error) {
        console.error("Azure OpenAI API error:", error);
        return `Error calling Azure OpenAI: ${error.message}`;
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

    const reply = await runAzureOpenAI(symptoms, systemPrompt);

    res.json({ reply });
});

module.exports = router;