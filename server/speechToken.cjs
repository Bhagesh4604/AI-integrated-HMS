const express = require('express');
const router = express.Router();
// const axios = require('axios'); // Unused
const fetch = require('node-fetch');

// Endpoint to get the speech token
router.get('/token', async (req, res) => {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
        console.error("❌ Azure Speech: Missing keys in .env");
        return res.status(400).send('You forgot to add your speech key or region to the .env file.');
    }

    console.log(`🎤 Azure Speech: Requesting token for region '${speechRegion}'...`);

    const headers = {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    try {
        const tokenResponse = await fetch(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
            method: 'POST',
            headers: headers
        });

        if (!tokenResponse.ok) {
            console.error('❌ Azure Speech Token Failed:', tokenResponse.status, tokenResponse.statusText);
            return res.status(401).send('There was an error authorizing your speech key.');
        }

        const token = await tokenResponse.text();
        console.log("✅ Azure Speech: Token acquired successfully.");
        res.send({ token: token, region: speechRegion });
    } catch (err) {
        console.error('❌ Azure Speech Error:', err);
        res.status(500).send('Internal server error during token fetch');
    }
});

module.exports = router;
