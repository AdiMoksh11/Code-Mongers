/**
 * NSQF Data Seeding Script for Credexa
 * 
 * Purpose: Populates demo NSQF skill tracking data for testing and demonstration
 * 
 * Usage:
 * - Run after seedDemoLearners.js to create skill progressions
 * - Use for testing NSQF features during development
 * - Perfect for demos and presentations
 * 
 * What it creates:
 * - Skill domains for demo users (JavaScript, Python, ML, Cloud, etc.)
 * - Realistic NSQF level progressions (1-6 levels)
 * - Point calculations and level-up histories
 * - Multiple skill tracks per user
 * 
 * Run with: node scripts/seedNSQFData.js
 * 
 * Note: Only run in development/demo environments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const Credential = require('../src/models/credentialModel');
const UserSkill = require('../src/models/userSkillModel');
const NSQFService = require('../src/services/nsqfService');

async function seedNSQFData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  console.log('🌱 Starting NSQF data seeding...');

  // Get demo users
  const demoUsers = await User.find({ 
    email: { $in: ['riya.demo@credexa.dev', 'arjun.demo@credexa.dev', 'sara.demo@credexa.dev'] }
  });

  if (demoUsers.length === 0) {
    console.log('❌ No demo users found. Please run seedDemoLearners.js first');
    return;
  }

  // Clear existing NSQF data for demo users
  await UserSkill.deleteMany({ user: { $in: demoUsers.map(u => u._id) } });

  // Get credentials for each user
  for (const user of demoUsers) {
    console.log(`📚 Processing NSQF data for ${user.fullName.firstName} ${user.fullName.lastName}...`);
    
    const credentials = await Credential.find({ user: user._id });
    
    for (const credential of credentials) {
      console.log(`  ⚡ Processing credential: ${credential.title}`);
      
      // Enhance credential with NSQF data based on content
      let nsqfLevel = 3; // Default
      let creditPoints = credential.creditPoints || 10;
      let skillDomain = '';

      // Determine skill domain and level based on credential content
      if (credential.title.toLowerCase().includes('react') || 
          credential.title.toLowerCase().includes('javascript') ||
          credential.title.toLowerCase().includes('typescript') ||
          credential.title.toLowerCase().includes('frontend')) {
        skillDomain = 'JavaScript Development';
        if (credential.title.toLowerCase().includes('advanced')) nsqfLevel = 5;
        else if (credential.title.toLowerCase().includes('typescript')) nsqfLevel = 4;
        else nsqfLevel = 3;
      }
      else if (credential.title.toLowerCase().includes('node') ||
               credential.title.toLowerCase().includes('express') ||
               credential.title.toLowerCase().includes('backend')) {
        skillDomain = 'Backend Development';
        if (credential.title.toLowerCase().includes('microservices')) nsqfLevel = 5;
        else nsqfLevel = 4;
      }
      else if (credential.title.toLowerCase().includes('python')) {
        skillDomain = 'Python Programming';
        if (credential.title.toLowerCase().includes('data science')) nsqfLevel = 4;
        else nsqfLevel = 3;
      }
      else if (credential.title.toLowerCase().includes('machine learning') ||
               credential.title.toLowerCase().includes('ml')) {
        skillDomain = 'Machine Learning';
        if (credential.title.toLowerCase().includes('foundations')) nsqfLevel = 4;
        else if (credential.title.toLowerCase().includes('advanced')) nsqfLevel = 6;
        else nsqfLevel = 5;
        creditPoints = Math.max(creditPoints, 20); // ML typically worth more points
      }
      else if (credential.title.toLowerCase().includes('aws') ||
               credential.title.toLowerCase().includes('cloud')) {
        skillDomain = 'AWS Cloud Services';
        if (credential.title.toLowerCase().includes('architect')) nsqfLevel = 5;
        else nsqfLevel = 4;
        creditPoints = Math.max(creditPoints, 15);
      }
      else if (credential.title.toLowerCase().includes('docker') ||
               credential.title.toLowerCase().includes('kubernetes') ||
               credential.title.toLowerCase().includes('devops')) {
        skillDomain = 'DevOps Engineering';
        if (credential.title.toLowerCase().includes('kubernetes')) nsqfLevel = 5;
        else nsqfLevel = 4;
      }
      else {
        // Default to Web Development
        skillDomain = 'Web Development';
        nsqfLevel = 3;
      }

      // Update credential with NSQF data
      await Credential.findByIdAndUpdate(credential._id, {
        nsqfLevel,
        creditPoints,
        skills: credential.skills || []
      });

      // Update user skill progress through NSQFService
      try {
        const result = await NSQFService.updateUserSkillProgress(user._id, {
          _id: credential._id,
          title: credential.title,
          nsqfLevel,
          creditPoints,
          skillDomain,
          description: credential.description || '',
          skills: credential.skills || []
        });

        console.log(`    ✅ Updated ${skillDomain}: Level ${result.previousLevel} → ${result.newLevel} (+${result.pointsAdded} points)`);
        if (result.leveledUp) {
          console.log(`    🎉 Level up achieved in ${skillDomain}!`);
        }
      } catch (error) {
        console.error(`    ❌ Error updating skill progress:`, error.message);
      }
    }
  }

  // Add some additional skill domains with progression for demonstration
  console.log('🎯 Adding additional skill progressions for demo...');
  
  const additionalSkills = [
    // Riya - additional frontend skills
    {
      userId: demoUsers.find(u => u.email === 'riya.demo@credexa.dev')?._id,
      credentials: [
        { title: 'Vue.js Fundamentals', skillDomain: 'Vue.js Development', nsqfLevel: 3, creditPoints: 12 },
        { title: 'CSS Grid & Flexbox Master', skillDomain: 'Web Development', nsqfLevel: 3, creditPoints: 8 },
        { title: 'Modern JavaScript ES2023', skillDomain: 'JavaScript Development', nsqfLevel: 4, creditPoints: 15 }
      ]
    },
    // Arjun - data science progression
    {
      userId: demoUsers.find(u => u.email === 'arjun.demo@credexa.dev')?._id,
      credentials: [
        { title: 'Deep Learning with TensorFlow', skillDomain: 'Machine Learning', nsqfLevel: 6, creditPoints: 25 },
        { title: 'Data Visualization with D3.js', skillDomain: 'Data Science', nsqfLevel: 4, creditPoints: 15 },
        { title: 'Statistical Analysis Advanced', skillDomain: 'Data Science', nsqfLevel: 5, creditPoints: 20 }
      ]
    },
    // Sara - cloud mastery
    {
      userId: demoUsers.find(u => u.email === 'sara.demo@credexa.dev')?._id,
      credentials: [
        { title: 'Azure Cloud Solutions Expert', skillDomain: 'Azure Cloud Services', nsqfLevel: 6, creditPoints: 30 },
        { title: 'Terraform Infrastructure as Code', skillDomain: 'DevOps Engineering', nsqfLevel: 5, creditPoints: 22 },
        { title: 'Monitoring & Observability', skillDomain: 'DevOps Engineering', nsqfLevel: 4, creditPoints: 18 }
      ]
    }
  ];

  for (const userSkills of additionalSkills) {
    if (!userSkills.userId) continue;
    
    for (const credData of userSkills.credentials) {
      // Create virtual credential for skill tracking
      const virtualCred = new Credential({
        user: userSkills.userId,
        title: credData.title,
        issuer: 'Demo Platform',
        type: 'certificate',
        status: 'verified',
        issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random within last 30 days
        skills: [],
        nsqfLevel: credData.nsqfLevel,
        creditPoints: credData.creditPoints,
        description: `Demo credential for ${credData.skillDomain}`
      });

      await virtualCred.save();

      // Update skill progress
      try {
        const result = await NSQFService.updateUserSkillProgress(userSkills.userId, {
          _id: virtualCred._id,
          title: credData.title,
          nsqfLevel: credData.nsqfLevel,
          creditPoints: credData.creditPoints,
          skillDomain: credData.skillDomain,
          description: virtualCred.description,
          skills: []
        });

        console.log(`  ✅ Added ${credData.skillDomain}: Level ${result.newLevel} (+${result.pointsAdded} points)`);
        if (result.leveledUp) {
          console.log(`    🎉 Level up achieved in ${credData.skillDomain}!`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating skill progress:`, error.message);
      }
    }
  }

  // Display final skill summary
  console.log('\n📊 Final NSQF Skill Summary:');
  for (const user of demoUsers) {
    console.log(`\n👤 ${user.fullName.firstName} ${user.fullName.lastName}:`);
    const userSkills = await UserSkill.find({ user: user._id }).sort({ totalPoints: -1 });
    
    for (const skill of userSkills) {
      const levelReq = UserSkill.getLevelRequirements(skill.currentLevel);
      console.log(`  🎯 ${skill.skillDomain}: Level ${skill.currentLevel} (${levelReq.name}) - ${skill.totalPoints} points`);
    }
  }

  console.log('\n🎉 NSQF data seeding completed successfully!');
  await mongoose.disconnect();
}

seedNSQFData().catch(err => { 
  console.error('❌ Seeding failed:', err); 
  process.exit(1); 
});
