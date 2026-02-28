const axios = require('axios');

const token = process.env.DEBUG_TOKEN || '';
const base = process.env.DEBUG_BASE || 'http://localhost:4000';
const id = process.env.DEBUG_ID || '68e4a9f434e4796c9fd2a2df';

async function run() {
  try {
    const r1 = await axios.get(`${base}/api/credentials/${id}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
    console.log('Credential GET status:', r1.status);
    console.log('Credential GET body:', r1.data);

    const r2 = await axios.get(`${base}/api/credentials/${id}/forensics`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true, timeout: 60000 });
    console.log('Forensics GET status:', r2.status);
    console.log('Forensics GET body keys:', Object.keys(r2.data || {}));
  } catch (err) {
    console.error('Request error:', err.message);
    if (err.response) console.error('Response data:', err.response.data);
  }
}

run();
