require('dotenv').config();
const mongoose = require('mongoose');
const Credential = require('../src/models/credentialModel');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Your user ID from the JWT token
  const userId = '68da35db1fead55dae844eaa';
  
  // Create a test credential with an image URL for forensics testing
  const testCred = {
    user: userId,
    title: 'Test Certificate for Forensics',
    issuer: 'Test University',
    type: 'certificate',
    status: 'verified',
    issueDate: new Date(),
    description: 'Test credential for forensics endpoint testing',
    skills: ['Testing', 'Forensics'],
    imageUrl: 'https://ik.imagekit.io/wl9xamwdr/credentials/sample-certificate.jpg',
    creditPoints: 10
  };

  const existing = await Credential.findOne({ user: userId, title: testCred.title });
  if (existing) {
    console.log('Test credential already exists:', existing._id);
    await mongoose.disconnect();
    return;
  }

  const created = await Credential.create(testCred);
  console.log('Created test credential:', created._id);
  console.log('Owner:', created.user);
  console.log('Image URL:', created.imageUrl);
  
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });