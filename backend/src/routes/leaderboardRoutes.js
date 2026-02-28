const express = require('express');
const router = express.Router();
const { protect: authMiddleware } = require('../middlewares/authMiddleware');
const { 
  getLeaderboard, 
  getSkills, 
  getUserRank 
} = require('../controllers/leaderboardController');

// Get leaderboard data with optional filtering
// Query params: q (search), timeframe, category, course, limit
router.get('/leaderboard', authMiddleware, getLeaderboard);

// Get available skills and categories for dropdowns
router.get('/skills', authMiddleware, getSkills);

// Get current user's rank and points
router.get('/user-rank', authMiddleware, getUserRank);

module.exports = router;