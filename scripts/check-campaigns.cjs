const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      prospects: { select: { id: true, email: true } },
      messages: { select: { id: true, subject: true } }
    }
  });
  console.log('=== CAMPAIGNS ===');
  console.log(JSON.stringify(campaigns, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

