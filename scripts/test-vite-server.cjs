const { spawn } = require('child_process');
const http = require('http');

function postLogin(email, password) {
  return new Promise((resolve, reject) => {
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
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testVite() {
  const vite = spawn('cmd.exe', ['/c', 'npx', 'vite', '--port', '5173'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log('Testing demo login...');
  const resDemo = await postLogin('demo', 'Demo@123');
  console.log('Demo Login:', resDemo.status, resDemo.body);

  console.log('Testing vamsi login...');
  const resVamsi = await postLogin('Vamsipallela31@gmail.com', 'Vamsi@123');
  console.log('Vamsi Login:', resVamsi.status, resVamsi.body);

  vite.kill();
  process.exit(0);
}

testVite();
