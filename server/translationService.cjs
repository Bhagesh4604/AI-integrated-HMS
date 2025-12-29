const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const endpoint = "https://api.cognitive.microsofttranslator.com";
const apiKey = process.env.AZURE_TRANSLATOR_KEY;
const region = process.env.AZURE_TRANSLATOR_REGION;

async function translateText(text, targetLanguage) {
    if (!apiKey || !region) {
        console.warn("Azure Translator credentials missing. Returning mock translation.");
        // Mock translation for demo purposes if keys aren't set
        if (targetLanguage === 'hi') return `[HI] ${text}`;
        if (targetLanguage === 'kn') return `[KN] ${text}`;
        return text;
    }

    try {
        const response = await fetch(`${endpoint}/translate?api-version=3.0&to=${targetLanguage}`, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": apiKey,
                "Ocp-Apim-Subscription-Region": region,
                "Content-Type": "application/json",
                "X-ClientTraceId": uuidv4().toString()
            },
            body: JSON.stringify([{ "text": text }])
        });

        if (!response.ok) {
            throw new Error(`Translator API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data[0]?.translations[0]?.text || text;
    } catch (error) {
        console.error("Translation error:", error);
        return text; // Fallback to original
    }
}

module.exports = { translateText };
