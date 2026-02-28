require('dotenv').config();
const mongoose = require('mongoose');
const Credential = require('../src/models/credentialModel');
const User = require('../src/models/userModel');

async function createTestCredentials() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Create some test users first
  const testUsers = await User.insertMany([
    {
      fullName: { firstName: 'John', lastName: 'Doe' },
      email: 'john.test@example.com',
      username: 'johndoe',
      role: 'learner',
      isVerified: true,
      provider: 'email',
      password: 'Temp#12345'
    },
    {
      fullName: { firstName: 'Jane', lastName: 'Smith' },
      email: 'jane.test@example.com', 
      username: 'janesmith',
      role: 'learner',
      isVerified: true,
      provider: 'email',
      password: 'Temp#12345'
    }
  ]);
  
  console.log('Created test users:', testUsers.map(u => `${u.email} (${u._id})`));
  
  // Create credentials for these users
  const credentials = [
    {
      _id: new mongoose.Types.ObjectId('68dbf64398b87444ff659dd6'), // The specific ID from your error
      user: testUsers[0]._id,
      title: 'Data Science Certificate',
      issuer: 'MIT Online',
      type: 'certificate',
      status: 'verified',
      issueDate: new Date(),
      description: 'Advanced data science and machine learning',
      skills: ['Python', 'Machine Learning', 'Data Analysis'],
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
      creditPoints: 20
    },
    {
      user: testUsers[1]._id,
      title: 'Web Development Bootcamp',
      issuer: 'Code Academy Pro',
      type: 'certificate',
      status: 'verified', 
      issueDate: new Date(),
      description: 'Full-stack web development with modern frameworks',
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
      creditPoints: 25
    }
  ];
  
  // Remove existing credentials with same IDs
  await Credential.deleteMany({ _id: { $in: credentials.map(c => c._id).filter(Boolean) } });
  
  const created = await Credential.insertMany(credentials);
  console.log('Created test credentials:');
  created.forEach(cred => {
    console.log(`- ${cred.title} (ID: ${cred._id}) - Owner: ${cred.user}`);
  });
  
  await mongoose.disconnect();
}

createTestCredentials().catch(err => { console.error(err); process.exit(1); });