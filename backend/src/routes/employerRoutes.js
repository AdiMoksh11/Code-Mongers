const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  getAnalytics, 
  getUserCredentialsForEmployer, 
  verifyCredentialByHash 
} = require('../controllers/employerController');

// All routes require authentication (employer role can be enforced later if needed)
router.use(protect);

// GET /api/employer/analytics
router.get('/analytics', getAnalytics);

// GET /api/employer/users/:id/credentials - Get all credentials for a specific user
router.get('/users/:id/credentials', getUserCredentialsForEmployer);

// POST /api/employer/verify-hash - Verify credential by blockchain hash
router.post('/verify-hash', verifyCredentialByHash);

module.exports = router;
