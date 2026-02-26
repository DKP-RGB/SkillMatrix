// src/utils/aiService.js

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Sends a message to the AI and gets a response.
 * @param {Array} messages - Array of message objects (role, content)
 * @param {string} apiKey - The OpenRouter API key
 */
export const fetchChatResponse = async (messages, apiKey) => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please provide a valid OpenRouter API key.");
    }

    try {
        console.log("Sending request to OpenRouter...", { model: "openai/gpt-oss-120b:free", messagesCount: messages.length });

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "SkillMatrix AI Assistant",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-oss-120b:free",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful coding assistant for the SkillMatrix platform. Assist users with C, C++, Python, Java, JavaScript, and Go questions. Keep answers concise, helpful, and professional."
                    },
                    ...messages
                ],
                "reasoning": { "enabled": true }
            })
        });

        const data = await response.json();
        console.log("OpenRouter Response Data:", data);

        if (data.error) {
            console.error("OpenRouter API Error Details:", data.error);
            throw new Error(data.error.message || "AI service error");
        }

        if (!data.choices || data.choices.length === 0) {
            console.error("No choices returned from OpenRouter:", data);
            throw new Error("Empty response from AI service");
        }

        return data.choices[0].message;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
