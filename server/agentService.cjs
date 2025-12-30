const express = require('express');
const router = express.Router();
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { OpenAI } = require("openai"); // For GitHub Models fallback

// --- CONFIGURATION ---
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID || "gpt-4o";

// --- CLIENT FACTORY ---
function getClient() {
    if (!endpoint || !apiKey) return null;

    // Check for GitHub Models (Azure AI Inference)
    if (endpoint.includes("inference.ai.azure.com")) {
        return {
            client: new OpenAI({ baseURL: endpoint, apiKey: apiKey }),
            isGitHub: true
        };
    }

    // Azure OpenAI Service
    return {
        client: new OpenAIClient(endpoint, new AzureKeyCredential(apiKey)),
        isGitHub: false
    };
}

// --- TOOLS DEFINITION ---
const tools = [
    {
        type: "function",
        function: {
            name: "navigate",
            description: "Navigate to a specific page or module in the application",
            parameters: {
                type: "object",
                properties: {
                    destination: {
                        type: "string",
                        enum: ["dashboard", "patients", "pharmacy", "laboratory", "medical-records", "surgical", "billing", "accounting", "employees", "oncology", "paramedic", "fleet", "patient-portal", "telemedicine"],
                        description: "The internal route ID to navigate to"
                    }
                },
                required: ["destination"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_inventory",
            description: "Check stock levels of a specific medication or item",
            parameters: {
                type: "object",
                properties: {
                    item_name: { type: "string", description: "Name of the medication or item" }
                },
                required: ["item_name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "fill_form",
            description: "Type text into a form field or input",
            parameters: {
                type: "object",
                properties: {
                    field_label: {
                        type: "string",
                        description: "The visible label or placeholder of the input field (e.g. 'Patient Name', 'Search')"
                    },
                    value: {
                        type: "string",
                        description: "The text to type into the field"
                    }
                },
                required: ["field_label", "value"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "click_element",
            description: "Click a button or link on the page",
            parameters: {
                type: "object",
                properties: {
                    element_text: {
                        type: "string",
                        description: "The visible text on the button or link (e.g. 'Submit', 'Add Patient')"
                    }
                },
                required: ["element_text"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_patient_status",
            description: "Get status or vital signs of a specific patient",
            parameters: {
                type: "object",
                properties: {
                    patient_name: { type: "string" }
                },
                required: ["patient_name"]
            }
        }
    }
];

// --- MAIN ENDPOINT ---
router.post('/process', async (req, res) => {
    const { message, context } = req.body;
    const { client, isGitHub } = getClient();

    if (!client) {
        return res.status(500).json({ reply: "Azure AI is not configured." });
    }

    const systemPrompt = `You are "MedAssist", a helpful, friendly, and highly intelligent hospital AI agent. 
    You act like a human co-worker. 
    1. Your responses should be conversational, professional but warm (e.g., "I'm checking that for you right now.", "I've pulled up the records.").
    2. USE TOOLS whenever the user asks to do something (navigate, check info).
    3. If the user just says hello, reply back normally.
    4. If you use a tool, reply with a confirmation message describing what you are doing.`;

    try {
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
        ];

        let result;
        if (isGitHub) {
            result = await client.chat.completions.create({ model: deploymentId, messages: messages, tools: tools });
        } else {
            // Azure SDK
            result = await client.getChatCompletions(deploymentId, messages, { tools: tools });
        }

        const choice = result.choices[0];
        const toolCalls = isGitHub ? choice.message.tool_calls : choice.message.toolCalls;

        // 1. If Tool Called
        if (toolCalls && toolCalls.length > 0) {
            const tool = toolCalls[0];
            const funcName = isGitHub ? tool.function.name : tool.function.name;
            const args = JSON.parse(isGitHub ? tool.function.arguments : tool.function.arguments);

            // Mock Data Logic for "Data Fetching" tools (since we don't have real DB access in this agent yet)
            let dataReply = null;

            if (funcName === 'check_inventory') {
                const stock = Math.floor(Math.random() * 100);
                dataReply = `Checking inventory for ${args.item_name}... We have ${stock} units in stock.`;
            }
            else if (funcName === 'get_patient_status') {
                dataReply = `Pulling records for ${args.patient_name}... Patient is stable. Last Vitals: HR 78, BP 120/80. Located in Ward 3.`;
            }
            else if (funcName === 'fill_form') {
                // We don't "do" anything on server, we just tell frontend to do it
                dataReply = `Typing "${args.value}" into ${args.field_label}...`;
            }
            else if (funcName === 'click_element') {
                dataReply = `Clicking ${args.element_text}...`;
            }
            else if (funcName === 'navigate') {
                // Make navigation responses smoother
                const dest = args.destination.replace('-', ' ');
                dataReply = `Navigating to ${dest}...`;
            }

            // Return action for frontend to execute
            return res.json({
                reply: dataReply || choice.message.content || `Executing ${funcName}...`,
                action: {
                    type: funcName,
                    payload: args
                }
            });
        }

        // 2. Normal Chat Response
        return res.json({ reply: choice.message.content, action: null });

    } catch (error) {
        console.error("AI Agent Error:", error);
        res.status(500).json({ reply: "I'm sorry, I encountered an error verifying your request." });
    }
});

module.exports = router;
