// controllers/ai.controller.js — AI chat request handler
const { askAI } = require('../utils/aiService');
const asyncHandler = require('../utils/asyncHandler');

// === Cache Layer ===
const aiCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour TTL

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of aiCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      aiCache.delete(key);
    }
  }
}, 1000 * 60 * 15); // Check every 15 minutes

// === Preprocessing Layer ===
const sanitizeInput = (str) => {
  return str.replace(/[<>]/g, '').trim(); // Basic XSS prevention and trimming
};

const detectTaskType = (prompt) => {
  const p = prompt.toLowerCase();
  if (p.includes('translate') || p.includes('meaning') || p.includes('say') || p.includes('how to say')) return 'translation';
  if (p.includes('navigate') || p.includes('route') || p.includes('how to reach') || p.includes('distance')) return 'navigation';
  if (p.includes('recommend') || p.includes('suggest') || p.includes('places') || p.includes('itinerary')) return 'recommendations';
  return 'general';
};

// === Model Router ===
const getModelForTask = (taskType) => {
  // Free fallback/local model substitute
  const SIMPLE_MODEL = 'openrouter/auto'; 
  const MEDIUM_MODEL = 'openrouter/auto';
  const COMPLEX_MODEL = 'openrouter/auto'; 

  switch(taskType) {
    case 'translation':
    case 'general':
      return SIMPLE_MODEL;
    case 'navigation':
      return MEDIUM_MODEL;
    case 'recommendations':
      return COMPLEX_MODEL;
    default:
      return MEDIUM_MODEL;
  }
};

/**
 * POST /api/ai
 * Handle AI chat request — accepts prompt & optional conversation history.
 */
const handleAIRequest = asyncHandler(async (req, res) => {
  let { prompt, conversationHistory } = req.body;

  // Validate prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a non-empty prompt.',
    });
  }

  // === Input Validation & Sanitization ===
  if (prompt.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is too long. Please keep it under 1000 characters.',
    });
  }

  // Sanitize the input
  prompt = sanitizeInput(prompt);

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

  // === Cache Check ===
  // Generate a cache key based on prompt and history
  const cacheKey = JSON.stringify({ prompt, history: conversationHistory || [] });
  if (aiCache.has(cacheKey)) {
    const cachedResponse = aiCache.get(cacheKey);
    console.log('[AI Service] Serving response from Cache');
    return res.status(200).json({
      success: true,
      data: {
        reply: cachedResponse.reply,
        model: cachedResponse.model,
        cached: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // === Task Detection & Model Routing ===
  const taskType = detectTaskType(prompt);
  const selectedModel = getModelForTask(taskType);
  console.log(`[AI Service] Detected Task: ${taskType} -> Routed to Model: ${selectedModel}`);

  // === AI Processing Layer ===
  const reply = await askAI(prompt, conversationHistory || [], selectedModel);

  // === Cache Storage ===
  aiCache.set(cacheKey, {
    reply,
    model: selectedModel,
    timestamp: Date.now()
  });

  // === Response ===
  res.status(200).json({
    success: true,
    data: {
      reply,
      model: selectedModel,
      cached: false,
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = { handleAIRequest };
