// utils/aiService.js — OpenRouter AI service for TouristGuide
const axios = require('axios');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID = 'minimax/minimax-m2.5:free';

// System prompt that contextualizes the AI as a travel assistant
const SYSTEM_PROMPT = `You are TravelMate AI — a premium, knowledgeable travel assistant built into the TouristGuide app. Your expertise covers:

• Destination recommendations with rich, vivid descriptions
• Smart navigation suggestions (routes, transport modes, traffic tips)
• Packing tips, budget planning, and weather advice
• Cultural etiquette, local cuisine, and hidden gems
• Emergency travel information and safety tips

Guidelines:
- Be concise but informative. Use bullet points for lists.
- Include practical details like estimated costs, travel times, and best seasons.
- When recommending places, mention 1-2 unique highlights per place.
- Be warm, enthusiastic, and professional.
- If asked about something non-travel related, politely redirect to travel topics.
- Use emojis sparingly for visual appeal (1-2 per response max).`;

/**
 * Send a prompt to OpenRouter and return the AI response text.
 * @param {string} prompt - User's message/question
 * @param {Array} conversationHistory - Optional previous messages for context
 * @returns {Promise<string>} AI response text
 */
const askAI = async (prompt, conversationHistory = []) => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required and must be a non-empty string');
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured on the server');
  }

  // Build messages array with system prompt, conversation history, and current prompt
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context window
    { role: 'user', content: prompt.trim() },
  ];

  const MAX_RETRIES = 3;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      console.log(`[AI Service] Sending request to OpenRouter (Attempt ${attempt + 1}/${MAX_RETRIES})`);
      const startTime = Date.now();

      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: MODEL_ID,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://touristguide.app',
            'X-Title': 'TouristGuide AI Assistant',
          },
          timeout: 15000, // 15s timeout
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content;

      if (!reply) {
        throw new Error('No response content received from AI model');
      }

      console.log(`[AI Service] Received response in ${Date.now() - startTime}ms`);
      return reply.trim();
    } catch (error) {
      attempt++;
      let errorMessage = 'Unknown error';
      let shouldRetry = false;

      if (error.response) {
        const status = error.response.status;
        errorMessage = `HTTP ${status}: ${error.response.data?.error?.message || 'AI service error'}`;
        
        // Retry on rate limits (429) and server errors (5xx)
        if (status === 429 || status >= 500) {
          shouldRetry = true;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out';
        shouldRetry = true;
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = `Network error: ${error.code}`;
        shouldRetry = true;
      } else {
        errorMessage = error.message;
      }

      console.error(`[AI Service] Error on attempt ${attempt}: ${errorMessage}`);

      if (attempt >= MAX_RETRIES || !shouldRetry) {
        console.error(`[AI Service] Request failed after ${attempt} attempts.`);
        
        // Throw standardized errors for the global handler
        if (error.response?.status === 401) throw new Error('AI service authentication failed.');
        if (error.response?.status === 429) throw new Error('AI rate limit exceeded. Please try again later.');
        if (error.response?.status >= 500) throw new Error('AI service is temporarily down.');
        throw new Error(`AI Request Failed: ${errorMessage}`);
      }

      // Exponential backoff before retry (e.g., 1s, 2s)
      const backoffDelay = Math.pow(2, attempt - 1) * 1000;
      console.log(`[AI Service] Waiting ${backoffDelay}ms before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
};

module.exports = { askAI };
