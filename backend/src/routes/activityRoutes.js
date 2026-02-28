const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  getUserActivities,
  getUserActivityStats,
  getActivityTypes
} = require('../controllers/activityController');

const router = express.Router();

// All activity routes require authentication
router.use(protect);

// Get user's activities with pagination and filters
router.get('/', getUserActivities);

// Get user's activity statistics
router.get('/stats', getUserActivityStats);

// Get available activity types for user's role
router.get('/types', getActivityTypes);

module.exports = router;