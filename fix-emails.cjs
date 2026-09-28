const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const lowerEmail = user.email.toLowerCase().trim();
    if (user.email !== lowerEmail) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: lowerEmail }
        });
        console.log(`Updated ${user.email} to ${lowerEmail}`);
      } catch(e) {
        console.log(`Failed to update ${user.email}:`, e.message);
      }
    }
  }
}
fix().finally(() => prisma.$disconnect());
