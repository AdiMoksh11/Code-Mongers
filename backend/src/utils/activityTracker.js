const winston = require('winston');
const mongoose = require('mongoose');
const Activity = require('../models/activityModel');

// Configure Winston logger for activities
const activityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'activity-tracker' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/activity-error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/activity.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  activityLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class ActivityTracker {
  /**
   * Log user activity to both Winston and database
   * @param {Object} activityData - Activity information
   */
  static async logActivity(activityData) {
    try {
      const {
        userId,
        userRole,
        activityType,
        description,
        metadata = {},
        relatedEntityType = 'none',
        relatedEntityId = null,
        ipAddress = null,
        userAgent = null,
        status = 'success'
      } = activityData;

      // Check for duplicate activities within the last 5 seconds for login/logout activities
      if (['login', 'logout', 'account_created'].includes(activityType)) {
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        const existingActivity = await Activity.findOne({
          userId,
          activityType,
          createdAt: { $gte: fiveSecondsAgo }
        }).sort({ createdAt: -1 });

        if (existingActivity) {
          activityLogger.warn('Duplicate activity prevented', {
            userId,
            activityType,
            description,
            existingActivityId: existingActivity._id,
            timeDiff: new Date() - existingActivity.createdAt
          });
          return existingActivity; // Return existing activity instead of creating duplicate
        }
      }

      // Log to Winston first
      activityLogger.info('User Activity', {
        userId,
        userRole,
        activityType,
        description,
        metadata,
        ipAddress,
        timestamp: new Date().toISOString()
      });

      // Save to database
      const activity = new Activity({
        userId,
        userRole,
        activityType,
        description,
        metadata,
        relatedEntityType,
        relatedEntityId,
        ipAddress,
        userAgent,
        status
      });

      await activity.save();

      return activity;
    } catch (error) {
      activityLogger.error('Failed to log activity', {
        error: error.message,
        activityData
      });
      throw error;
    }
  }

  /**
   * Log learner-specific activities
   */
  static async logLearnerActivity(userId, activityType, description, metadata = {}, req = null) {
    return this.logActivity({
      userId,
      userRole: 'learner',
      activityType,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  /**
   * Log employer-specific activities
   */
  static async logEmployerActivity(userId, activityType, description, metadata = {}, req = null) {
    return this.logActivity({
      userId,
      userRole: 'employer',
      activityType,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  /**
   * Log institute-specific activities
   */
  static async logInstituteActivity(userId, activityType, description, metadata = {}, req = null) {
    return this.logActivity({
      userId,
      userRole: 'institute',
      activityType,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  /**
   * Get user activities with pagination
   */
  static async getUserActivities(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      activityType = null,
      startDate = null,
      endDate = null
    } = options;

    const query = { userId };

    if (activityType) {
      query.activityType = activityType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('relatedEntityId', 'name title') // Populate related entities
      .lean();

    const total = await Activity.countDocuments(query);

    return {
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }

  /**
   * Get activity summary/stats for user
   */
  static async getUserActivityStats(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Activity.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return stats;
  }
}

module.exports = ActivityTracker;