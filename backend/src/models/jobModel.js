const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobTitle: { type: String, required: true, trim: true },
    package: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    skills: { type: [String], default: [] },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9+()\-\s]{7,}$/, 'Please provide a valid phone number'],
    },
    status: { type: String, enum: ['active', 'closed', 'draft', 'paused'], default: 'active' },
  },
  { timestamps: true }
);

// Helpful indexes for common queries and search
JobSchema.index({ employer: 1, createdAt: -1 });
JobSchema.index({ status: 1, employer: 1 });
JobSchema.index({ jobTitle: 'text', description: 'text', location: 'text', qualification: 'text', skills: 'text' });

// Clean JSON output for APIs
JobSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
JobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', JobSchema);
