const mongoose = require('mongoose');

// Validate project data middleware
const validateProjectData = (req, res, next) => {
  const { title, description, projectUrl, githubUrl, technologies } = req.body;
  const errors = [];

  // Validate title
  if (!title || !title.trim()) {
    errors.push('Project title is required');
  } else if (title.trim().length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  // Validate description
  if (description && description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  // Validate project URL
  if (projectUrl && !isValidUrl(projectUrl)) {
    errors.push('Project URL must be a valid URL');
  }

  // Validate GitHub URL
  if (githubUrl && !isValidUrl(githubUrl)) {
    errors.push('GitHub URL must be a valid URL');
  }

  // Validate technologies
  if (technologies) {
    try {
      let parsedTechnologies;
      if (typeof technologies === 'string') {
        parsedTechnologies = JSON.parse(technologies);
      } else {
        parsedTechnologies = technologies;
      }
      
      if (!Array.isArray(parsedTechnologies)) {
        errors.push('Technologies must be an array');
      }
    } catch (error) {
      errors.push('Invalid technologies format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Validate project ID parameter
const validateProjectId = (req, res, next) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid project ID format'
    });
  }

  next();
};

// Helper function to validate URLs
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// General error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum 5MB allowed.'
    });
  }

  if (err.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

module.exports = {
  validateProjectData,
  validateProjectId,
  errorHandler
};