// Simple test to check if the server is responding
const http = require('http');

function testServer() {
  const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('✅ Server is responding!');
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response received (first 200 chars):');
      console.log(data.substring(0, 200) + '...');
    });
  });

  req.on('error', (e) => {
    console.error('❌ Server test failed:', e.message);
  });

  req.end();
}

console.log('🧪 Testing server at http://localhost:5173...');
testServer();
