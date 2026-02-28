const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Load env from backend .env
require('dotenv').config({ path: __dirname + '/../.env' });
const Credential = require('../src/models/credentialModel');
const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/credexa';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const id = process.env.DEBUG_ID || '68dc019a083b139cc2d5e645';
  const token = process.env.DEBUG_TOKEN || '';
  let decoded = null;
  try { decoded = jwt.decode(token); } catch(e) {}
  console.log('Decoded token:', decoded);
  const cred = await Credential.findById(id).lean();
  console.log('Credential:', cred ? { id: cred._id, user: cred.user, title: cred.title } : 'NOT FOUND');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
