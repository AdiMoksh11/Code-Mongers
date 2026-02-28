const axios = require('axios');

async function testForensics() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGEzNWRiMWZlYWQ1NWRhZTg0NGVhYSIsImlhdCI6MTc1OTgxMzI4NywiZXhwIjoxNzYxMTA5Mjg3fQ.LB9KDNn9g8skFJam7VoE8J5sxn_1XMjP4JbvBzgPod0';
  const credentialId = '68e4a9f434e4796c9fd2a2df';
  
  try {
    console.log('Testing credential GET endpoint...');
    const credResponse = await axios.get(`http://localhost:4000/api/credentials/${credentialId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Credential found:', credResponse.data.credential.title);
    console.log('✓ Image URL:', credResponse.data.credential.imageUrl);
    
    console.log('\nTesting forensics endpoint...');
    const forensicsResponse = await axios.get(`http://localhost:4000/api/credentials/${credentialId}/forensics`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 300000 // 5 minutes
    });
    console.log('✓ Forensics success!');
    console.log('✓ Response has imageBase64:', !!forensicsResponse.data.imageBase64);
    if (forensicsResponse.data.imageBase64) {
      console.log('✓ Base64 length:', forensicsResponse.data.imageBase64.length);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.response) {
      console.error('✗ Status:', error.response.status);
      console.error('✗ Response:', error.response.data);
    }
  }
}

testForensics();