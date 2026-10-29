const http = require('http');

function test(email, password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ email, status: res.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ email, error: e.message }));
    req.write(postData);
    req.end();
  });
}

async function main() {
  const r1 = await test('demo', 'Demo@123');
  console.log('Result 1 (Demo):', r1);

  const r2 = await test('Vamsipallela31@gmail.com', 'Vamsi@123');
  console.log('Result 2 (Vamsi):', r2);
}

main();

