require('dotenv').config();
const mongoose = require('mongoose');
const Credential = require('../src/models/credentialModel');

async function fixCredentialOwnership() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Your user ID from the JWT token
  const userId = '68da35db1fead55dae844eaa';
  const credentialId = '68dc012c083b139cc2d5e5bd';
  
  // Update the credential to belong to your user
  const updated = await Credential.findByIdAndUpdate(credentialId, {
    user: userId,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80' // Working image URL
  }, { new: true });
  
  if (updated) {
    console.log('Updated credential ownership:');
    console.log('- ID:', updated._id);
    console.log('- Title:', updated.title);
    console.log('- Owner:', updated.user);
    console.log('- Image URL:', updated.imageUrl);
  } else {
    console.log('Credential not found, creating new ones...');
    
    // Create a few test credentials for your user
    const testCreds = [
      {
        user: userId,
        title: 'React Development Certificate',
        issuer: 'Tech University',
        type: 'certificate',
        status: 'verified',
        issueDate: new Date(),
        description: 'Advanced React development skills',
        skills: ['React', 'JavaScript', 'Frontend'],
        imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
        creditPoints: 15
      },
      {
        user: userId,
        title: 'Node.js Backend Development',
        issuer: 'Code Academy',
        type: 'certificate', 
        status: 'verified',
        issueDate: new Date(),
        description: 'Backend development with Node.js and Express',
        skills: ['Node.js', 'Express', 'Backend', 'API'],
        imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
        creditPoints: 12
      }
    ];
    
    const created = await Credential.insertMany(testCreds);
    console.log('Created', created.length, 'test credentials for your user');
    created.forEach(cred => {
      console.log(`- ${cred.title} (ID: ${cred._id})`);
    });
  }
  
  await mongoose.disconnect();
}

fixCredentialOwnership().catch(err => { console.error(err); process.exit(1); });