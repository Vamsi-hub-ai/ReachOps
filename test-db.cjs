const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { email: true, passwordHash: true }
  });
  console.log(users);
}
check().finally(() => prisma.$disconnect());
