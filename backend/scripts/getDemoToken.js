require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const User = require('../src/models/userModel');
  const Credential = require('../src/models/credentialModel');

  // Try known seeded emails
  const emails = ['riya.demo@credexa.dev', 'arjun.demo@credexa.dev', 'sara.demo@credexa.dev'];
  let user = null;
  for (const e of emails) {
    user = await User.findOne({ email: e });
    if (user) break;
  }

  if (!user) {
    // fallback: any user
    user = await User.findOne();
  }

  if (!user) {
    console.error('No users found in DB');
    process.exit(1);
  }

  const cred = await Credential.findOne({ user: user._id });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15d' });

  console.log(JSON.stringify({ userId: user._id.toString(), token, credentialId: cred ? cred._id.toString() : null }, null, 2));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
