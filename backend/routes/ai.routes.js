// routes/ai.routes.js — AI assistant API routes
const express = require('express');
const router = express.Router();
const { handleAIRequest } = require('../controllers/ai.controller');
const { aiLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth.middleware');

// POST /api/ai — Send a prompt to the AI assistant
// Flow: Auth (JWT) -> Rate Limiter -> AI Controller (Preprocessing, Cache, Model Router, AI Service)
router.post('/', protect, aiLimiter, handleAIRequest);

module.exports = router;
