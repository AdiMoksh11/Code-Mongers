require('dotenv').config({ path: __dirname + '/../.env' });
const jwt = require('jsonwebtoken');

const userId = process.argv[2] || process.env.USER_ID;
if (!userId) {
  console.error('Usage: node generateTokenForUserId.js <userId>');
  process.exit(1);
}

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET not found in .env');
  process.exit(1);
}

const expiresIn = process.env.JWT_EXPIRE || '15d';
const token = jwt.sign({ id: userId }, secret, { expiresIn });
console.log(token);
