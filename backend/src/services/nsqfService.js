const UserSkill = require('../models/userSkillModel');
const Credential = require('../models/credentialModel');
const { determineSkillDomain, calculateCreditPoints } = require('./aiService');

class NSQFService {

  /**
   * Get stackability map for a user
   */
  static async getStackabilityMap(userId) {
    try {
      const userSkills = await UserSkill.find({ user: userId }).populate('certificates', 'title issuer nsqfLevel creditPoints createdAt');
      const map = userSkills.map(skill => {
        const currentLevel = skill.currentLevel;
        const completedLevels = [];
        for (let lvl = 1; lvl <= currentLevel; lvl++) {
          completedLevels.push({
            level: lvl,
            name: UserSkill.getLevelRequirements(lvl).name
          });
        }
        const nextLevel = Math.min(currentLevel + 1, 10);
        const nextLevelReq = UserSkill.getLevelRequirements(nextLevel);
        return {
          skillDomain: skill.skillDomain,
          currentLevel,
          completedLevels,
          inProgressLevel: nextLevel,
          pointsNeeded: nextLevelReq.minPoints - skill.totalPoints,
          nextLevelName: nextLevelReq.name,
          certificates: skill.certificates.map(cert => ({
            id: cert._id,
            title: cert.title,
            issuer: cert.issuer,
            nsqfLevel: cert.nsqfLevel,
            creditPoints: cert.creditPoints,
            createdAt: cert.createdAt
          }))
        };
      });
      return map;
    } catch (error) {
      console.error('Error building stackability map:', error);
      throw new Error('Failed to build stackability map');
    }
  }

  /**
   * Get visualization data for NSQF progress
   */
  static async getVisualizationData(userId) {
    try {
      const userSkills = await UserSkill.find({ user: userId }).populate('certificates', 'title issuer nsqfLevel creditPoints createdAt');
      // Build a graph-like structure for frontend visualization
      const data = userSkills.map(skill => {
        const nodes = [];
        for (let lvl = 1; lvl <= 10; lvl++) {
          nodes.push({
            id: `level-${skill.skillDomain}-${lvl}`,
            label: `Level ${lvl}: ${UserSkill.getLevelRequirements(lvl).name}`,
            completed: lvl <= skill.currentLevel,
            inProgress: lvl === skill.currentLevel + 1,
            pointsRequired: UserSkill.getLevelRequirements(lvl).minPoints,
            certificates: skill.certificates.filter(cert => cert.nsqfLevel === lvl).map(cert => ({
              id: cert._id,
              title: cert.title,
              issuer: cert.issuer,
              creditPoints: cert.creditPoints,
              createdAt: cert.createdAt
            }))
          });
        }
        return {
          skillDomain: skill.skillDomain,
          currentLevel: skill.currentLevel,
          totalPoints: skill.totalPoints,
          nodes
        };
      });
      return data;
    } catch (error) {
      console.error('Error building visualization data:', error);
      throw new Error('Failed to build visualization data');
    }
  }
  
  /**
   * Update user's skill progress when a new credential is added
   */
  static async updateUserSkillProgress(userId, credentialData) {
    try {
      const { title, nsqfLevel, creditPoints, skillDomain, description, skills } = credentialData;
      
      // Determine skill domain if not provided
      let finalSkillDomain = skillDomain;
      if (!finalSkillDomain) {
        finalSkillDomain = determineSkillDomain(title, description, skills);
      }
      
      // Calculate credit points if not provided
      let finalCreditPoints = creditPoints;
      if (!finalCreditPoints) {
        finalCreditPoints = calculateCreditPoints(nsqfLevel, title, description);
      }
      
      // Find or create user skill entry
      let userSkill = await UserSkill.findOne({
        user: userId,
        skillDomain: finalSkillDomain
      });
      
      if (!userSkill) {
        userSkill = new UserSkill({
          user: userId,
          skillDomain: finalSkillDomain,
          currentLevel: 0,
          totalPoints: 0,
          certificates: [],
          pointsHistory: [],
          levelUpHistory: []
        });
      }
      
      // Store previous level for history
      const previousLevel = userSkill.currentLevel;
      
      // Add points and update
      userSkill.totalPoints += finalCreditPoints;
      userSkill.certificates.push(credentialData._id);
      
      // Add to points history
      userSkill.pointsHistory.push({
        credentialId: credentialData._id,
        pointsAdded: finalCreditPoints,
        previousLevel: previousLevel,
        newLevel: userSkill.currentLevel,
        addedAt: new Date()
      });
      
      // Check for level up
      const newLevel = userSkill.checkLevelUp();
      if (newLevel > userSkill.currentLevel) {
        // Level up achieved!
        userSkill.levelUpHistory.push({
          fromLevel: userSkill.currentLevel,
          toLevel: newLevel,
          achievedAt: new Date(),
          triggeringCredential: credentialData._id
        });
        
        userSkill.currentLevel = newLevel;
        
        // Update the points history with new level
        userSkill.pointsHistory[userSkill.pointsHistory.length - 1].newLevel = newLevel;
      }
      
      userSkill.lastUpdated = new Date();
      await userSkill.save();
      
      return {
        skillDomain: finalSkillDomain,
        previousLevel,
        newLevel: userSkill.currentLevel,
        pointsAdded: finalCreditPoints,
        totalPoints: userSkill.totalPoints,
        leveledUp: newLevel > previousLevel,
        progress: userSkill.getProgressToNextLevel()
      };
      
    } catch (error) {
      console.error('Error updating user skill progress:', error);
      throw new Error('Failed to update skill progress');
    }
  }
  
  /**
   * Get user's complete skill profile
   */
  static async getUserSkillProfile(userId) {
    try {
      const userSkills = await UserSkill.find({ user: userId })
        .populate('certificates', 'title issuer nsqfLevel creditPoints createdAt')
        .sort({ totalPoints: -1 });
      
      const profile = {
        userId,
        totalSkills: userSkills.length,
        highestLevel: Math.max(...userSkills.map(skill => skill.currentLevel), 0),
        totalCredentials: userSkills.reduce((sum, skill) => sum + skill.certificates.length, 0),
        totalPoints: userSkills.reduce((sum, skill) => sum + skill.totalPoints, 0),
        skills: userSkills.map(skill => ({
          skillDomain: skill.skillDomain,
          currentLevel: skill.currentLevel,
          levelName: UserSkill.getLevelRequirements(skill.currentLevel).name,
          totalPoints: skill.totalPoints,
          certificatesCount: skill.certificates.length,
          progress: skill.getProgressToNextLevel(),
          lastUpdated: skill.lastUpdated,
          recentCertificates: skill.certificates.slice(-3) // Last 3 certificates
        }))
      };
      
      return profile;
    } catch (error) {
      console.error('Error fetching user skill profile:', error);
      throw new Error('Failed to fetch skill profile');
    }
  }
  
  /**
   * Get skill progress for a specific domain
   */
  static async getSkillProgress(userId, skillDomain) {
    try {
      const userSkill = await UserSkill.findOne({
        user: userId,
        skillDomain
      }).populate('certificates', 'title issuer nsqfLevel creditPoints createdAt imageUrl');
      
      if (!userSkill) {
        return {
          skillDomain,
          currentLevel: 0,
          levelName: "Not Started",
          totalPoints: 0,
          progress: { isMaxLevel: false, progressPercentage: 0, pointsNeeded: UserSkill.getLevelRequirements(1).minPoints, nextLevelName: "Beginner" },
          certificates: [],
          levelUpHistory: [],
          pointsHistory: []
        };
      }
      
      return {
        skillDomain: userSkill.skillDomain,
        currentLevel: userSkill.currentLevel,
        levelName: UserSkill.getLevelRequirements(userSkill.currentLevel).name,
        totalPoints: userSkill.totalPoints,
        progress: userSkill.getProgressToNextLevel(),
        certificates: userSkill.certificates,
        levelUpHistory: userSkill.levelUpHistory,
        pointsHistory: userSkill.pointsHistory.slice(-10) // Last 10 point additions
      };
    } catch (error) {
      console.error('Error fetching skill progress:', error);
      throw new Error('Failed to fetch skill progress');
    }
  }
  
  /**
   * Get recommendations for skill advancement
   */
  static async getSkillRecommendations(userId, skillDomain = null) {
    try {
      let userSkills;
      
      if (skillDomain) {
        const skill = await UserSkill.findOne({ user: userId, skillDomain });
        userSkills = skill ? [skill] : [];
      } else {
        userSkills = await UserSkill.find({ user: userId }).sort({ totalPoints: -1 });
      }
      
      const recommendations = [];
      
      for (const skill of userSkills) {
        const progress = skill.getProgressToNextLevel();
        
        if (!progress.isMaxLevel && progress.pointsNeeded > 0) {
          // Generate recommendations based on skill domain and current level
          const nextLevelSuggestions = this.generateCourseSuggestions(
            skill.skillDomain, 
            skill.currentLevel + 1,
            progress.pointsNeeded
          );
          
          recommendations.push({
            skillDomain: skill.skillDomain,
            currentLevel: skill.currentLevel,
            targetLevel: skill.currentLevel + 1,
            pointsNeeded: progress.pointsNeeded,
            progressPercentage: progress.progressPercentage,
            suggestions: nextLevelSuggestions
          });
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating skill recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }
  
  /**
   * Generate course suggestions for skill advancement
   */
  static generateCourseSuggestions(skillDomain, targetLevel, pointsNeeded) {
    const suggestions = [];
    
    // Domain-specific course suggestions
    const courseSuggestions = {
      "Python Programming": [
        { level: 3, title: "Python Object-Oriented Programming", points: 25, platform: "Coursera" },
        { level: 4, title: "Advanced Python Concepts", points: 30, platform: "edX" },
        { level: 5, title: "Python for Data Science", points: 35, platform: "Udemy" },
        { level: 6, title: "Python Web Development with Django", points: 40, platform: "Coursera" }
      ],
      "JavaScript Development": [
        { level: 3, title: "ES6+ JavaScript Features", points: 25, platform: "Udemy" },
        { level: 4, title: "Advanced JavaScript Patterns", points: 30, platform: "Coursera" },
        { level: 5, title: "Node.js Backend Development", points: 35, platform: "edX" },
        { level: 6, title: "Full Stack JavaScript Development", points: 40, platform: "Coursera" }
      ],
      "Web Development": [
        { level: 3, title: "Responsive Web Design", points: 25, platform: "freeCodeCamp" },
        { level: 4, title: "Modern Frontend Frameworks", points: 30, platform: "Udemy" },
        { level: 5, title: "Full Stack Web Development", points: 35, platform: "Coursera" },
        { level: 6, title: "Advanced Web Architecture", points: 40, platform: "edX" }
      ],
      "Data Science": [
        { level: 3, title: "Data Analysis with Pandas", points: 25, platform: "Coursera" },
        { level: 4, title: "Statistical Analysis", points: 30, platform: "edX" },
        { level: 5, title: "Machine Learning Fundamentals", points: 35, platform: "Coursera" },
        { level: 6, title: "Advanced Data Science", points: 40, platform: "Udemy" }
      ],
      "Machine Learning": [
        { level: 4, title: "Supervised Learning Algorithms", points: 30, platform: "Coursera" },
        { level: 5, title: "Deep Learning Fundamentals", points: 35, platform: "edX" },
        { level: 6, title: "Advanced Neural Networks", points: 40, platform: "Coursera" },
        { level: 7, title: "MLOps and Production ML", points: 45, platform: "Udemy" }
      ],
      "AWS Cloud Services": [
        { level: 3, title: "AWS Cloud Practitioner", points: 25, platform: "AWS Training" },
        { level: 4, title: "AWS Solutions Architect Associate", points: 35, platform: "AWS Training" },
        { level: 5, title: "AWS Solutions Architect Professional", points: 45, platform: "AWS Training" },
        { level: 6, title: "AWS Specialty Certifications", points: 40, platform: "AWS Training" }
      ]
    };
    
    // Get suggestions for the skill domain
    const domainSuggestions = courseSuggestions[skillDomain] || [
      { level: targetLevel, title: `Advanced ${skillDomain}`, points: Math.min(pointsNeeded + 5, 45), platform: "Various Platforms" }
    ];
    
    // Filter suggestions for the target level and points needed
    const relevantSuggestions = domainSuggestions.filter(suggestion => 
      suggestion.level >= targetLevel && suggestion.points >= pointsNeeded - 10
    );
    
    return relevantSuggestions.slice(0, 3); // Return top 3 suggestions
  }
  
  /**
   * Get user's skill leaderboard position
   */
  static async getUserSkillRanking(userId, skillDomain = null) {
    try {
      let query = {};
      if (skillDomain) {
        query.skillDomain = skillDomain;
      }
      
      const userSkills = await UserSkill.find({ user: userId, ...query });
      const rankings = [];
      
      for (const userSkill of userSkills) {
        // Get total users in this skill domain
        const totalUsersInDomain = await UserSkill.countDocuments({ 
          skillDomain: userSkill.skillDomain 
        });
        
        // Get users with higher points in this domain
        const usersWithHigherPoints = await UserSkill.countDocuments({
          skillDomain: userSkill.skillDomain,
          totalPoints: { $gt: userSkill.totalPoints }
        });
        
        const rank = usersWithHigherPoints + 1;
        const percentile = ((totalUsersInDomain - rank + 1) / totalUsersInDomain) * 100;
        
        rankings.push({
          skillDomain: userSkill.skillDomain,
          currentLevel: userSkill.currentLevel,
          totalPoints: userSkill.totalPoints,
          rank: rank,
          totalUsers: totalUsersInDomain,
          percentile: Math.round(percentile)
        });
      }
      
      return rankings;
    } catch (error) {
      console.error('Error calculating skill rankings:', error);
      throw new Error('Failed to calculate rankings');
    }
  }
  
  /**
   * Remove credential and update skill progress
   */
  static async removeCredentialFromSkillProgress(userId, credentialId) {
    try {
      // Find the credential to get its details
      const credential = await Credential.findById(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      // Find the skill domain this credential belonged to
      const skillDomain = determineSkillDomain(credential.title, credential.description, credential.skills);
      
      // Find the user skill entry
      const userSkill = await UserSkill.findOne({
        user: userId,
        skillDomain: skillDomain
      });
      
      if (!userSkill) {
        return; // No skill entry to update
      }
      
      // Find the points entry for this credential
      const pointsEntry = userSkill.pointsHistory.find(
        entry => entry.credentialId.toString() === credentialId.toString()
      );
      
      if (pointsEntry) {
        // Subtract the points
        userSkill.totalPoints = Math.max(0, userSkill.totalPoints - pointsEntry.pointsAdded);
        
        // Remove from certificates array
        userSkill.certificates = userSkill.certificates.filter(
          certId => certId.toString() !== credentialId.toString()
        );
        
        // Remove from points history
        userSkill.pointsHistory = userSkill.pointsHistory.filter(
          entry => entry.credentialId.toString() !== credentialId.toString()
        );
        
        // Recalculate level
        const newLevel = userSkill.checkLevelUp();
        if (newLevel !== userSkill.currentLevel) {
          userSkill.currentLevel = newLevel;
        }
        
        userSkill.lastUpdated = new Date();
        await userSkill.save();
      }
      
    } catch (error) {
      console.error('Error removing credential from skill progress:', error);
      throw new Error('Failed to update skill progress');
    }
  }
  
}

module.exports = NSQFService;
