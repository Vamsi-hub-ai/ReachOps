const { spawn } = require('child_process');
const http = require('http');

async function main() {
  console.log('Spawning detached Vite dev server...');
  const child = spawn('cmd.exe', ['/c', 'npx', 'vite', '--host', '--port', '5173'], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
    windowsHide: true,
  });

  child.unref();

  // Poll port 5173 up to 10 times (5 seconds max)
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 500));
    const ok = await new Promise((resolve) => {
      const req = http.get('http://localhost:5173/', (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 304);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (ok) {
      console.log('Vite dev server is successfully running detached on http://localhost:5173');
      process.exit(0);
    }
  }

  console.log('Vite server spawned.');
  process.exit(0);
}

main();

