const express = require('express');
const { AzureOpenAI } = require("openai");
const { DocumentAnalysisClient, AzureKeyCredential } = require("@azure/ai-form-recognizer");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Simple in-memory rate limiter (per IP).
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

// Azure OpenAI Configuration
function getOpenAIClient() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID || "gpt-4o"; // Matches your Azure deployment name

  if (!endpoint || !apiKey) {
    console.error("Azure OpenAI credentials missing");
    return null;
  }
  // The SDK might vary slightly based on version, adapting for commonly used @azure/openai or openai package with azure support
  // Using the official 'openai' package which supports Azure
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
      model: "", // Model is specified in the client/deployment
    });

    return result.choices[0].message.content;
  } catch (error) {
    console.error("Azure OpenAI API error:", error);
    return `Error calling Azure OpenAI: ${error.message}`;
  }
}

// Azure Document Intelligence Configuration
function getDocumentClient() {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    console.error("Azure Document Intelligence credentials missing");
    return null;
  }

  if (endpoint.includes("replace_with_your_endpoint")) {
    console.error("❌ ERROR: Azure Document Intelligence Endpoint is still set to the placeholder!");
    console.error("Please update your .env file with the actual endpoint from the Azure Portal (Keys and Endpoint section).");
    return null;
  }
  return new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
}

// POST /api/ai/ask - Azure OpenAI Chat
router.post('/ask', async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
  if (!lastUserMessage) {
    return res.status(400).json({ error: 'No user message found.' });
  }

  const systemMessage = messages.find(m => m.role === 'system');

  const userQuery = lastUserMessage.content;
  const systemPrompt = systemMessage ? systemMessage.content :
    'You are a helpful medical assistant. Provide a structured medical summary based on symptoms. Disclaimer: You are an AI, not a doctor. Always recommend seeing a professional.';

  let reply = await runAzureOpenAI(userQuery, systemPrompt);

  // --- RESPONSIBLE AI: Mandatory Disclaimer ---
  const disclaimer = "\n\n***\n**Disclaimer:** I am an AI assistant. My advice is for informational purposes only and is not a substitute for professional medical diagnosis or treatment.";
  if (reply && !reply.includes("Disclaimer:")) {
    reply += disclaimer;
  }

  res.json({ reply });
});

// POST /api/ai/generate-health-plan - AI Wellness Coach
router.post('/generate-health-plan', async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Rate limit exceeded' });

  const { reportText } = req.body;
  if (!reportText) return res.status(400).json({ error: 'Report text is required.' });

  const systemPrompt = `You are an empathetic Medical Wellness Coach using Azure AI. 
    Analyze the provided medical report summary and output a JSON object with exactly these keys:
    {
        "summary": "1 sentence plain english summary of findings",
        "diet": ["List of 3 specific foods to eat", "List of 3 specific foods to avoid"],
        "lifestyle": ["Two actionable lifestyle tips (e.g. sleep, exercise)"],
        "questions": ["Two questions the patient should ask their doctor related to these results"],
        "disclaimer": "Standard medical disclaimer text"
    }
    Important: Do not give prescription advice. Always include the disclaimer field. Return ONLY valid JSON.`;

  const rawResponse = await runAzureOpenAI(reportText, systemPrompt);

  // Attempt to parse JSON
  try {
    // Strip markdown code fences if present
    const jsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(jsonStr);
    res.json(plan);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    // Fallback if AI didn't return JSON
    res.json({
      summary: rawResponse,
      diet: [],
      lifestyle: ["Consult doctor for personalized advice."],
      questions: []
    });
  }
});

// POST /api/ai/analyze-document - Azure Document Intelligence
router.post('/analyze-document', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("Analyze Document Request received");
  const client = getDocumentClient();
  if (!client) {
    console.error("Client is null - Check env vars: ENDPOINT=" + (process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ? "SET" : "MISSING") + ", KEY=" + (process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ? "SET" : "MISSING"));
    return res.status(500).json({ error: "Document Intelligence not configured" });
  }

  try {
    // Use beginAnalyzeDocument for streams/buffers
    // Note: The SDK might require a specific content type or Buffer.
    const poller = await client.beginAnalyzeDocument("prebuilt-read", req.file.buffer);
    const { content, pages } = await poller.pollUntilDone();

    res.json({ text: content, pages: pages.length });
  } catch (error) {
    console.error("Document analysis failed:", JSON.stringify(error, null, 2));
    if (error.stack) console.error(error.stack);
    res.status(500).json({ error: "Analysis failed: " + error.message });
  }
});

// POST /api/ai/analyze-oncology - Specialized Cancer Screening
router.post('/analyze-oncology', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const client = getDocumentClient();
  if (!client) {
    return res.status(500).json({ error: "Document Intelligence not configured" });
  }

  try {
    // 1. Extract Text using Azure Document Intelligence
    const poller = await client.beginAnalyzeDocument("prebuilt-read", req.file.buffer);
    const { content } = await poller.pollUntilDone();

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "No text could be extracted from the document." });
    }

    // 2. Analyze with Azure OpenAI (Oncology Specialist)
    const systemPrompt = `You are an expert Oncologist Assistant utilizing Azure AI. 
      Analyze the provided medical report text for markers of cancer, malignancy, or suspicious growths.
      
      Output a valid JSON object with exactly these keys:
      {
          "riskLevel": "Low" | "Medium" | "High" | "Critical",
          "confidence": 0-100,
          "findings": ["List of specific key terms found like 'Carcinoma', 'Metastasis', 'High PSA', 'Benign', etc."],
          "summary": "Professional 1-2 sentence medical summary.",
          "recommendations": ["2-3 actionable next steps for the doctor"],
          "disclaimer": "AI Screening Tool. NOT a diagnosis. Verify with Pathology."
      }
      
      Rules:
      - If findings indicate malignancy or high risk markers (e.g. BIRADS 5, Gleason 8+), set riskLevel to 'High' or 'Critical'.
      - If findings are benign or normal, set riskLevel to 'Low'.
      - Be conservative. If unsure, mark findings as 'Indeterminate'.`;

    const aiResponse = await runAzureOpenAI(content, systemPrompt);

    // Parse JSON
    let result;
    try {
      const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON Parse Error", e);
      result = {
        riskLevel: "Medium",
        confidence: 50,
        findings: ["Error parsing AI response"],
        summary: aiResponse,
        recommendations: ["Review manual report"],
        disclaimer: "AI Parsing Error. Consult Original Document."
      };
    }

    res.json(result);

  } catch (error) {
    console.error("Oncology Analysis Failed:", error);
    res.status(500).json({ error: "Analysis failed: " + error.message });
  }
});

module.exports = router;
