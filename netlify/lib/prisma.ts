import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

let databaseUrl = process.env.DATABASE_URL;

// Detect serverless environment (Netlify / AWS Lambda)
const isServerless = Boolean(
  process.env.NETLIFY || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT
);

// Prisma SQLite strictly requires a 'file:' protocol URL.
// In serverless (Netlify / AWS Lambda), we copy the packaged SQLite database to writable /tmp/dev.db
// and ALWAYS enforce a valid file: URL so Prisma validation never throws.
if (isServerless) {
  const tmpDbPath = '/tmp/dev.db';
  if (!fs.existsSync(tmpDbPath)) {
    const candidates = [
      path.resolve(process.cwd(), 'prisma', 'dev.db'),
      path.resolve(process.cwd(), 'dev.db'),
      path.resolve(__dirname, '..', 'prisma', 'dev.db'),
      path.resolve(__dirname, '..', 'dev.db'),
      path.resolve(__dirname, 'prisma', 'dev.db'),
      path.resolve(__dirname, 'dev.db'),
      path.resolve(__dirname, '..', '..', 'prisma', 'dev.db'),
      path.resolve(__dirname, '..', '..', 'dev.db'),
      '/var/task/prisma/dev.db',
      '/var/task/dev.db',
      process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT, 'prisma', 'dev.db') : '',
      process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT, 'dev.db') : '',
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        try {
          fs.copyFileSync(candidate, tmpDbPath);
          break;
        } catch (e) {
          console.error('Failed copying database to /tmp:', e);
        }
      }
    }
  }
  databaseUrl = `file:${tmpDbPath}`;
  process.env.DATABASE_URL = databaseUrl;
} else {
  // Local environment: ensure valid file: protocol URL
  if (!databaseUrl || !databaseUrl.startsWith('file:')) {
    const resolved = path.resolve(process.cwd(), 'prisma', 'dev.db');
    databaseUrl = `file:${resolved.replace(/\\/g, '/')}`;
    process.env.DATABASE_URL = databaseUrl;
  } else {
    const rawPath = databaseUrl.replace(/^file:/, '');
    if (!path.isAbsolute(rawPath)) {
      const cleanPath = rawPath.replace(/^\.\//, '');
      const resolved = path.resolve(process.cwd(), 'prisma', cleanPath);
      databaseUrl = `file:${resolved.replace(/\\/g, '/')}`;
      process.env.DATABASE_URL = databaseUrl;
    }
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;
