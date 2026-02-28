const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  generateApiKey,
  listApiKeys,
  getApiKeyDetails,
  updateApiKey,
  revokeApiKey,
  getApiAnalytics
} = require('../controllers/apiController');

// All routes require authentication
router.use(protect);

// API Key Management Routes
router.post('/keys', generateApiKey);
router.get('/keys', listApiKeys);
router.get('/keys/:keyId', getApiKeyDetails);
router.put('/keys/:keyId', updateApiKey);
router.delete('/keys/:keyId', revokeApiKey);

// Analytics
router.get('/analytics', getApiAnalytics);

module.exports = router;