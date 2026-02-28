const express = require('express');
const router = express.Router();
const { searchJobs, getJobRecommendations, testMLService, createJob, listMyJobs, updateJobStatus, updateJob, getJobApplicants } = require('../controllers/jobController');
const { protect } = require('../middlewares/authMiddleware');

// Job search route
router.post('/search', searchJobs);

// Job recommendations route
router.post('/recommendations', getJobRecommendations);

// Test ML service route (for debugging)
router.get('/test-ml-service', testMLService);

// Employer job posting routes (protected)
router.post('/', protect, createJob);
router.get('/employer', protect, listMyJobs);
router.get('/:jobId/applicants', protect, getJobApplicants);
router.patch('/:jobId/status', protect, updateJobStatus);
router.patch('/:jobId', protect, updateJob);

module.exports = router;
