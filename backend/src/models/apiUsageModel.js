const mongoose = require('mongoose');

const ApiUsageSchema = new mongoose.Schema(
  {
    apiKey: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ApiKey', 
      required: true, 
      index: true 
    },
    issuer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    endpoint: { 
      type: String, 
      required: true 
    },
    method: { 
      type: String, 
      required: true 
    },
    statusCode: { 
      type: Number, 
      required: true 
    },
    responseTime: { 
      type: Number 
    },
    requestSize: { 
      type: Number 
    },
    responseSize: { 
      type: Number 
    },
    ipAddress: { 
      type: String 
    },
    userAgent: { 
      type: String 
    },
    errorMessage: { 
      type: String 
    },
    credentialId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Credential' 
    },
    requestData: {
      studentEmail: String,
      credentialTitle: String,
      nsqfLevel: Number
    },
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox'
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for analytics queries
ApiUsageSchema.index({ issuer: 1, createdAt: -1 });
ApiUsageSchema.index({ apiKey: 1, createdAt: -1 });
ApiUsageSchema.index({ endpoint: 1, statusCode: 1 });
ApiUsageSchema.index({ createdAt: -1 });

// TTL index - keep logs for 90 days
ApiUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('ApiUsage', ApiUsageSchema);