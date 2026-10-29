import { PrismaClient } from '@prisma/client';
import path from 'path';

let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && databaseUrl.startsWith('file:')) {
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
