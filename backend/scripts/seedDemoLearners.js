require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const Credential = require('../src/models/credentialModel');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  const learners = [
    {
      fullName: { firstName: 'Riya', lastName: 'Sharma' },
      email: 'riya.demo@credexa.dev',
      username: 'riyasharma',
      role: 'learner',
      isVerified: true,
      settings: { preferences: { privacy: { profileVisibility: 'public', showInLeaderboard: true } } },
      provider: 'email',
      password: 'Temp#12345',
      institute: { name: 'IIT Delhi' },
    },
    {
      fullName: { firstName: 'Arjun', lastName: 'Mehta' },
      email: 'arjun.demo@credexa.dev',
      username: 'arjunmehta',
      role: 'learner',
      isVerified: true,
      settings: { preferences: { privacy: { profileVisibility: 'public', showInLeaderboard: true } } },
      provider: 'email',
      password: 'Temp#12345',
      institute: { name: 'IISc Bengaluru' },
    },
    {
      fullName: { firstName: 'Sara', lastName: 'Khan' },
      email: 'sara.demo@credexa.dev',
      username: 'sarakhan',
      role: 'learner',
      isVerified: true,
      settings: { preferences: { privacy: { profileVisibility: 'public', showInLeaderboard: true } } },
      provider: 'email',
      password: 'Temp#12345',
      institute: { name: 'IIT Bombay' },
    },
  ];

  // Upsert learners
  const docs = [];
  for (const l of learners) {
    const doc = await User.findOneAndUpdate(
      { email: l.email },
      { $setOnInsert: l },
      { new: true, upsert: true }
    );
    docs.push(doc);
  }

  const [riya, arjun, sara] = docs;

  // Clear existing demo credentials
  await Credential.deleteMany({ issuer: { $in: ['Coursera', 'Udemy', 'LinkedIn Learning'] }, user: { $in: docs.map(d => d._id) } });

  const now = new Date();
  const daysAgo = d => new Date(now.getTime() - d*24*60*60*1000);

  const creds = [
    // Riya - React/Node/TypeScript
    { user: riya._id, title: 'React Developer Certificate', issuer: 'Coursera', type: 'certificate', status: 'verified', issueDate: daysAgo(10), skills: ['React', 'JavaScript', 'Frontend'], creditPoints: 10 },
    { user: riya._id, title: 'Node.js Microservices', issuer: 'Udemy', type: 'certificate', status: 'verified', issueDate: daysAgo(20), skills: ['Node.js', 'Express', 'Backend'], creditPoints: 12 },
    { user: riya._id, title: 'TypeScript Advanced', issuer: 'LinkedIn Learning', type: 'certificate', status: 'verified', issueDate: daysAgo(5), skills: ['TypeScript', 'JavaScript'], creditPoints: 8 },
    // Arjun - Data/ML/Python
    { user: arjun._id, title: 'Python for Data Science', issuer: 'Coursera', type: 'certificate', status: 'verified', issueDate: daysAgo(40), skills: ['Python', 'Pandas', 'Numpy'], creditPoints: 15 },
    { user: arjun._id, title: 'Machine Learning Foundations', issuer: 'Coursera', type: 'certificate', status: 'verified', issueDate: daysAgo(15), skills: ['Machine Learning', 'Statistics'], creditPoints: 20 },
    // Sara - Cloud/DevOps
    { user: sara._id, title: 'AWS Solutions Architect', issuer: 'Udemy', type: 'certificate', status: 'verified', issueDate: daysAgo(60), skills: ['AWS', 'Cloud', 'Architecture'], creditPoints: 18 },
    { user: sara._id, title: 'Docker & Kubernetes', issuer: 'Udemy', type: 'certificate', status: 'verified', issueDate: daysAgo(25), skills: ['Docker', 'Kubernetes', 'DevOps'], creditPoints: 16 },
  ];

  await Credential.insertMany(creds);
  console.log('Seeded demo learners and credentials');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
