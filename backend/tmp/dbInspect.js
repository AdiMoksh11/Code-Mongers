require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Using URI startsWith:', uri ? uri.substring(0, 20) + '...' : 'MISSING');
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));
    const colNames = cols.map(c => c.name);
    const credName = colNames.find(n => n.toLowerCase().includes('credential')) || 'credentials';
    const count = await db.collection(credName).countDocuments();
    console.log(`Count in '${credName}':`, count);
    await mongoose.disconnect();
  } catch (err) {
    console.error('DB inspect error:', err.message);
  }
}

run();
