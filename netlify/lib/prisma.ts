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

if (isServerless) {
  // If no PostgreSQL DATABASE_URL is configured, or if using SQLite, use writable /tmp
  if (!databaseUrl || databaseUrl.startsWith('file:')) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.resolve(process.cwd(), 'prisma', 'dev.db'),
        path.resolve(__dirname, '..', 'prisma', 'dev.db'),
        path.resolve(__dirname, 'prisma', 'dev.db'),
        '/var/task/prisma/dev.db'
      ];
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
  }
} else if (databaseUrl && databaseUrl.startsWith('file:')) {
  const rawPath = databaseUrl.replace(/^file:/, '');
  if (!path.isAbsolute(rawPath)) {
    const cleanPath = rawPath.replace(/^\.\//, '');
    const resolved = path.resolve(process.cwd(), 'prisma', cleanPath);
    databaseUrl = `file:${resolved.replace(/\\/g, '/')}`;
  }
}

const prisma = new PrismaClient(
  databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined
);

export default prisma;
