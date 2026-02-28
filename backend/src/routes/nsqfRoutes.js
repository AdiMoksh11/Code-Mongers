const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getUserSkillProfile,
  getSkillProgress,
  getSkillRecommendations,
  getUserSkillRankings,
  getNSQFLevelInfo,
  getSkillDomainLeaderboard,
  getSkillStatistics
  ,getStackabilityMap
  ,getVisualizationData
} = require('../controllers/nsqfController');

// All routes require authentication
router.use(protect);

// User's skill profile and progress routes
router.get('/profile', getUserSkillProfile);
router.get('/progress/:skillDomain', getSkillProgress);
router.get('/recommendations', getSkillRecommendations);
router.get('/rankings', getUserSkillRankings);

// NSQF level information routes
router.get('/levels/:level', getNSQFLevelInfo);

// Leaderboard and statistics routes
router.get('/leaderboard/:skillDomain', getSkillDomainLeaderboard);
router.get('/statistics', getSkillStatistics);

// Stackability map and visualization data routes
router.get('/stackability-map', getStackabilityMap);
router.get('/visualization-data', getVisualizationData);

module.exports = router;
