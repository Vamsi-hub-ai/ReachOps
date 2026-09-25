import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:C:/Users/TECH-GENIUSES/Desktop/Email AI/prisma/dev.db'
    }
  }
});
export default prisma;
