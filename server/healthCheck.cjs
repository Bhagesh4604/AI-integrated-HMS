const express = require('express');
const router = express.Router();

router.get('/ai-status', (req, res) => {
    const status = {
        openai: !!process.env.AZURE_OPENAI_API_KEY && !process.env.AZURE_OPENAI_ENDPOINT.includes('replace_with'),
        documentIntelligence: !!process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY && !process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT.includes('replace_with'),
        speech: !!process.env.AZURE_SPEECH_KEY && !!process.env.AZURE_SPEECH_REGION,
        storage: !!process.env.AZURE_STORAGE_CONNECTION_STRING
    };

    const isHealthy = Object.values(status).every(Boolean);

    res.json({
        overall: isHealthy ? 'online' : 'degraded',
        services: status
    });
});

module.exports = router;
