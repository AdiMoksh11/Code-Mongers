const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Credential = require('../src/models/credentialModel');

async function run() {
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/credexa';
  await mongoose.connect(MONGO);
  const userId = process.env.DEBUG_USER_ID || process.env.DEBUG_ID || '68da35db1fead55dae844eaa';
  console.log('Listing credentials for user:', userId);
  const creds = await Credential.find({ user: userId }).lean().limit(50);
  if (!creds || creds.length === 0) {
    console.log('No credentials found for this user.');
  } else {
    creds.forEach(c => {
      console.log(`- id: ${c._id} | title: ${c.title} | imageUrl: ${c.imageUrl ? 'yes' : 'no'} | credentialUrl: ${c.credentialUrl ? 'yes' : 'no'}`);
    });
  }
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
