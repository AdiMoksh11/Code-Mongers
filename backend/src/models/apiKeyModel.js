const mongoose = require('mongoose');
const crypto = require('crypto');

const ApiKeySchema = new mongoose.Schema(
  {
    issuer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    keyName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    keyHash: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    keyPrefix: { 
      type: String, 
      required: true 
    },
    permissions: {
      canCreateCredentials: { type: Boolean, default: true },
      canViewCredentials: { type: Boolean, default: true },
      canRevokeCredentials: { type: Boolean, default: false }
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    lastUsed: { 
      type: Date 
    },
    usageCount: { 
      type: Number, 
      default: 0 
    },
    rateLimit: {
      requestsPerHour: { type: Number, default: 1000 },
      requestsPerDay: { type: Number, default: 10000 }
    },
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox'
    },
    expiresAt: { 
      type: Date 
    },
    revokedAt: { 
      type: Date 
    },
    revokedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    ipWhitelist: [{ 
      type: String 
    }],
    webhookUrl: { 
      type: String 
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for masked key display
ApiKeySchema.virtual('maskedKey').get(function() {
  return `${this.keyPrefix}****${this.keyHash.slice(-4)}`;
});

// Indexes for performance
ApiKeySchema.index({ issuer: 1, isActive: 1 });
ApiKeySchema.index({ keyHash: 1, isActive: 1 });
ApiKeySchema.index({ createdAt: -1 });

// Static method to generate API key
ApiKeySchema.statics.generateApiKey = function(issuerName) {
  const prefix = `ck_${issuerName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8)}_`;
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `${prefix}${randomBytes}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  
  return {
    key,
    hash,
    prefix
  };
};

// Method to verify API key
ApiKeySchema.methods.verifyKey = function(providedKey) {
  const hash = crypto.createHash('sha256').update(providedKey).digest('hex');
  return this.keyHash === hash && this.isActive && !this.revokedAt;
};

// Method to update usage
ApiKeySchema.methods.updateUsage = function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  return this.save();
};

// Method to revoke key
ApiKeySchema.methods.revoke = function(revokedBy) {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  return this.save();
};

module.exports = mongoose.model('ApiKey', ApiKeySchema);