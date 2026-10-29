const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              campaigns: { select: { id: true, name: true } },
              emailAccounts: { select: { id: true, email: true } },
              suppressions: { select: { id: true } },
            }
          }
        }
      }
    }
  });
  console.log('=== USERS & WORKSPACES ===');
  console.log(JSON.stringify(users, null, 2));

  const allWorkspaces = await prisma.workspace.findMany();
  console.log('=== ALL WORKSPACES ===');
  console.log(JSON.stringify(allWorkspaces, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

