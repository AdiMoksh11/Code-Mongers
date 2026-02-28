const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema(
  {
    job: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true 
    },
    applicant: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    message: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'], 
      default: 'pending' 
    },
    appliedAt: { 
      type: Date, 
      default: Date.now 
    },
    // Additional fields for tracking
    reviewedAt: { 
      type: Date 
    },
    reviewedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    notes: { 
      type: String, 
      trim: true 
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
JobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // Prevent duplicate applications
JobApplicationSchema.index({ applicant: 1, appliedAt: -1 }); // For user's application history
JobApplicationSchema.index({ job: 1, status: 1 }); // For employer's application management
JobApplicationSchema.index({ status: 1, appliedAt: -1 }); // For filtering by status

// Clean JSON output for APIs
JobApplicationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
JobApplicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
