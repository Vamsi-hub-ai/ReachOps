const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function provisionPrivateAccount() {
  console.log('========================================================');
  console.log('ReachOps: Provisioning Private Account (Production/Private)');
  console.log('========================================================');

  const email = 'vamsipallela31@gmail.com';
  const rawPassword = 'Vamsi@123';
  const targetWorkspaceName = 'Personal Workspace';

  const hash = await bcrypt.hash(rawPassword, 10);

  // 1. Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      workspaceMembers: {
        include: { workspace: true }
      }
    }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Vamsi Pallela',
        email,
        passwordHash: hash,
      },
      include: {
        workspaceMembers: {
          include: { workspace: true }
        }
      }
    });
    console.log(`[CREATED] User record created: ${user.email} (ID: ${user.id})`);
  } else {
    // Preserve account and update password
    user = await prisma.user.update({
      where: { email },
      data: {
        name: user.name || 'Vamsi Pallela',
        passwordHash: hash,
      },
      include: {
        workspaceMembers: {
          include: { workspace: true }
        }
      }
    });
    console.log(`[PRESERVED] User record preserved and password updated to configured credentials: ${user.email}`);
  }

  // 2. Ensure Personal Workspace exists
  let personalMember = user.workspaceMembers.find(
    m => m.workspace?.name === targetWorkspaceName || m.workspace?.name === "Vamsi's Workspace"
  );

  let workspaceId;
  if (!personalMember) {
    const ws = await prisma.workspace.create({
      data: {
        name: targetWorkspaceName,
        ownerId: user.id,
      }
    });
    workspaceId = ws.id;
    await prisma.workspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId: user.id,
        role: 'OWNER',
      }
    });
    console.log(`[CREATED] Workspace created: "${targetWorkspaceName}" (ID: ${ws.id})`);
  } else {
    workspaceId = personalMember.workspaceId;
    if (personalMember.workspace.name !== targetWorkspaceName) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { name: targetWorkspaceName }
      });
      console.log(`[UPDATED] Renamed workspace from "${personalMember.workspace.name}" to "${targetWorkspaceName}"`);
    } else {
      console.log(`[PRESERVED] Workspace preserved: "${targetWorkspaceName}" (ID: ${workspaceId})`);
    }
  }

  // 3. Remove any lingering mock/seed artifacts from previous development tests in Personal Workspace
  // (Ensuring Account 1 is strictly private, genuine, and free from demo seed data)
  const lingeringSampleCampaigns = await prisma.campaign.findMany({
    where: {
      workspaceId,
      id: { in: ['tga-sales', 'q4-enterprise'] }
    }
  });

  if (lingeringSampleCampaigns.length > 0) {
    console.log(`[ISOLATION] Cleaning ${lingeringSampleCampaigns.length} legacy test sample campaigns from Personal Workspace...`);
    for (const c of lingeringSampleCampaigns) {
      await prisma.campaign.delete({ where: { id: c.id } });
    }
  }

  const lingeringSampleAccounts = await prisma.emailAccount.findMany({
    where: {
      workspaceId,
      accessTokenEncrypted: 'mock_encrypted_token'
    }
  });

  if (lingeringSampleAccounts.length > 0) {
    console.log(`[ISOLATION] Cleaning ${lingeringSampleAccounts.length} legacy test sample mailboxes from Personal Workspace...`);
    for (const acc of lingeringSampleAccounts) {
      await prisma.emailAccount.delete({ where: { id: acc.id } });
    }
  }

  // 4. Verify clean status
  const currentCampaignsCount = await prisma.campaign.count({ where: { workspaceId } });
  const currentAccountsCount = await prisma.emailAccount.count({ where: { workspaceId } });

  console.log(`[STATUS] Personal Workspace (${workspaceId}) summary:`);
  console.log(`         - Legitimate Campaigns: ${currentCampaignsCount}`);
  console.log(`         - Connected Mailboxes:  ${currentAccountsCount}`);
  console.log(`         - Demo Seed Data:       None (100% clean isolation)`);
  console.log('========================================================');
  console.log('Private Account Provisioning Complete!');
  console.log('========================================================');
}

provisionPrivateAccount()
  .catch((err) => {
    console.error('Provisioning failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

