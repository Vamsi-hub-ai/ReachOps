const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'vamsipallela31@gmail.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  const isVamsi123 = await bcrypt.compare('Vamsi@123', user.passwordHash || '');
  const isDemo123 = await bcrypt.compare('Demo@123', user.passwordHash || '');
  console.log('User found:', user.email);
  console.log('Password matches Vamsi@123?', isVamsi123);
  console.log('Password matches Demo@123?', isDemo123);

  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@reachops.com' } });
  if (demoUser) {
    const isDemoPass = await bcrypt.compare('Demo@123', demoUser.passwordHash || '');
    console.log('Demo user password matches Demo@123?', isDemoPass);
  }
}

main().finally(() => prisma.$disconnect());

