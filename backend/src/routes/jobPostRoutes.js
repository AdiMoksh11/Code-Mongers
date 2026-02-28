const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getAllJobs,
  getJobById,
  applyForJob,
  getUserApplications,
  createJob,
  listMyJobs,
  updateJobStatus,
  updateJob,
  getJobApplications,
  updateApplicationStatus
} = require('../controllers/jobPostController');

// Public routes (no authentication required)
router.get('/', getAllJobs); // Get all active jobs with filters

// Protected routes (authentication required)
router.use(protect);

// Learner routes
router.get('/applications', getUserApplications); // Get user's applications
router.get('/:jobId', getJobById); // Get specific job details
router.post('/:jobId/apply', applyForJob); // Apply for a job

// Employer routes
router.post('/', createJob); // Create new job
router.get('/my-jobs', listMyJobs); // Get employer's jobs
router.put('/:jobId/status', updateJobStatus); // Update job status
router.put('/:jobId', updateJob); // Update job details
router.get('/:jobId/applications', getJobApplications); // Get applications for a job
router.put('/:jobId/applications/:applicationId', updateApplicationStatus); // Update application status

module.exports = router;