const NSQFService = require('../services/nsqfService');
const UserSkill = require('../models/userSkillModel');

/**
 * Get user's complete skill profile with NSQF levels
 */
const getUserSkillProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await NSQFService.getUserSkillProfile(userId);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get User Skill Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill profile',
      error: error.message
    });
  }
};

/**
 * Get progress for a specific skill domain
 */
const getSkillProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillDomain } = req.params;
    
    const progress = await NSQFService.getSkillProgress(userId, skillDomain);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get Skill Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill progress',
      error: error.message
    });
  }
};

/**
 * Get skill advancement recommendations
 */
const getSkillRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillDomain } = req.query;
    
    const recommendations = await NSQFService.getSkillRecommendations(userId, skillDomain);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get Skill Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
};

/**
 * Get user's skill rankings/leaderboard position
 */
const getUserSkillRankings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillDomain } = req.query;
    
    const rankings = await NSQFService.getUserSkillRanking(userId, skillDomain);
    
    res.json({
      success: true,
      data: rankings
    });
  } catch (error) {
    console.error('Get User Skill Rankings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill rankings',
      error: error.message
    });
  }
};

/**
 * Get NSQF level requirements and information
 */
const getNSQFLevelInfo = async (req, res) => {
  try {
    const { level } = req.params;
    const levelNum = parseInt(level);
    
    if (levelNum < 1 || levelNum > 10) {
      return res.status(400).json({
        success: false,
        message: 'NSQF level must be between 1 and 10'
      });
    }
    
    const levelInfo = UserSkill.getLevelRequirements(levelNum);
    
    // Add additional context about the level
    const levelDetails = {
      level: levelNum,
      ...levelInfo,
      description: getNSQFLevelDescription(levelNum),
      typicalRoles: getNSQFLevelRoles(levelNum),
      skills: getNSQFLevelSkills(levelNum)
    };
    
    res.json({
      success: true,
      data: levelDetails
    });
  } catch (error) {
    console.error('Get NSQF Level Info Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NSQF level information',
      error: error.message
    });
  }
};

/**
 * Get skill domain leaderboard
 */
const getSkillDomainLeaderboard = async (req, res) => {
  try {
    const { skillDomain } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const leaderboard = await UserSkill.find({ skillDomain })
      .populate('user', 'fullName profilePic institute')
      .sort({ totalPoints: -1, currentLevel: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const formattedLeaderboard = leaderboard.map((userSkill, index) => ({
      rank: parseInt(offset) + index + 1,
      user: {
        id: userSkill.user._id,
        fullName: userSkill.user.fullName,
        profilePic: userSkill.user.profilePic,
        institute: userSkill.user.institute
      },
      skillDomain: userSkill.skillDomain,
      currentLevel: userSkill.currentLevel,
      levelName: UserSkill.getLevelRequirements(userSkill.currentLevel).name,
      totalPoints: userSkill.totalPoints,
      certificatesCount: userSkill.certificates.length,
      lastUpdated: userSkill.lastUpdated
    }));
    
    res.json({
      success: true,
      data: {
        skillDomain,
        leaderboard: formattedLeaderboard,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: await UserSkill.countDocuments({ skillDomain })
        }
      }
    });
  } catch (error) {
    console.error('Get Skill Domain Leaderboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill domain leaderboard',
      error: error.message
    });
  }
};

/**
 * Get overall skill statistics
 */
const getSkillStatistics = async (req, res) => {
  try {
    // Get top skill domains
    const topSkillDomains = await UserSkill.aggregate([
      {
        $group: {
          _id: '$skillDomain',
          totalUsers: { $sum: 1 },
          averageLevel: { $avg: '$currentLevel' },
          totalPoints: { $sum: '$totalPoints' },
          maxLevel: { $max: '$currentLevel' }
        }
      },
      {
        $sort: { totalUsers: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Get level distribution
    const levelDistribution = await UserSkill.aggregate([
      {
        $group: {
          _id: '$currentLevel',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get total statistics
    const totalStats = await UserSkill.aggregate([
      {
        $group: {
          _id: null,
          totalSkillEntries: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          totalPoints: { $sum: '$totalPoints' },
          averageLevel: { $avg: '$currentLevel' }
        }
      },
      {
        $project: {
          totalSkillEntries: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          totalPoints: 1,
          averageLevel: { $round: ['$averageLevel', 2] }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        topSkillDomains,
        levelDistribution,
        totalStats: totalStats[0] || {
          totalSkillEntries: 0,
          uniqueUsers: 0,
          totalPoints: 0,
          averageLevel: 0
        }
      }
    });
  } catch (error) {
    console.error('Get Skill Statistics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill statistics',
      error: error.message
    });
  }
};

// Helper functions for NSQF level descriptions
function getNSQFLevelDescription(level) {
  const descriptions = {
    1: "Basic awareness and foundational skills. Entry-level understanding of concepts.",
    2: "Elementary skills with limited complexity. Can perform simple tasks with guidance.",
    3: "Intermediate skills with moderate complexity. Can work independently on routine tasks.",
    4: "Upper intermediate skills. Can handle complex tasks and solve problems independently.",
    5: "Advanced skills requiring significant knowledge. Can mentor others and lead projects.",
    6: "Proficient level with expertise in specialized areas. Can design and implement solutions.",
    7: "Expert level with deep specialization. Can innovate and create new methodologies.",
    8: "Advanced expert with industry recognition. Can lead organizational transformations.",
    9: "Master level with thought leadership. Can drive industry standards and best practices.",
    10: "Grand master level with global recognition. Can shape the future of the field."
  };
  return descriptions[level] || "Level description not available.";
}

function getNSQFLevelRoles(level) {
  const roles = {
    1: ["Trainee", "Assistant", "Helper"],
    2: ["Junior Assistant", "Support Staff", "Entry-level roles"],
    3: ["Associate", "Junior Developer", "Analyst"],
    4: ["Senior Associate", "Developer", "Specialist"],
    5: ["Senior Developer", "Team Lead", "Consultant"],
    6: ["Senior Consultant", "Technical Lead", "Manager"],
    7: ["Principal Consultant", "Architect", "Senior Manager"],
    8: ["Chief Technology Officer", "Director", "Practice Head"],
    9: ["VP of Engineering", "Chief Architect", "Industry Expert"],
    10: ["CTO", "Chief Scientist", "Global Thought Leader"]
  };
  return roles[level] || ["Role information not available"];
}

function getNSQFLevelSkills(level) {
  const skills = {
    1: ["Basic computer literacy", "Following instructions", "Learning fundamentals"],
    2: ["Tool usage", "Simple problem solving", "Basic communication"],
    3: ["Independent work", "Intermediate technical skills", "Process improvement"],
    4: ["Complex problem solving", "Team collaboration", "Technical leadership"],
    5: ["Strategic thinking", "Mentoring", "Advanced technical skills"],
    6: ["Solution architecture", "Cross-functional leadership", "Innovation"],
    7: ["Thought leadership", "Research & development", "Industry expertise"],
    8: ["Organizational transformation", "Strategic planning", "Global perspective"],
    9: ["Visionary leadership", "Industry influence", "Knowledge creation"],
    10: ["Global thought leadership", "Field transformation", "Legacy building"]
  };
  return skills[level] || ["Skill information not available"];
}

/**
 * Get stackability map for a user
 */
const getStackabilityMap = async (req, res) => {
  try {
    const userId = req.user._id;
    const map = await NSQFService.getStackabilityMap(userId);
    res.json({ success: true, data: map });
  } catch (error) {
    console.error('Get Stackability Map Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stackability map', error: error.message });
  }
};

/**
 * Get visualization data for NSQF progress
 */
const getVisualizationData = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = await NSQFService.getVisualizationData(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get Visualization Data Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visualization data', error: error.message });
  }
};

module.exports = {
  getUserSkillProfile,
  getSkillProgress,
  getSkillRecommendations,
  getUserSkillRankings,
  getNSQFLevelInfo,
  getSkillDomainLeaderboard,
  getSkillStatistics
  ,getStackabilityMap
  ,getVisualizationData
};
