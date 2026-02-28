require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/userModel');

async function run() {
  const email = process.argv[2] || 'riya.demo@credexa.dev';
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.error('User not found for email:', email);
    process.exit(1);
  }
  const payload = { id: String(user._id) };
  const secret = process.env.JWT_SECRET || process.env.BACKEND_PRIVATE_KEY;
  if (!secret) {
    console.error('No JWT secret available in env');
    process.exit(1);
  }
  const token = jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRE || '15d' });
  console.log('User id:', user._id);
  console.log('Token:', token);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
