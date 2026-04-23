// routes/ai.routes.js — AI assistant API routes
const express = require('express');
const router = express.Router();
const { handleAIRequest } = require('../controllers/ai.controller');
const { aiLimiter } = require('../middleware/rateLimiter');

// POST /api/ai — Send a prompt to the AI assistant
router.post('/', aiLimiter, handleAIRequest);

module.exports = router;
