const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding SQLite database...');

  // 1. Ensure primary user
  const email = 'vamsipallela31@gmail.com';
  let user = await prisma.user.findUnique({ where: { email } });
  const hash = await bcrypt.hash('Demo@123', 10);

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Vamsi Pallela',
        email,
        passwordHash: hash,
      }
    });
  } else {
    user = await prisma.user.update({
      where: { email },
      data: {
        name: 'Vamsi Pallela',
        passwordHash: hash,
      }
    });
  }

  // 2. Ensure workspace
  let member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true }
  });

  let workspaceId;
  if (!member) {
    const ws = await prisma.workspace.create({
      data: {
        name: "Vamsi's Workspace",
        ownerId: user.id,
      }
    });
    workspaceId = ws.id;
    await prisma.workspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId: user.id,
        role: 'OWNER'
      }
    });
  } else {
    workspaceId = member.workspaceId;
  }

  console.log('Workspace ID:', workspaceId);

  // 3. Ensure Email Accounts
  const sampleAccounts = [
    { email: 'gayatri@theglobalassociates.com', displayName: 'Gayatri TGA' },
    { email: 'ishita@theglobalassociates.com', displayName: 'Ishita TGA' },
    { email: 'juhi@theglobalassociates.com', displayName: 'Juhi TGA' },
    { email: 'sales.lead@theglobalassociates.com', displayName: 'Sales Outreach' },
  ];

  for (const acc of sampleAccounts) {
    const existing = await prisma.emailAccount.findFirst({
      where: { email: acc.email, workspaceId }
    });
    if (!existing) {
      await prisma.emailAccount.create({
        data: {
          workspaceId,
          email: acc.email,
          displayName: acc.displayName,
          provider: 'GMAIL',
          providerAccountId: 'sample_' + acc.email,
          accessTokenEncrypted: 'mock_encrypted_token',
          status: 'ACTIVE',
          dailyLimit: 100,
          sentToday: 14,
        }
      });
    }
  }

  // 4. Ensure Campaigns
  const campaignsData = [
    {
      id: 'tga-sales',
      name: 'TGA-Sales',
      status: 'ACTIVE',
      timezone: 'Chennai, Kolkata, Mumbai, New Delhi (UTC+05:30)',
      dailyLimit: 90,
      sendingWindowStart: '09:30',
      sendingWindowEnd: '16:00',
    },
    {
      id: 'q4-enterprise',
      name: 'Q4 Enterprise Outreach',
      status: 'ACTIVE',
      timezone: 'Eastern Time (US & Canada) (UTC-05:00)',
      dailyLimit: 150,
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
    }
  ];

  for (const c of campaignsData) {
    let camp = await prisma.campaign.findUnique({ where: { id: c.id } });
    if (!camp) {
      camp = await prisma.campaign.create({
        data: {
          id: c.id,
          workspaceId,
          name: c.name,
          status: c.status,
          timezone: c.timezone,
          dailyLimit: c.dailyLimit,
          sendingWindowStart: c.sendingWindowStart,
          sendingWindowEnd: c.sendingWindowEnd,
        }
      });
      console.log('Created campaign:', c.name);
    }

    // Sequence for campaign
    let seq = await prisma.sequence.findFirst({ where: { campaignId: c.id } });
    if (!seq) {
      seq = await prisma.sequence.create({
        data: {
          campaignId: c.id,
          name: `${c.name} Multi-touch Sequence`,
          status: 'ACTIVE',
          steps: {
            create: [
              {
                stepNumber: 1,
                delayDays: 0,
                subject: 'Quick question about {{company}} B2B pipeline',
                bodyHtml: '<p>Hi {{firstName}},</p><p>Saw what your team is building at {{company}}. We help B2B teams accelerate outbound reply rates by 3.4x using automated mailbox warmup and provider matching.</p><p>Worth a quick 5-min intro this Thursday?</p><p>Best,<br>Vamsi</p>',
                bodyText: 'Hi {{firstName}},\n\nSaw what your team is building at {{company}}. We help B2B teams accelerate outbound reply rates by 3.4x using automated mailbox warmup and provider matching.\n\nWorth a quick 5-min intro this Thursday?\n\nBest,\nVamsi',
              },
              {
                stepNumber: 2,
                delayDays: 2,
                subject: 'Re: Quick question about {{company}} B2B pipeline',
                bodyHtml: '<p>Hey {{firstName}},</p><p>Following up on my previous note. Did you have a moment to review this?</p><p>Cheers,<br>Vamsi</p>',
                bodyText: 'Hey {{firstName}},\n\nFollowing up on my previous note. Did you have a moment to review this?\n\nCheers,\nVamsi',
              }
            ]
          }
        }
      });
      console.log('Created sequence for:', c.name);
    }
  }

  console.log('Database seeding complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
