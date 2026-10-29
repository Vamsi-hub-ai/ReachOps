const https = require('https');
const http = require('http');

function testEndpoint(urlStr, postData) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  const payload = JSON.stringify({ email: 'demo@reachops.com', password: 'Demo@123' });
  
  console.log('--- Testing Localhost:5173 ---');
  const localRes = await testEndpoint('http://localhost:5173/api/auth/login', payload);
  console.log('Localhost result:', localRes);

  console.log('--- Testing Production reachops.netlify.app ---');
  const prodRes = await testEndpoint('https://reachops.netlify.app/api/auth/login', payload);
  console.log('Production result:', prodRes);
}

main();

