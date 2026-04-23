// services/ai.service.js — AI Chat proxying through Backend API
import api from './api';

/**
 * Send a chat message to the AI Assistant via the backend.
 * The backend handles the OpenRouter/Nvidia Nemotron logic securely.
 * @param {string} prompt - User's message
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @returns {Promise<string>} AI response text
 */
export async function askGeminiAI(prompt, conversationHistory = []) {
  try {
    const response = await api.post('/ai', {
      prompt: prompt.trim(),
      conversationHistory: conversationHistory.slice(-8).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))
    });

    if (response.data && response.data.success) {
      return response.data.data.reply;
    } else {
      throw new Error(response.data?.message || 'Failed to get AI response');
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 429) throw new Error('Too many requests. Please wait a moment and try again.');
      if (status === 400) throw new Error(error.response.data?.message || 'Invalid request.');
      if (status >= 500) throw new Error('AI server is temporarily down. Try again shortly.');
      throw new Error(`AI error (${status}): ${error.response.data?.message || 'Unknown error'}`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error('Could not reach AI service. Check your internet connection.');
  }
}
