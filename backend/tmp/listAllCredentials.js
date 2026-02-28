const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Credential = require('../src/models/credentialModel');

async function run() {
  const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/credexa';
  await mongoose.connect(MONGO);
  const creds = await Credential.find({}).lean().limit(20);
  if (!creds || creds.length === 0) {
    console.log('No credentials found in DB.');
  } else {
    creds.forEach(c => {
      console.log(`id: ${c._id} | user: ${c.user} | title: ${c.title || '–'} | imageUrl:${c.imageUrl ? 'Y' : 'N'} | credentialUrl:${c.credentialUrl ? 'Y' : 'N'}`);
    });
  }
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
