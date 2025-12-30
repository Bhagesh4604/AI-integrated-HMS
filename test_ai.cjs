require('dotenv').config();
const { AzureOpenAI } = require("openai");

const client = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: "2024-05-01-preview",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_ID || "gpt-4o"
});

async function testAI() {
    console.log("Testing Azure OpenAI Connection...");
    console.log("Endpoint:", process.env.AZURE_OPENAI_ENDPOINT);
    console.log("Deployment:", process.env.AZURE_OPENAI_DEPLOYMENT_ID);

    try {
        const response = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Say 'AI Connection Successful' if you can hear me." }
            ],
            model: process.env.AZURE_OPENAI_DEPLOYMENT_ID || "gpt-4o",
            max_tokens: 20
        });

        console.log("Response:", response.choices[0].message.content);
    } catch (error) {
        console.error("AI Connection Failed:", error);
    }
}

testAI();
