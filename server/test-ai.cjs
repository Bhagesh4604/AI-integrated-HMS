const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { DocumentAnalysisClient, AzureKeyCredential } = require("@azure/ai-form-recognizer");

console.log("--- Testing Azure Configuration ---");
console.log("ENDPOINT:", process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ? "Found" : "MISSING");
console.log("KEY:", process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ? "Found" : "MISSING");

if (process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
    try {
        const client = new DocumentAnalysisClient(
            process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
            new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY)
        );
        console.log("✅ Client initialized successfully.");
    } catch (e) {
        console.error("❌ Client initialization failed:", e.message);
    }
} else {
    console.error("❌ Credentials missing in .env file.");
}
