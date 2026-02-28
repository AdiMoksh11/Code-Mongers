const ActivityTracker = require('../utils/activityTracker');
const Activity = require('../models/activityModel');

/**
 * Get user's activity feed
 */
exports.getUserActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      activityType,
      startDate,
      endDate
    } = req.query;

    const result = await ActivityTracker.getUserActivities(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      activityType,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

/**
 * Get user's activity statistics
 */
exports.getUserActivityStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    const stats = await ActivityTracker.getUserActivityStats(userId, parseInt(days));

    // Get total activities count
    const totalActivities = await Activity.countDocuments({ userId });

    // Get recent activity
    const recentActivity = await Activity.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        stats,
        totalActivities,
        recentActivity,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get user activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
};

/**
 * Get activity types available for user's role
 */
exports.getActivityTypes = async (req, res) => {
  try {
    const userRole = req.user.role;

    const activityTypes = {
      learner: [
        'credential_uploaded',
        'credential_shared',
        'profile_updated',
        'skill_assessment_completed',
        'career_recommendation_viewed',
        'certificate_downloaded'
      ],
      employer: [
        'candidate_profile_viewed',
        'skill_search_performed',
        'bulk_verification_requested',
        'interview_invitation_sent',
        'candidate_shortlisted'
      ],
      institute: [
        'credential_issued',
        'bulk_upload_completed',
        'analytics_accessed',
        'forensics_analysis_performed',
        'student_profile_created'
      ]
    };

    res.json({
      success: true,
      data: {
        role: userRole,
        activityTypes: activityTypes[userRole] || []
      }
    });
  } catch (error) {
    console.error('Get activity types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity types',
      error: error.message
    });
  }
};