const ApiKey = require('../models/apiKeyModel');
const ApiUsage = require('../models/apiUsageModel');
const User = require('../models/userModel');
const crypto = require('crypto');


const generateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyName, environment = 'sandbox', permissions = {}, expiresInDays, ipWhitelist, webhookUrl } = req.body;

    if (!keyName || keyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Key name is required'
      });
    }

    const user = await User.findById(userId).select('institute fullName');
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    // Check if user already has max number of keys (10)
    const existingKeysCount = await ApiKey.countDocuments({ 
      issuer: userId, 
      isActive: true 
    });

    if (existingKeysCount >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of API keys (10) reached. Please revoke unused keys first.'
      });
    }

    // Generate API key
    const { key, hash, prefix } = ApiKey.generateApiKey(user.institute.name);

    // Set expiration if provided
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create API key document
    const apiKeyDoc = new ApiKey({
      issuer: userId,
      keyName: keyName.trim(),
      keyHash: hash,
      keyPrefix: prefix,
      permissions: {
        canCreateCredentials: permissions.canCreateCredentials !== false,
        canViewCredentials: permissions.canViewCredentials !== false,
        canRevokeCredentials: permissions.canRevokeCredentials || false
      },
      environment,
      expiresAt,
      ipWhitelist: ipWhitelist || [],
      webhookUrl
    });

    await apiKeyDoc.save();

    // Return the key only once (never store plain key in database)
    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        id: apiKeyDoc._id,
        keyName,
        apiKey: key, // Only returned once!
        environment,
        permissions: apiKeyDoc.permissions,
        expiresAt,
        createdAt: apiKeyDoc.createdAt,
        maskedKey: apiKeyDoc.maskedKey
      },
      warning: 'Please save this API key securely. It will not be shown again.'
    });

  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key'
    });
  }
};

// List API keys for current user
const listApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, environment } = req.query;

    const query = { issuer: userId };
    if (environment) query.environment = environment;

    const apiKeys = await ApiKey.find(query)
      .select('-keyHash') // Never return the hash
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ApiKey.countDocuments(query);

    const keysWithStats = await Promise.all(
      apiKeys.map(async (key) => {
        const recentUsage = await ApiUsage.countDocuments({
          apiKey: key._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        return {
          id: key._id,
          keyName: key.keyName,
          maskedKey: key.maskedKey,
          environment: key.environment,
          permissions: key.permissions,
          isActive: key.isActive,
          lastUsed: key.lastUsed,
          usageCount: key.usageCount,
          recentUsage,
          expiresAt: key.expiresAt,
          createdAt: key.createdAt,
          revokedAt: key.revokedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        apiKeys: keysWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalKeys: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API keys'
    });
  }
};

// Get API key details
const getApiKeyDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOne({ 
      _id: keyId, 
      issuer: userId 
    }).select('-keyHash');

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Get usage statistics
    const [totalUsage, last24hUsage, last7dUsage, last30dUsage] = await Promise.all([
      ApiUsage.countDocuments({ apiKey: keyId }),
      ApiUsage.countDocuments({ 
        apiKey: keyId, 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      ApiUsage.countDocuments({ 
        apiKey: keyId, 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      ApiUsage.countDocuments({ 
        apiKey: keyId, 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get recent usage logs
    const recentLogs = await ApiUsage.find({ apiKey: keyId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('endpoint method statusCode responseTime createdAt errorMessage');

    res.json({
      success: true,
      data: {
        apiKey: {
          id: apiKey._id,
          keyName: apiKey.keyName,
          maskedKey: apiKey.maskedKey,
          environment: apiKey.environment,
          permissions: apiKey.permissions,
          isActive: apiKey.isActive,
          lastUsed: apiKey.lastUsed,
          usageCount: apiKey.usageCount,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
          revokedAt: apiKey.revokedAt,
          ipWhitelist: apiKey.ipWhitelist,
          webhookUrl: apiKey.webhookUrl
        },
        usage: {
          total: totalUsage,
          last24h: last24hUsage,
          last7d: last7dUsage,
          last30d: last30dUsage
        },
        recentLogs
      }
    });

  } catch (error) {
    console.error('Get API key details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API key details'
    });
  }
};

// Update API key
const updateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const { keyName, permissions, ipWhitelist, webhookUrl, isActive } = req.body;

    const apiKey = await ApiKey.findOne({ 
      _id: keyId, 
      issuer: userId 
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Update fields
    if (keyName) apiKey.keyName = keyName.trim();
    if (permissions) {
      apiKey.permissions = {
        canCreateCredentials: permissions.canCreateCredentials !== false,
        canViewCredentials: permissions.canViewCredentials !== false,
        canRevokeCredentials: permissions.canRevokeCredentials || false
      };
    }
    if (ipWhitelist !== undefined) apiKey.ipWhitelist = ipWhitelist;
    if (webhookUrl !== undefined) apiKey.webhookUrl = webhookUrl;
    if (isActive !== undefined) apiKey.isActive = isActive;

    await apiKey.save();

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        id: apiKey._id,
        keyName: apiKey.keyName,
        maskedKey: apiKey.maskedKey,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        ipWhitelist: apiKey.ipWhitelist,
        webhookUrl: apiKey.webhookUrl
      }
    });

  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key'
    });
  }
};

// Revoke API key
const revokeApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOne({ 
      _id: keyId, 
      issuer: userId 
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    await apiKey.revoke(userId);

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key'
    });
  }
};

// Get API usage analytics
const getApiAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      startDate, 
      endDate, 
      keyId, 
      groupBy = 'day' 
    } = req.query;

    const matchQuery = { issuer: userId };
    
    if (keyId) matchQuery.apiKey = keyId;
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Get overall stats
    const [totalRequests, successfulRequests, errorRequests, uniqueEndpoints] = await Promise.all([
      ApiUsage.countDocuments(matchQuery),
      ApiUsage.countDocuments({ ...matchQuery, statusCode: { $lt: 400 } }),
      ApiUsage.countDocuments({ ...matchQuery, statusCode: { $gte: 400 } }),
      ApiUsage.distinct('endpoint', matchQuery)
    ]);

    // Get time series data
    const groupByFormat = groupBy === 'hour' ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d';
    const timeSeriesData = await ApiUsage.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
          requests: { $sum: 1 },
          errors: { 
            $sum: { 
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] 
            }
          },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get endpoint statistics
    const endpointStats = await ApiUsage.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$endpoint',
          requests: { $sum: 1 },
          errors: { 
            $sum: { 
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] 
            }
          },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { requests: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalRequests,
          successfulRequests,
          errorRequests,
          errorRate: totalRequests > 0 ? (errorRequests / totalRequests * 100).toFixed(2) : 0,
          uniqueEndpoints: uniqueEndpoints.length
        },
        timeSeries: timeSeriesData,
        topEndpoints: endpointStats
      }
    });

  } catch (error) {
    console.error('Get API analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API analytics'
    });
  }
};

module.exports = {
  generateApiKey,
  listApiKeys,
  getApiKeyDetails,
  updateApiKey,
  revokeApiKey,
  getApiAnalytics
};