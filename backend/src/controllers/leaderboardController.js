const User = require('../models/userModel');
const Credential = require('../models/credentialModel');
const { SKILL_FILTER_CATEGORIES, CREDENTIAL_TYPE_CATEGORIES, CATEGORY_SKILL_MAPPING, SKILL_CATEGORIES } = require('../config/skillsConfig');

// Calculate user points based on credentials
const calculateUserPoints = (credentials) => {
  let points = 0;
  
  credentials.forEach(credential => {
    // Base points for each credential
    points += 100;
    
    // Bonus points based on credential type
    switch (credential.type?.toLowerCase()) {
      case 'certification':
        points += 50;
        break;
      case 'degree':
        points += 200;
        break;
      case 'diploma':
        points += 150;
        break;
      case 'course':
        points += 75;
        break;
      default:
        points += 25;
    }
    
    // Points for skills (10 points per skill)
    if (credential.skills && Array.isArray(credential.skills)) {
      points += credential.skills.length * 10;
    }
    
    // Bonus for credit points if available
    if (credential.creditPoints) {
      points += credential.creditPoints * 5;
    }
    
    // NSQF level bonus
    if (credential.nsqfLevel) {
      points += credential.nsqfLevel * 25;
    }
    
    // Recency bonus (newer credentials get more points)
    const credentialAge = Date.now() - new Date(credential.createdAt).getTime();
    const daysOld = credentialAge / (1000 * 60 * 60 * 24);
    if (daysOld < 30) {
      points += 50; // New credential bonus
    } else if (daysOld < 90) {
      points += 25; // Recent credential bonus
    }
  });
  
  return Math.floor(points);
};

// Get leaderboard data with filtering
const getLeaderboard = async (req, res) => {
  try {
    const { 
      q: searchQuery, 
      timeframe = 'all', 
      category = 'all', 
      course = 'all',
      limit = 50 
    } = req.query;

    // Build credential query based on timeframe
    let credentialQuery = {};
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        credentialQuery.createdAt = { $gte: startDate };
      }
    }

    // Add type-based filtering to credential query
    if (category !== 'all') {
      credentialQuery.type = category;
    }

    // Get all users with their credentials
    const users = await User.find({})
      .select('fullName email institute avatar profileImage profilePic settings')
      .lean();

    // Get credentials for each user
    const leaderboardData = await Promise.all(users.map(async (user) => {
      const userCredentials = await Credential.find({
        user: user._id,
        ...credentialQuery
      }).lean();

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = user.name?.toLowerCase().includes(query);
        const matchesInstitute = user.institute?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesInstitute) {
          return null; // Skip this user
        }
      }

      // Calculate user statistics
      const points = calculateUserPoints(userCredentials);
      const credentialCount = userCredentials.length;
      const uniqueSkills = [...new Set(userCredentials.flatMap(c => c.skills || []))];
      const skillCount = uniqueSkills.length;

      // Check privacy settings
      const isProfilePublic = user.settings?.preferences?.privacy?.profileVisibility !== 'private';
      const showInLeaderboard = user.settings?.preferences?.privacy?.showInLeaderboard !== false;
      
      // Skip users who don't want to be in leaderboard
      if (!showInLeaderboard) {
        return null;
      }

      // Construct display name
      let displayName = 'Anonymous User';
      let displayAvatar = `https://avatar.vercel.sh/${user._id}.png`;
      
      if (isProfilePublic) {
        // Try to get full name from fullName fields
        if (user.fullName?.firstName || user.fullName?.lastName) {
          const firstName = user.fullName.firstName || '';
          const lastName = user.fullName.lastName || '';
          displayName = `${firstName} ${lastName}`.trim();
        }
        
        // Use profile image if available
        displayAvatar = user.profileImage || user.profilePic || user.avatar || displayAvatar;
      }

      // Get most common skill/course for display
      const skillCounts = {};
      userCredentials.forEach(credential => {
        if (credential.skills && Array.isArray(credential.skills)) {
          credential.skills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        }
      });
      
      const topSkill = Object.keys(skillCounts).reduce((a, b) => 
        skillCounts[a] > skillCounts[b] ? a : b, 
        Object.keys(skillCounts)[0] || 'General'
      );

      return {
        id: user._id.toString(),
        name: displayName,
        institute: user.institute?.name || 'Unknown Institute',
        avatar: displayAvatar,
        points,
        credentials: credentialCount,
        skills: skillCount,
        course: topSkill
      };
    }));

    // Filter out null results and users with no credentials
    const filteredData = leaderboardData
      .filter(user => user !== null && user.credentials > 0);

    // Sort by points (descending)
    filteredData.sort((a, b) => b.points - a.points);

    // Add ranks
    const rankedData = filteredData.slice(0, parseInt(limit)).map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.json(rankedData);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leaderboard data' 
    });
  }
};

// Get available skills for dropdown
const getSkills = async (req, res) => {
  try {
    res.json({
      categories: SKILL_CATEGORIES,
      allSkills: Object.values(SKILL_CATEGORIES).reduce((acc, category) => {
        return [...acc, ...category.skills];
      }, []),
      filterCategories: SKILL_FILTER_CATEGORIES,
      credentialTypes: CREDENTIAL_TYPE_CATEGORIES
    });
  } catch (error) {
    console.error('Skills fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch skills data' 
    });
  }
};

// Get user's leaderboard position
const getUserRank = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all users' points for ranking
    const users = await User.find({}).select('_id').lean();
    const userPoints = await Promise.all(users.map(async (user) => {
      const credentials = await Credential.find({ user: user._id }).lean();
      return {
        userId: user._id.toString(),
        points: calculateUserPoints(credentials)
      };
    }));

    // Sort by points and find user's rank
    userPoints.sort((a, b) => b.points - a.points);
    const userRank = userPoints.findIndex(u => u.userId === userId.toString()) + 1;
    const userPointsTotal = userPoints.find(u => u.userId === userId.toString())?.points || 0;

    res.json({
      rank: userRank || null,
      points: userPointsTotal,
      totalUsers: userPoints.length
    });
  } catch (error) {
    console.error('User rank fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user rank' 
    });
  }
};

module.exports = {
  getLeaderboard,
  getSkills,
  getUserRank,
  calculateUserPoints
};