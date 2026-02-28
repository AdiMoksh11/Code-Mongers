require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/userModel');

async function checkUserRole() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGEzNWRiMWZlYWQ1NWRhZTg0NGVhYSIsImlhdCI6MTc1OTgxMzI4NywiZXhwIjoxNzYxMTA5Mjg3fQ.LB9KDNn9g8skFJam7VoE8J5sxn_1XMjP4JbvBzgPod0';
  const decoded = jwt.decode(token);
  
  console.log('Token decoded - User ID:', decoded.id);
  
  const user = await User.findById(decoded.id);
  if (user) {
    console.log('User found:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Full Name:', user.fullName?.firstName, user.fullName?.lastName);
    
    if (user.role !== 'institute') {
      console.log('\nUpdating user role to institute...');
      user.role = 'institute';
      await user.save();
      console.log('✓ User role updated to institute');
    } else {
      console.log('✓ User already has institute role');
    }
  } else {
    console.log('User not found');
  }
  
  await mongoose.disconnect();
}

checkUserRole().catch(err => { console.error(err); process.exit(1); });