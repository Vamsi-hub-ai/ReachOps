const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedResponses() {
  console.log('Seeding campaign responses into database...');

  // 1. Find or create q4-enterprise campaign
  let q4 = await prisma.campaign.findUnique({ where: { id: 'q4-enterprise' } });
  let ws = await prisma.workspace.findFirst();
  const wsId = ws ? ws.id : 'demo-workspace-id';

  if (!q4) {
    q4 = await prisma.campaign.create({
      data: {
        id: 'q4-enterprise',
        workspaceId: wsId,
        name: 'Q4 Enterprise Outreach',
        status: 'ACTIVE',
        dailyLimit: 150,
        sendingWindowStart: '09:00',
        sendingWindowEnd: '17:00',
      }
    });
  }

  // 2. Find or create email account for sending
  let emailAcc = await prisma.emailAccount.findFirst({ where: { workspaceId: q4.workspaceId } });
  if (!emailAcc) {
    emailAcc = await prisma.emailAccount.create({
      data: {
        workspaceId: q4.workspaceId,
        email: 'outreach@reachops.com',
        displayName: 'Outreach Team',
        provider: 'GMAIL',
        providerAccountId: 'acc-outreach',
        accessTokenEncrypted: 'mock',
        status: 'ACTIVE',
        dailyLimit: 100,
        sentToday: 18,
      }
    });
  }

  // 3. Ensure sequence step
  let seq = await prisma.sequence.findFirst({ where: { campaignId: q4.id }, include: { steps: true } });
  if (!seq) {
    seq = await prisma.sequence.create({
      data: {
        campaignId: q4.id,
        name: 'Enterprise Multi-touch Sequence',
        status: 'ACTIVE',
        steps: {
          create: [
            {
              stepNumber: 1,
              subject: 'Quick question about {{company}} B2B pipeline',
              bodyHtml: '<p>Hi {{firstName}},</p><p>Saw what your team is building at {{company}}. We help B2B teams accelerate outbound reply rates by 3.4x using automated mailbox warmup and provider matching.</p><p>Worth a quick 5-min intro this Thursday?</p>',
              bodyText: 'Hi {{firstName}},\n\nSaw what your team is building at {{company}}. We help B2B teams accelerate outbound reply rates by 3.4x using automated mailbox warmup and provider matching.\n\nWorth a quick 5-min intro this Thursday?',
              delayDays: 0,
            }
          ]
        }
      },
      include: { steps: true }
    });
  }

  const stepId = seq.steps[0]?.id;

  // 4. Sample responded leads for Q4 Enterprise
  const q4Replies = [
    {
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.connor@acme.com',
      company: 'Acme Systems',
      jobTitle: 'VP of Growth',
      replyText: "Hi Vamsi,\n\nThanks for reaching out. Yes, we are actively looking into fixing our deliverability as our SDR team's open rates dropped recently.\n\nAre you available for a 15-minute call next Tuesday at 2 PM EST?\n\nBest,\nSarah Connor",
      replyTag: 'Meeting',
      timeOffsetMinutes: 45,
    },
    {
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@enterprise.io',
      company: 'Enterprise IO',
      jobTitle: 'Head of Sales Ops',
      replyText: "Hi,\n\nCould you send over a 1-page pricing sheet or deck first? If the pricing aligns with our quarterly budget, I'd be happy to schedule a demo with our VP of Sales.\n\nThanks,\nDavid",
      replyTag: 'Interested',
      timeOffsetMinutes: 180,
    },
    {
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena@growthcloud.net',
      company: 'GrowthCloud',
      jobTitle: 'Director of Marketing',
      replyText: "Hi Vamsi,\n\nDoes ReachOps support direct integration with HubSpot and rotating Google Workspace accounts?\n\nLooking forward to hearing from you,\nElena",
      replyTag: 'Question',
      timeOffsetMinutes: 320,
    },
    {
      firstName: 'Marcus',
      lastName: 'Brody',
      email: 'marcus.b@novacorp.com',
      company: 'NovaCorp',
      jobTitle: 'Chief Revenue Officer',
      replyText: "Hi, loop in my executive assistant Clara (cc'd) to find 20 minutes on my calendar for next week.\n\nMarcus",
      replyTag: 'Positive',
      timeOffsetMinutes: 600,
    }
  ];

  for (const r of q4Replies) {
    let p = await prisma.prospect.findFirst({
      where: { email: r.email, campaignId: q4.id }
    });

    if (!p) {
      p = await prisma.prospect.create({
        data: {
          campaignId: q4.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          company: r.company,
          jobTitle: r.jobTitle,
          status: 'Replied',
          replied: true,
        }
      });
    } else {
      await prisma.prospect.update({
        where: { id: p.id },
        data: { replied: true, status: 'Replied' }
      });
    }

    // Ensure outbound message and inbound reply message
    const msg = await prisma.message.findFirst({
      where: { campaignId: q4.id, prospectId: p.id }
    });

    if (!msg && stepId) {
      const createdMsg = await prisma.message.create({
        data: {
          campaignId: q4.id,
          prospectId: p.id,
          emailAccountId: emailAcc.id,
          sequenceStepId: stepId,
          subject: `Quick question about ${r.company} B2B pipeline`,
          status: 'REPLIED',
          sentAt: new Date(Date.now() - (r.timeOffsetMinutes + 120) * 60 * 1000),
          openedAt: new Date(Date.now() - (r.timeOffsetMinutes + 60) * 60 * 1000),
        }
      });

      // Add reply event
      await prisma.messageEvent.create({
        data: {
          messageId: createdMsg.id,
          eventType: 'REPLY',
          eventDataJson: JSON.stringify({
            replyText: r.replyText,
            replyTag: r.replyTag,
            repliedAt: new Date(Date.now() - r.timeOffsetMinutes * 60 * 1000).toISOString(),
          })
        }
      });
    }
  }

  // Also ensure TGA-Sales responses
  let tga = await prisma.campaign.findUnique({ where: { id: 'tga-sales' } });
  if (tga) {
    let tgaSeq = await prisma.sequence.findFirst({ where: { campaignId: tga.id }, include: { steps: true } });
    const tgaStepId = tgaSeq?.steps[0]?.id;

    const tgaReplies = [
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@scalecloud.in',
        company: 'ScaleCloud',
        jobTitle: 'Head of Demand Gen',
        replyText: "Hi Vamsi,\n\nLet's connect on Thursday at 3 PM IST. Please send over a calendar invite.\n\nBest,\nPriya",
        replyTag: 'Meeting',
        timeOffsetMinutes: 75,
      },
      {
        firstName: 'Rahul',
        lastName: 'Verma',
        email: 'rahul@techflows.co',
        company: 'TechFlows',
        jobTitle: 'Sales Director',
        replyText: "Interested. How does your warmup protocol work with newly registered domains?\n\nRegards,\nRahul",
        replyTag: 'Question',
        timeOffsetMinutes: 240,
      }
    ];

    for (const r of tgaReplies) {
      let p = await prisma.prospect.findFirst({
        where: { email: r.email, campaignId: tga.id }
      });

      if (!p) {
        p = await prisma.prospect.create({
          data: {
            campaignId: tga.id,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            company: r.company,
            jobTitle: r.jobTitle,
            status: 'Replied',
            replied: true,
          }
        });
      }

      const msg = await prisma.message.findFirst({
        where: { campaignId: tga.id, prospectId: p.id }
      });

      if (!msg && tgaStepId) {
        const createdMsg = await prisma.message.create({
          data: {
            campaignId: tga.id,
            prospectId: p.id,
            emailAccountId: emailAcc.id,
            sequenceStepId: tgaStepId,
            subject: `Kindly confirm a time slot, ${r.firstName} ?`,
            status: 'REPLIED',
            sentAt: new Date(Date.now() - (r.timeOffsetMinutes + 120) * 60 * 1000),
            openedAt: new Date(Date.now() - (r.timeOffsetMinutes + 60) * 60 * 1000),
          }
        });

        await prisma.messageEvent.create({
          data: {
            messageId: createdMsg.id,
            eventType: 'REPLY',
            eventDataJson: JSON.stringify({
              replyText: r.replyText,
              replyTag: r.replyTag,
              repliedAt: new Date(Date.now() - r.timeOffsetMinutes * 60 * 1000).toISOString(),
            })
          }
        });
      }
    }
  }

  console.log('Successfully seeded responses!');
}

seedResponses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
