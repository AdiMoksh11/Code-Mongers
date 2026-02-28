const Credential = require('../models/credentialModel');
const User = require('../models/userModel');
const { verifyCredential } = require('../services/blockchainService');

// Helper to compute start date based on range
function rangeToStartDate(range) {
  const now = new Date();
  const d = new Date(now);
  switch (range) {
    case '90d':
      d.setDate(d.getDate() - 90);
      return d;
    case '30d':
      d.setDate(d.getDate() - 30);
      return d;
    case '7d':
    default:
      d.setDate(d.getDate() - 7);
      return d;
  }
}

// GET /api/employer/analytics
// Returns employer-facing analytics derived from available data
// Note: Some true employer KPIs (hires, interviews, offer acceptance) are not tracked yet;
// those fields are returned as null so the frontend can gracefully fallback.
const getAnalytics = async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const startDate = rangeToStartDate(range);

    // 1) KPI: credentialsVerified in range
    const credentialsVerified = await Credential.countDocuments({
      status: 'verified',
      createdAt: { $gte: startDate }
    });

    // 2) Time series: credentials created per day in range (as a proxy for activity/search interest)
    const groupFormat = '%Y-%m-%d';
    const timeSeriesAgg = await Credential.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const searchesOverTime = timeSeriesAgg.map((t) => ({ date: t._id, count: t.count }));

    // 3) Credentials by type (verified only)
    const byTypeAgg = await Credential.aggregate([
      { $match: { status: 'verified', createdAt: { $gte: startDate } } },
      { $group: { _id: { $ifNull: ['$type', 'certificate'] }, count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
    const credsByType = byTypeAgg;

    // 4) Simple pipeline approximation (learners with any credentials -> with verified -> with on-chain)
    // Note: Not a real hiring pipeline; provided for visual only until hiring data model exists
    const learnerIdsWithAny = await Credential.distinct('user');
    const learnerIdsWithVerified = await Credential.distinct('user', { status: 'verified' });
    const learnerIdsWithOnChain = await Credential.distinct('user', { transactionHash: { $exists: true, $ne: null } });
    const pipeline = [
      { stage: 'With Credentials', value: learnerIdsWithAny.length },
      { stage: 'With Verified', value: learnerIdsWithVerified.length },
      { stage: 'On-Chain', value: learnerIdsWithOnChain.length }
    ];

    // Hire sources are not tracked yet
    const hireSources = [];

    // Other KPIs aren't tracked yet
    const kpis = {
      candidatesHired: null,
      credentialsVerified,
      profileSearches: null,
      interviewsScheduled: null,
      offerAcceptance: null
    };

    res.json({
      success: true,
      data: {
        kpis,
        searchesOverTime,
        credsByType,
        pipeline,
        hireSources
      }
    });
  } catch (error) {
    console.error('Employer analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get employer analytics' });
  }
};

// GET /api/employer/users/:id/credentials
// Get all credentials for a specific user (for employer verification)
const getUserCredentialsForEmployer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify user exists and is a learner
    const user = await User.findById(id)
      .select('fullName email profilePic institute settings role')
      .lean();
      
    if (!user || user.role !== 'learner') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check privacy settings
    const isProfilePublic = user.settings?.preferences?.privacy?.profileVisibility !== 'private';
    if (!isProfilePublic) {
      return res.status(403).json({ success: false, message: 'This profile is private' });
    }

    // Get all user credentials
    const credentials = await Credential.find({ user: id })
      .select('title issuer issueDate skills status transactionHash credentialHash type description nsqfLevel creditPoints imageUrl credentialId issuerLogo createdAt')
      .sort({ issueDate: -1 })
      .lean();

    // Format user info
    const userInfo = {
      id: user._id.toString(),
      name: `${user.fullName?.firstName || ''} ${user.fullName?.lastName || ''}`.trim() || 'Anonymous User',
      email: user.email,
      profilePic: user.profilePic,
      institute: user.institute
    };

    // Format credentials
    const formattedCredentials = credentials.map(cred => ({
      id: cred._id.toString(),
      title: cred.title,
      issuer: cred.issuer,
      type: cred.type || 'certificate',
      issueDate: cred.issueDate,
      description: cred.description,
      skills: cred.skills || [],
      nsqfLevel: cred.nsqfLevel,
      creditPoints: cred.creditPoints,
      status: cred.status,
      transactionHash: cred.transactionHash,
      credentialHash: cred.credentialHash,
      imageUrl: cred.imageUrl,
      issuerLogo: cred.issuerLogo,
      credentialId: cred.credentialId,
      isBlockchainVerified: !!cred.transactionHash,
      createdAt: cred.createdAt
    }));

    res.json({
      success: true,
      user: userInfo,
      credentials: formattedCredentials,
      totalCredentials: formattedCredentials.length,
      verifiedCredentials: formattedCredentials.filter(c => c.status === 'verified').length,
      blockchainCredentials: formattedCredentials.filter(c => c.isBlockchainVerified).length
    });

  } catch (error) {
    console.error('Get user credentials for employer error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user credentials' });
  }
};

// POST /api/employer/verify-hash
// Verify a credential by hash (blockchain verification)
const verifyCredentialByHash = async (req, res) => {
  try {
    const { hash } = req.body;
    
    if (!hash) {
      return res.status(400).json({ success: false, message: 'Hash is required' });
    }

    // Clean the hash (remove 0x prefix if present, then add it back)
    const cleanHash = hash.replace(/^0x/, '');
    const formattedHash = `0x${cleanHash}`;

    // First, try to find in database
    const credential = await Credential.findOne({ credentialHash: formattedHash })
      .populate('user', 'fullName email profilePic institute')
      .lean();

    let blockchainData = null;
    
    // Verify on blockchain
    try {
      const credentialData = await verifyCredential(formattedHash);
      if (credentialData && credentialData.timestamp !== 0n) {
        blockchainData = {
          issuer: credentialData.issuer,
          timestamp: Number(credentialData.timestamp),
          timestampDate: new Date(Number(credentialData.timestamp) * 1000).toISOString(),
          verified: true,
          source: 'blockchain'
        };
      }
    } catch (blockchainError) {
      console.log('Blockchain verification failed:', blockchainError.message);
    }

    if (!credential && !blockchainData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credential not found',
        details: 'This hash does not correspond to any credential in our system or on the blockchain'
      });
    }

    // Prepare response
    const response = {
      success: true,
      verified: !!blockchainData,
      hash: formattedHash,
      blockchain: blockchainData || { verified: false, source: 'database' },
      credential: credential ? {
        id: credential._id.toString(),
        title: credential.title,
        issuer: credential.issuer,
        type: credential.type,
        issueDate: credential.issueDate,
        description: credential.description,
        skills: credential.skills,
        nsqfLevel: credential.nsqfLevel,
        creditPoints: credential.creditPoints,
        status: credential.status,
        imageUrl: credential.imageUrl,
        issuerLogo: credential.issuerLogo,
        credentialId: credential.credentialId,
        transactionHash: credential.transactionHash
      } : null,
      user: credential?.user ? {
        id: credential.user._id.toString(),
        name: `${credential.user.fullName?.firstName || ''} ${credential.user.fullName?.lastName || ''}`.trim(),
        email: credential.user.email,
        profilePic: credential.user.profilePic,
        institute: credential.user.institute
      } : null,
      verifiedAt: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Verify credential by hash error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify credential',
      details: error.message 
    });
  }
};

module.exports = { 
  getAnalytics,
  getUserCredentialsForEmployer,
  verifyCredentialByHash
};
