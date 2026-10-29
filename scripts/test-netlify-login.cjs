const https = require('https');

const postData = JSON.stringify({
  email: 'demo@reachops.com',
  password: 'Demo@123'
});

const req = https.request('https://reachops.netlify.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => console.error('ERROR:', e.message));
req.write(postData);
req.end();

