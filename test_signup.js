async function test() {
  try {
    const res = await fetch('http://localhost:8888/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vamsi', email: 'vamsi@example.com' + Date.now(), password: 'password123' })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();
