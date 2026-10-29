const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDemoFresh() {
  console.log('Setting up clean fresh Demo account...');

  const hash = await bcrypt.hash('Demo@123', 10);

  // 1. Ensure Demo user
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'demo@reachops.com' },
        { email: 'demo' },
        { id: 'demo-user-id' }
      ]
    }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@reachops.com',
        passwordHash: hash,
      }
    });
    console.log('Created Demo user:', user.id, user.email);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Demo User',
        email: 'demo@reachops.com',
        passwordHash: hash,
      }
    });
    console.log('Updated Demo user:', user.id, user.email);
  }

  // 2. Ensure clean Demo Workspace
  let workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { id: 'demo-workspace-id' },
        { ownerId: user.id }
      ]
    }
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        id: 'demo-workspace-id',
        name: 'Demo Workspace',
        ownerId: user.id,
      }
    });
    console.log('Created Demo workspace:', workspace.id);
  } else {
    workspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        name: 'Demo Workspace',
        ownerId: user.id,
      }
    });
  }

  // 3. Ensure Workspace Member
  let member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: user.id,
    }
  });

  if (!member) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'OWNER'
      }
    });
    console.log('Created Demo workspace member');
  }

  // 4. Ensure demo-workspace-id is COMPLETELY FRESH (no old user data, no campaigns, no accounts)
  await prisma.campaign.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.emailAccount.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.suppression.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.auditLog.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.template.deleteMany({ where: { workspaceId: workspace.id } });

  console.log('Demo workspace is now completely fresh with 0 user data and 0 campaigns!');
}

seedDemoFresh()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
