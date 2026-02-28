const express = require('express');
const router = express.Router();
const {
  authenticateApiKey,
  apiRateLimit,
  requirePermission,
  requireEnvironment
} = require('../middlewares/apiAuthMiddleware');
const {
  submitCredential,
  bulkSubmitCredentials,
  getCredentialStatus,
  revokeCredential
} = require('../controllers/credentialApiController');

// Apply API authentication and rate limiting to all routes
router.use(authenticateApiKey);
router.use(apiRateLimit);

// API Documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    apiVersion: '1.0',
    documentation: {
      baseUrl: process.env.RENDER_BACKEND_URL || 'http://localhost:4000',
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer YOUR_API_KEY',
        description: 'Include your API key in the Authorization header'
      },
      endpoints: {
        'POST /api/external/credentials': {
          description: 'Submit a single credential',
          permissions: ['canCreateCredentials'],
          rateLimit: 'Based on your API key settings',
          requestBody: {
            studentEmail: 'string (required)',
            credentialTitle: 'string (required)',
            completionDate: 'ISO date string (required)',
            certificateUrl: 'string (required)',
            studentFirstName: 'string (optional)',
            studentLastName: 'string (optional)',
            description: 'string (optional)',
            nsqfLevel: 'number 1-10 (optional)',
            issueDate: 'ISO date string (optional)',
            skills: 'array of strings (optional)',
            credentialType: 'string (optional, default: certificate)',
            creditPoints: 'number (optional)',
            verificationHash: 'string (optional)',
            blockchainId: 'string (optional)',
            metadata: 'object (optional)'
          }
        },
        'POST /api/external/credentials/bulk': {
          description: 'Submit multiple credentials (max 100)',
          permissions: ['canCreateCredentials'],
          requestBody: {
            credentials: 'array of credential objects'
          }
        },
        'GET /api/external/credentials/:credentialId': {
          description: 'Get credential status and details',
          permissions: ['canViewCredentials']
        },
        'POST /api/external/credentials/:credentialId/revoke': {
          description: 'Revoke a credential',
          permissions: ['canRevokeCredentials'],
          requestBody: {
            reason: 'string (optional)'
          }
        }
      },
      responseFormat: {
        success: {
          success: true,
          message: 'string',
          data: 'object'
        },
        error: {
          success: false,
          error: 'ERROR_CODE',
          message: 'string',
          field: 'string (for validation errors)'
        }
      },
      errorCodes: {
        'API_KEY_MISSING': 'API key not provided',
        'API_KEY_INVALID': 'Invalid or expired API key',
        'RATE_LIMIT_EXCEEDED': 'Too many requests',
        'INSUFFICIENT_PERMISSIONS': 'API key lacks required permissions',
        'VALIDATION_ERROR': 'Request validation failed',
        'DUPLICATE_CREDENTIAL': 'Credential already exists',
        'CERTIFICATE_URL_ERROR': 'Certificate URL validation failed',
        'CREDENTIAL_NOT_FOUND': 'Credential not found',
        'SUBMISSION_ERROR': 'Failed to submit credential'
      },
      examples: {
        submitCredential: {
          request: {
            studentEmail: 'student@example.com',
            studentFirstName: 'John',
            studentLastName: 'Doe',
            credentialTitle: 'Advanced JavaScript Development',
            description: 'Comprehensive course covering modern JavaScript frameworks and best practices',
            completionDate: '2024-03-15T10:30:00Z',
            certificateUrl: 'https://yourcdn.com/certificates/12345.pdf',
            nsqfLevel: 5,
            skills: ['JavaScript', 'React', 'Node.js'],
            credentialType: 'certificate',
            creditPoints: 40
          },
          response: {
            success: true,
            message: 'Credential submitted successfully',
            data: {
              credentialId: '60f7b1234567890abcdef123',
              studentId: '60f7b1234567890abcdef456',
              credentialTitle: 'Advanced JavaScript Development',
              studentEmail: 'student@example.com',
              issuer: 'Your Institute Name',
              status: 'verified',
              issueDate: '2024-03-15T10:30:00.000Z',
              certificateUrl: 'https://yourcdn.com/certificates/12345.pdf',
              credentialHash: 'sha256hash...',
              submittedAt: '2024-03-15T10:35:00.000Z'
            }
          }
        }
      }
    }
  });
});

// Credential submission endpoints
router.post('/credentials', 
  requirePermission('canCreateCredentials'), 
  submitCredential
);

router.post('/credentials/bulk', 
  requirePermission('canCreateCredentials'), 
  bulkSubmitCredentials
);

// Credential management endpoints
router.get('/credentials/:credentialId', 
  requirePermission('canViewCredentials'), 
  getCredentialStatus
);

router.post('/credentials/:credentialId/revoke', 
  requirePermission('canRevokeCredentials'), 
  revokeCredential
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date(),
    apiKey: {
      issuer: req.issuer.institute.name,
      environment: req.apiKey.environment,
      permissions: req.apiKey.permissions
    }
  });
});

module.exports = router;