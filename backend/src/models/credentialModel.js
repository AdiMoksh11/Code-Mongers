const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    type: { type: String, enum: ['certificate', 'degree', 'license', 'badge'], required: true },
    status: { type: String, enum: ['verified', 'pending'], default: 'pending' },
    issuerVerification: {
      status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    issueDate: { type: Date, required: true },
    description: { type: String },
    skills: { type: [String], default: [] },
    credentialUrl: { type: String },
    imageUrl: { type: String },
    nsqfLevel: { type: Number },
    blockchainAddress: { type: String },
    transactionHash: { type: String },
    credentialHash: { type: String, index: true, unique: true, sparse: true },
    issuerLogo: { type: String },
    credentialId: { type: String },
    creditPoints: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Credential', CredentialSchema);
