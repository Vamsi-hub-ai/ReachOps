const http = require('http');

const data = JSON.stringify({
  name: "test user",
  email: "test4@example.com",
  password: "password123"
});

const options = {
  hostname: 'localhost',
  port: 8888,
  path: '/.netlify/functions/auth-signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
