require('dotenv').config();
const mongoose = require('mongoose');
const Credential = require('../src/models/credentialModel');

async function updateTestCredential() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const credentialId = '68e4a9f434e4796c9fd2a2df';
  
  // Update with a working public image URL
  const updated = await Credential.findByIdAndUpdate(credentialId, {
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80' // Sample certificate-like image
  }, { new: true });
  
  if (updated) {
    console.log('Updated credential with working image URL:', updated.imageUrl);
  } else {
    console.log('Credential not found');
  }
  
  await mongoose.disconnect();
}

updateTestCredential().catch(err => { console.error(err); process.exit(1); });