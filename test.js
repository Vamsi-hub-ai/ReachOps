import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        name: 'test',
        email: 'test@example.com' + Date.now(),
        passwordHash: 'hash',
        workspaceMembers: {
          create: {
            role: 'OWNER',
            workspace: {
              create: {
                name: `Test's Workspace`,
                ownerId: 'temp',
              },
            },
          },
        },
      },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });
    console.log(user);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
