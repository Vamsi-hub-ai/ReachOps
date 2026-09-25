import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/email_ai?schema=public'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully");
    await client.end();
  } catch(e) {
    console.error("Connection failed:", e.message);
  }
}

run();
