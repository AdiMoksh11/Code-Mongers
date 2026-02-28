const Job = require('../models/jobModel');
const JobApplication = require('../models/jobApplicationModel');

// Get all active jobs with pagination and filters
const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 9, search, location, skills } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const userId = req.user?.id; // Get user ID if authenticated

    // Build search query
    let query = { status: 'active' };

    // Add search filters
    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { qualification: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    // Get jobs with pagination
    const jobs = await Job.find(query)
      .populate('employer', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Check application status for each job if user is authenticated
    let jobsWithApplicationStatus = jobs;
    if (userId) {
      jobsWithApplicationStatus = await Promise.all(
        jobs.map(async (job) => {
          const application = await JobApplication.findOne({
            job: job._id,
            applicant: userId
          });

          return {
            ...job.toObject(),
            hasApplied: !!application,
            applicationStatus: application?.status || null,
            applicationDate: application?.appliedAt || null
          };
        })
      );
    }

    // Get total count for pagination
    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      jobs: jobsWithApplicationStatus,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalJobs: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch jobs', 
      error: error.message 
    });
  }
};

// Get specific job by ID with application status
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    const job = await Job.findById(jobId).populate('employer', 'fullName email');
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if user has applied (if user is authenticated)
    let hasApplied = false;
    let applicationStatus = null;
    if (userId) {
      const application = await JobApplication.findOne({ job: jobId, applicant: userId });
      if (application) {
        hasApplied = true;
        applicationStatus = application.status;
      }
    }

    res.json({ 
      success: true, 
      job: { 
        ...job.toJSON(), 
        hasApplied,
        applicationStatus
      }
    });
  } catch (error) {
    console.error('❌ Error fetching job:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch job', 
      error: error.message 
    });
  }
};

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applicantId = req.user?.id;
    const { message = '' } = req.body;

    if (!applicantId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Job is not currently accepting applications' 
      });
    }

    // Check if user is the employer (can't apply to own job)
    if (job.employer.toString() === applicantId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot apply to your own job posting' 
      });
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({ 
      job: jobId, 
      applicant: applicantId 
    });

    if (existingApplication) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already applied for this job',
        applicationStatus: existingApplication.status
      });
    }

    // Create new application
    const application = await JobApplication.create({
      job: jobId,
      applicant: applicantId,
      message: message.trim()
    });

    // Populate the created application
    await application.populate([
      { path: 'job', select: 'jobTitle' },
      { path: 'applicant', select: 'fullName email' }
    ]);

    res.status(201).json({ 
      success: true, 
      application,
      message: 'Application submitted successfully' 
    });
  } catch (error) {
    console.error('❌ Error applying for job:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already applied for this job' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to apply for job', 
      error: error.message 
    });
  }
};

// Get user's job applications
const getUserApplications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Build query
    let query = { applicant: userId };
    if (status) {
      query.status = status;
    }

    // Get applications with pagination
    const applications = await JobApplication.find(query)
      .populate({
        path: 'job',
        select: 'jobTitle package location status employer createdAt',
        populate: { path: 'employer', select: 'fullName email' }
      })
      .sort({ appliedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total count for pagination
    const total = await JobApplication.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      applications,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalApplications: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user applications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch applications', 
      error: error.message 
    });
  }
};

// Get applications for employer's jobs
const getJobApplications = async (req, res) => {
  try {
    const employerId = req.user?.id;
    const { jobId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!employerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify job belongs to employer
    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or unauthorized' 
      });
    }

    // Build query
    let query = { job: jobId };
    if (status) {
      query.status = status;
    }

    // Get applications with pagination
    const applications = await JobApplication.find(query)
      .populate('applicant', 'fullName email phone profilePicture')
      .sort({ appliedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Get total count for pagination
    const total = await JobApplication.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      applications,
      job: job,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalApplications: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching job applications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch applications', 
      error: error.message 
    });
  }
};

// Update application status (for employers)
const updateApplicationStatus = async (req, res) => {
  try {
    const employerId = req.user?.id;
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    if (!employerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Find application and verify job belongs to employer
    const application = await JobApplication.findById(applicationId)
      .populate('job', 'employer jobTitle');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.job.employer.toString() !== employerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this application' 
      });
    }

    // Update application
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = employerId;
    if (notes) {
      application.notes = notes;
    }

    await application.save();

    res.json({ 
      success: true, 
      application,
      message: `Application status updated to ${status}` 
    });
  } catch (error) {
    console.error('❌ Error updating application status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update application status', 
      error: error.message 
    });
  }
};

// Create a new job post (Employer)
const createJob = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      jobTitle,
      package: pkg,
      location,
      qualification,
      experience,
      description,
      skills = [],
      contactEmail,
      contactPhone,
      status = 'active',
    } = req.body;

    if (!jobTitle || !pkg || !location || !qualification || !experience || !description || !contactEmail || !contactPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const job = await Job.create({
      employer: employerId,
      jobTitle,
      package: pkg,
      location,
      qualification,
      experience,
      description,
      skills: Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()).filter(Boolean),
      contactEmail,
      contactPhone,
      status,
    });

    return res.status(201).json({ success: true, job });
  } catch (error) {
    console.error('❌ Error creating job:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create job', 
      error: error.message 
    });
  }
};

// List current employer's jobs
const listMyJobs = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const jobs = await Job.find({ employer: employerId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, jobs });
  } catch (error) {
    console.error('❌ Error listing jobs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch jobs', 
      error: error.message 
    });
  }
};

// Update job status
const updateJobStatus = async (req, res) => {
  try {
    const employerId = req.user?.id;
    const { jobId } = req.params;
    const { status } = req.body;

    if (!employerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Validate status
    const validStatuses = ['active', 'closed', 'draft', 'paused'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: active, closed, draft, paused' 
      });
    }

    // Find job and ensure it belongs to the employer
    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or not authorized' 
      });
    }

    // Update status
    job.status = status;
    await job.save();

    res.json({ 
      success: true, 
      job,
      message: `Job status updated to ${status}` 
    });
  } catch (error) {
    console.error('❌ Error updating job status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update job status', 
      error: error.message 
    });
  }
};

// Update job details
const updateJob = async (req, res) => {
  try {
    const employerId = req.user?.id;
    const { jobId } = req.params;
    const updateData = req.body;

    if (!employerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Find job and ensure it belongs to the employer
    const job = await Job.findOne({ _id: jobId, employer: employerId });
    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or not authorized' 
      });
    }

    // Fields that can be updated
    const allowedUpdates = [
      'jobTitle', 'package', 'location', 'qualification', 'experience', 
      'description', 'skills', 'contactEmail', 'contactPhone', 'status'
    ];

    // Filter and apply updates
    const updates = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'skills' && Array.isArray(updateData[field])) {
          updates[field] = updateData[field];
        } else if (field === 'package') {
          updates[field] = updateData[field];
        } else if (field !== 'skills') {
          updates[field] = updateData[field];
        }
      }
    });

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      jobId, 
      updates, 
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      job: updatedJob,
      message: 'Job updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating job:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update job', 
      error: error.message 
    });
  }
};

module.exports = {
  // Learner/Public endpoints
  getAllJobs,
  getJobById,
  applyForJob,
  getUserApplications,

  // Employer endpoints
  createJob,
  listMyJobs,
  updateJobStatus,
  updateJob,
  getJobApplications,
  updateApplicationStatus
};