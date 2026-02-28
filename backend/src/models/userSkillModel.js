const mongoose = require('mongoose');

const UserSkillSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    skillDomain: { 
      type: String, 
      required: true, 
      trim: true,
      // Examples: "Python Programming", "Web Development", "Data Science", etc.
    },
    currentLevel: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 10 
    },
    totalPoints: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    certificates: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Credential' 
    }],
    pointsHistory: [{
      credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential' },
      pointsAdded: { type: Number, required: true },
      previousLevel: { type: Number, required: true },
      newLevel: { type: Number, required: true },
      addedAt: { type: Date, default: Date.now }
    }],
    levelUpHistory: [{
      fromLevel: { type: Number, required: true },
      toLevel: { type: Number, required: true },
      achievedAt: { type: Date, default: Date.now },
      triggeringCredential: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential' }
    }],
    lastUpdated: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

// Compound index for efficient queries
UserSkillSchema.index({ user: 1, skillDomain: 1 }, { unique: true });

// Static method to get level requirements
UserSkillSchema.statics.getLevelRequirements = function(level) {
  const requirements = {
    1: { minPoints: 0, maxPoints: 20, name: "Beginner" },
    2: { minPoints: 21, maxPoints: 50, name: "Elementary" },
    3: { minPoints: 51, maxPoints: 90, name: "Intermediate" },
    4: { minPoints: 91, maxPoints: 140, name: "Upper Intermediate" },
    5: { minPoints: 141, maxPoints: 200, name: "Advanced" },
    6: { minPoints: 201, maxPoints: 270, name: "Proficient" },
    7: { minPoints: 271, maxPoints: 350, name: "Expert" },
    8: { minPoints: 351, maxPoints: 440, name: "Advanced Expert" },
    9: { minPoints: 441, maxPoints: 540, name: "Master" },
    10: { minPoints: 541, maxPoints: Infinity, name: "Grand Master" }
  };
  
  return requirements[level] || requirements[1];
};

// Instance method to calculate progress to next level
UserSkillSchema.methods.getProgressToNextLevel = function() {
  const nextLevel = Math.min(this.currentLevel + 1, 10);
  const nextLevelReq = this.constructor.getLevelRequirements(nextLevel);
  
  if (this.currentLevel >= 10) {
    return {
      isMaxLevel: true,
      progressPercentage: 100,
      pointsNeeded: 0,
      nextLevelName: "Grand Master"
    };
  }
  
  const pointsNeeded = nextLevelReq.minPoints - this.totalPoints;
  const currentLevelReq = this.constructor.getLevelRequirements(this.currentLevel);
  const levelRange = nextLevelReq.minPoints - currentLevelReq.minPoints;
  const progressInLevel = this.totalPoints - currentLevelReq.minPoints;
  const progressPercentage = Math.min(Math.max((progressInLevel / levelRange) * 100, 0), 100);
  
  return {
    isMaxLevel: false,
    progressPercentage: Math.round(progressPercentage),
    pointsNeeded: Math.max(pointsNeeded, 0),
    nextLevelName: nextLevelReq.name,
    nextLevel: nextLevel
  };
};

// Instance method to check if points qualify for level up
UserSkillSchema.methods.checkLevelUp = function() {
  for (let level = this.currentLevel + 1; level <= 10; level++) {
    const levelReq = this.constructor.getLevelRequirements(level);
    if (this.totalPoints >= levelReq.minPoints) {
      return level;
    }
  }
  return this.currentLevel;
};

module.exports = mongoose.model('UserSkill', UserSkillSchema);
