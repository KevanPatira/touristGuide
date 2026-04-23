// controllers/ai.controller.js — AI chat request handler
const { askAI } = require('../utils/aiService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/ai
 * Handle AI chat request — accepts prompt & optional conversation history.
 */
const handleAIRequest = asyncHandler(async (req, res) => {
  const { prompt, conversationHistory } = req.body;

  // Validate prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a non-empty prompt.',
    });
  }

  // Limit prompt length to prevent abuse
  if (prompt.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is too long. Please keep it under 1000 characters.',
    });
  }

  // Validate conversation history format if provided
  if (conversationHistory) {
    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({
        success: false,
        message: 'conversationHistory must be an array of message objects.',
      });
    }

    if (conversationHistory.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'conversationHistory cannot exceed 10 messages.',
      });
    }

    // Validate structure of history items
    const isValidHistory = conversationHistory.every(
      (msg) => msg.role && typeof msg.content === 'string'
    );

    if (!isValidHistory) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversationHistory format. Each message must have a role and content string.',
      });
    }
  }

  const reply = await askAI(prompt, conversationHistory || []);

  res.status(200).json({
    success: true,
    data: {
      reply,
      model: 'minimax/minimax-m2.5:free',
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = { handleAIRequest };
