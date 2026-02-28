require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/userModel');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'riya.demo@credexa.dev' });
  if (!user) {
    console.error('Demo user not found');
    process.exit(1);
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
  console.log('TOKEN=' + token);
  await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });