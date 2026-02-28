const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['learner', 'employer', 'institute'],
    required: true
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      // Learner activities - Profile & Account
      'account_created',
      'login',
      'logout',
      'password_reset',
      'password_changed',
      'email_changed',
      'profile_updated',
      'resume_uploaded',
      'resume_updated',
      
      // Learner activities - Credentials & Skills
      'credential_uploaded',
      'credential_shared',
      'credential_verified',
      'skill_assessment_completed',
      'career_recommendation_viewed',
      'certificate_downloaded',
      
      // Employer activities
      'candidate_profile_viewed',
      'skill_search_performed',
      'bulk_verification_requested',
      'interview_invitation_sent',
      'candidate_shortlisted',
      
      // Institute activities
      'credential_issued',
      'bulk_upload_completed',
      'analytics_accessed',
      'forensics_analysis_performed',
      'student_profile_created'
    ]
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for activity-specific data
    default: {}
  },
  relatedEntityType: {
    type: String,
    enum: ['credential', 'user', 'skill', 'job', 'assessment', 'none'],
    default: 'none'
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ userRole: 1, activityType: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 }); // For admin/analytics

// TTL index to automatically delete old activities (optional)
// activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

module.exports = mongoose.model('Activity', activitySchema);