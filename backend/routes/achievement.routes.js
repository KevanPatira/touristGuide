// routes/achievement.routes.js — Leaderboard & badge queries
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getLeaderboard,
  getMyAchievements,
  getUserAchievements,
} = require('../controllers/achievement.controller');

// All routes require authentication
router.use(protect);

router.get('/leaderboard', getLeaderboard);
router.get('/me', getMyAchievements);
router.get('/user/:userId', getUserAchievements);

module.exports = router;
