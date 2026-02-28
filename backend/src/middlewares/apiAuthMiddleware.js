const ApiKey = require('../models/apiKeyModel');
const ApiUsage = require('../models/apiUsageModel');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'API_KEY_MISSING',
        message: 'API key is required. Please provide it in the Authorization header as "Bearer YOUR_API_KEY"'
      });
    }

    const apiKey = authHeader.substring(7);
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Find and validate API key
    const apiKeyDoc = await ApiKey.findOne({ 
      keyHash,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }).populate('issuer', 'institute fullName email');

    if (!apiKeyDoc) {
      return res.status(401).json({
        success: false,
        error: 'API_KEY_INVALID',
        message: 'Invalid or expired API key'
      });
    }

    // Check IP whitelist if configured
    if (apiKeyDoc.ipWhitelist && apiKeyDoc.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!apiKeyDoc.ipWhitelist.includes(clientIP)) {
        await logApiUsage(req, apiKeyDoc, 403, startTime, 'IP not whitelisted');
        return res.status(403).json({
          success: false,
          error: 'IP_NOT_ALLOWED',
          message: 'Your IP address is not whitelisted for this API key'
        });
      }
    }

    // Update usage and attach to request
    await apiKeyDoc.updateUsage();
    req.apiKey = apiKeyDoc;
    req.issuer = apiKeyDoc.issuer;
    
    // Add response logging
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      logApiUsage(req, apiKeyDoc, res.statusCode, responseTime);
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('API Key authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Authentication failed'
    });
  }
};

// Log API usage for analytics
const logApiUsage = async (req, apiKeyDoc, statusCode, responseTime, errorMessage = null) => {
  try {
    const usage = new ApiUsage({
      apiKey: apiKeyDoc._id,
      issuer: apiKeyDoc.issuer._id,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode,
      responseTime,
      requestSize: JSON.stringify(req.body || {}).length,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      errorMessage,
      environment: apiKeyDoc.environment,
      requestData: {
        studentEmail: req.body?.studentEmail,
        credentialTitle: req.body?.credentialTitle,
        nsqfLevel: req.body?.nsqfLevel
      }
    });
    
    await usage.save();
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
};

// Rate limiting middleware for API endpoints
const apiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    if (req.apiKey) {
      return req.apiKey.rateLimit.requestsPerHour;
    }
    return 100; // Default limit for unauthenticated requests
  },
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please check your rate limits.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Permission check middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.permissions[permission]) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `This API key does not have permission: ${permission}`
      });
    }
    next();
  };
};

// Environment check middleware
const requireEnvironment = (env) => {
  return (req, res, next) => {
    if (req.apiKey.environment !== env) {
      return res.status(403).json({
        success: false,
        error: 'ENVIRONMENT_MISMATCH',
        message: `This endpoint requires ${env} environment`
      });
    }
    next();
  };
};

module.exports = {
  authenticateApiKey,
  apiRateLimit,
  requirePermission,
  requireEnvironment,
  logApiUsage
};