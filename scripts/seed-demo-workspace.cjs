const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDemoWorkspace() {
  console.log('========================================================');
  console.log('ReachOps: Seeding Client Demo Workspace (Demo / Sandbox)');
  console.log('========================================================');

  const demoEmail = 'demo@reachops.com';
  const demoPassword = 'Demo@123';
  const demoWorkspaceId = 'demo-workspace-id';
  const demoWorkspaceName = 'ReachOps Demo Workspace';

  const hash = await bcrypt.hash(demoPassword, 10);

  // 1. Ensure Demo User
  let demoUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: demoEmail },
        { id: 'demo-user-id' }
      ]
    }
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        id: 'demo-user-id',
        name: 'Demo User',
        email: demoEmail,
        passwordHash: hash,
      }
    });
    console.log(`[CREATED] Demo user created: ${demoUser.email} (ID: ${demoUser.id})`);
  } else {
    demoUser = await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        name: 'Demo User',
        email: demoEmail,
        passwordHash: hash,
      }
    });
    console.log(`[UPDATED] Demo user credentials verified: ${demoUser.email}`);
  }

  // 2. Ensure Demo Workspace
  let demoWorkspace = await prisma.workspace.findUnique({
    where: { id: demoWorkspaceId }
  });

  if (!demoWorkspace) {
    demoWorkspace = await prisma.workspace.create({
      data: {
        id: demoWorkspaceId,
        name: demoWorkspaceName,
        ownerId: demoUser.id,
      }
    });
    console.log(`[CREATED] Demo workspace created: "${demoWorkspaceName}" (ID: ${demoWorkspace.id})`);
  } else {
    demoWorkspace = await prisma.workspace.update({
      where: { id: demoWorkspaceId },
      data: {
        name: demoWorkspaceName,
        ownerId: demoUser.id,
      }
    });
    console.log(`[UPDATED] Demo workspace verified: "${demoWorkspaceName}"`);
  }

  // 3. Ensure Workspace Membership
  let member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: demoWorkspaceId,
      userId: demoUser.id,
    }
  });

  if (!member) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: demoWorkspaceId,
        userId: demoUser.id,
        role: 'OWNER',
      }
    });
    console.log('[CREATED] Demo user workspace owner membership established');
  }

  // 4. Ensure Demo Email Accounts (Clearly labeled fictional sandbox senders)
  const demoAccounts = [
    {
      id: 'demo-acc-1',
      email: 'alex.turner@reachops-demo.example',
      displayName: 'Alex Turner (ReachOps Demo)',
      provider: 'GMAIL',
      status: 'ACTIVE',
      dailyLimit: 120,
      sentToday: 74,
    },
    {
      id: 'demo-acc-2',
      email: 'sarah.outreach@reachops-demo.example',
      displayName: 'Sarah Jenkins (ReachOps Demo)',
      provider: 'MICROSOFT',
      status: 'ACTIVE',
      dailyLimit: 100,
      sentToday: 52,
    },
    {
      id: 'demo-acc-3',
      email: 'team.outbound@reachops-demo.example',
      displayName: 'Growth Team (ReachOps Demo)',
      provider: 'GMAIL',
      status: 'ACTIVE',
      dailyLimit: 150,
      sentToday: 88,
    }
  ];

  for (const acc of demoAccounts) {
    await prisma.emailAccount.upsert({
      where: { id: acc.id },
      update: {
        workspaceId: demoWorkspaceId,
        email: acc.email,
        displayName: acc.displayName,
        provider: acc.provider,
        status: acc.status,
        dailyLimit: acc.dailyLimit,
        sentToday: acc.sentToday,
      },
      create: {
        id: acc.id,
        workspaceId: demoWorkspaceId,
        email: acc.email,
        displayName: acc.displayName,
        provider: acc.provider,
        providerAccountId: 'sample_' + acc.id,
        accessTokenEncrypted: 'demo_sandbox_token',
        status: acc.status,
        dailyLimit: acc.dailyLimit,
        sentToday: acc.sentToday,
      }
    });
  }
  console.log(`[SEEDED] ${demoAccounts.length} demonstration sandbox mailboxes configured`);

  // 5. Ensure 5 Fictional Campaigns
  const demoCampaigns = [
    {
      id: 'demo-camp-enterprise-saas',
      name: '[DEMO] Enterprise SaaS Outbound — Q4 Pipeline',
      status: 'ACTIVE',
      timezone: 'Eastern Time (US & Canada) (UTC-05:00)',
      dailyLimit: 120,
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
    },
    {
      id: 'demo-camp-midmarket-warmup',
      name: '[DEMO] Mid-Market Product Qualified Lead Warmup',
      status: 'ACTIVE',
      timezone: 'Central Time (US & Canada) (UTC-06:00)',
      dailyLimit: 80,
      sendingWindowStart: '10:00',
      sendingWindowEnd: '16:30',
    },
    {
      id: 'demo-camp-vp-execs',
      name: '[DEMO] VP of Sales Executive Outreach',
      status: 'PAUSED',
      timezone: 'Pacific Time (US & Canada) (UTC-08:00)',
      dailyLimit: 50,
      sendingWindowStart: '08:30',
      sendingWindowEnd: '15:00',
    },
    {
      id: 'demo-camp-inbound-nurture',
      name: '[DEMO] Inbound High-Intent Signups Nurture',
      status: 'ACTIVE',
      timezone: 'UTC',
      dailyLimit: 150,
      sendingWindowStart: '09:00',
      sendingWindowEnd: '18:00',
    },
    {
      id: 'demo-camp-beta-launch',
      name: '[DEMO] Product Hunt Beta Launch Sequence',
      status: 'COMPLETED',
      timezone: 'Eastern Time (US & Canada) (UTC-05:00)',
      dailyLimit: 200,
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
    }
  ];

  for (const c of demoCampaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: {
        workspaceId: demoWorkspaceId,
        name: c.name,
        status: c.status,
        timezone: c.timezone,
        dailyLimit: c.dailyLimit,
        sendingWindowStart: c.sendingWindowStart,
        sendingWindowEnd: c.sendingWindowEnd,
      },
      create: {
        id: c.id,
        workspaceId: demoWorkspaceId,
        name: c.name,
        status: c.status,
        timezone: c.timezone,
        dailyLimit: c.dailyLimit,
        sendingWindowStart: c.sendingWindowStart,
        sendingWindowEnd: c.sendingWindowEnd,
      }
    });
  }
  console.log(`[SEEDED] ${demoCampaigns.length} fictional demonstration campaigns configured`);

  // 6. Ensure Sequences with Follow-up steps for ALL 5 campaigns
  const sequencesData = [
    {
      id: 'demo-seq-saas-outbound',
      campaignId: 'demo-camp-enterprise-saas',
      name: '3-Touch Enterprise Value Cadence',
      steps: [
        {
          id: 'demo-step-saas-1',
          stepNumber: 1,
          delayDays: 0,
          subject: 'Quick question about {{company}} outbound pipeline',
          bodyHtml: '<p>Hi {{firstName}},</p><p>Saw what your team is scaling at {{company}}. We help enterprise B2B sales organizations automate inbox deliverability and lift positive reply rates by 3.2x.</p><p>Would you be open to a 10-minute intro this Thursday or Friday?</p><p>{{accountSignature}}</p>',
          bodyText: 'Hi {{firstName}},\n\nSaw what your team is scaling at {{company}}. We help enterprise B2B sales organizations automate inbox deliverability and lift positive reply rates by 3.2x.\n\nWould you be open to a 10-minute intro this Thursday or Friday?\n\n{{accountSignature}}'
        },
        {
          id: 'demo-step-saas-2',
          stepNumber: 2,
          delayDays: 3,
          subject: 'Re: Quick question about {{company}} outbound pipeline',
          bodyHtml: '<p>Hey {{firstName}},</p><p>Following up on my note from Tuesday. We recently helped a similar B2B team scale from 12 to 85 booked demos a month by implementing intelligent mailbox rotation.</p><p>Worth sharing the 2-page teardown?</p><p>{{accountSignature}}</p>',
          bodyText: 'Hey {{firstName}},\n\nFollowing up on my note from Tuesday. We recently helped a similar B2B team scale from 12 to 85 booked demos a month by implementing intelligent mailbox rotation.\n\nWorth sharing the 2-page teardown?\n\n{{accountSignature}}'
        }
      ]
    },
    {
      id: 'demo-seq-midmarket',
      campaignId: 'demo-camp-midmarket-warmup',
      name: 'PQL Executive Engagement Sequence',
      steps: [
        {
          id: 'demo-step-mm-1',
          stepNumber: 1,
          delayDays: 0,
          subject: 'Optimizing {{company}} sender reputation',
          bodyHtml: '<p>Hi {{firstName}},</p><p>Noticed {{company}}\'s rapid expansion. Quick question: are your outbound SDRs currently hitting Google or Outlook spam filters on cold campaigns?</p><p>{{accountSignature}}</p>',
          bodyText: 'Hi {{firstName}},\n\nNoticed {{company}}\'s rapid expansion. Quick question: are your outbound SDRs currently hitting Google or Outlook spam filters on cold campaigns?\n\n{{accountSignature}}'
        },
        {
          id: 'demo-step-mm-2',
          stepNumber: 2,
          delayDays: 2,
          subject: 'Quick deliverability benchmark for {{company}}',
          bodyHtml: '<p>Hi {{firstName}},</p><p>Here is a quick deliverability diagnostic we ran across your secondary outbound domains. Let me know if you would like to review the breakdown.</p><p>{{accountSignature}}</p>',
          bodyText: 'Hi {{firstName}},\n\nHere is a quick deliverability diagnostic we ran across your secondary outbound domains. Let me know if you would like to review the breakdown.\n\n{{accountSignature}}'
        }
      ]
    },
    {
      id: 'demo-seq-inbound-nurture',
      campaignId: 'demo-camp-inbound-nurture',
      name: 'High-Intent Product Warmup Drip',
      steps: [
        {
          id: 'demo-step-inbound-1',
          stepNumber: 1,
          delayDays: 0,
          subject: 'Welcome to ReachOps, {{firstName}}',
          bodyHtml: '<p>Hi {{firstName}},</p><p>Thanks for exploring ReachOps. Your inbox warmup engine is ready to deploy. Have you connected your primary sending mailbox yet?</p><p>{{accountSignature}}</p>',
          bodyText: 'Hi {{firstName}},\n\nThanks for exploring ReachOps. Your inbox warmup engine is ready to deploy. Have you connected your primary sending mailbox yet?\n\n{{accountSignature}}'
        },
        {
          id: 'demo-step-inbound-2',
          stepNumber: 2,
          delayDays: 2,
          subject: 'Tip: How to reach 99.4% inbox placement',
          bodyHtml: '<p>Hey {{firstName}},</p><p>Here are the 3 DNS settings (SPF, DKIM, DMARC) every high-volume cold emailer needs configured before sending their first 100 emails.</p><p>{{accountSignature}}</p>',
          bodyText: 'Hey {{firstName}},\n\nHere are the 3 DNS settings (SPF, DKIM, DMARC) every high-volume cold emailer needs configured before sending their first 100 emails.\n\n{{accountSignature}}'
        }
      ]
    },
    {
      id: 'demo-seq-vp-execs',
      campaignId: 'demo-camp-vp-execs',
      name: 'VP Sales Direct Cadence',
      steps: [
        {
          id: 'demo-step-vp-1',
          stepNumber: 1,
          delayDays: 0,
          subject: 'Scaling {{company}} outbound efficiency',
          bodyHtml: '<p>Hi {{firstName}},</p><p>Reaching out as we help B2B sales leaders eliminate spam folder landing. Are you free for a brief chat?</p><p>{{accountSignature}}</p>',
          bodyText: 'Hi {{firstName}},\n\nReaching out as we help B2B sales leaders eliminate spam folder landing. Are you free for a brief chat?\n\n{{accountSignature}}'
        }
      ]
    },
    {
      id: 'demo-seq-beta-launch',
      campaignId: 'demo-camp-beta-launch',
      name: 'Product Hunt Launch Follow-up',
      steps: [
        {
          id: 'demo-step-beta-1',
          stepNumber: 1,
          delayDays: 0,
          subject: 'Thanks for supporting our launch, {{firstName}}!',
          bodyHtml: '<p>Hi {{firstName}},</p><p>Saw you engaged with ReachOps on Product Hunt. Here is exclusive early access to our automated warmup pool.</p><p>{{accountSignature}}</p>',
          bodyText: 'Hi {{firstName}},\n\nSaw you engaged with ReachOps on Product Hunt. Here is exclusive early access to our automated warmup pool.\n\n{{accountSignature}}'
        }
      ]
    }
  ];

  for (const seq of sequencesData) {
    await prisma.sequence.upsert({
      where: { id: seq.id },
      update: {
        campaignId: seq.campaignId,
        name: seq.name,
      },
      create: {
        id: seq.id,
        campaignId: seq.campaignId,
        name: seq.name,
        status: 'ACTIVE',
      }
    });

    for (const step of seq.steps) {
      await prisma.sequenceStep.upsert({
        where: { id: step.id },
        update: {
          sequenceId: seq.id,
          stepNumber: step.stepNumber,
          delayDays: step.delayDays,
          subject: step.subject,
          bodyHtml: step.bodyHtml,
          bodyText: step.bodyText,
        },
        create: {
          id: step.id,
          sequenceId: seq.id,
          stepNumber: step.stepNumber,
          delayDays: step.delayDays,
          subject: step.subject,
          bodyHtml: step.bodyHtml,
          bodyText: step.bodyText,
        }
      });
    }
  }
  console.log('[SEEDED] Multi-step demonstration sequences configured for all 5 campaigns');

  // 7. Ensure 30 Fictional Contacts across Sample Companies (6 per campaign)
  const fictionalProspects = [
    // 1. Enterprise SaaS Campaign (6 prospects)
    { id: 'demo-p-01', camp: 'demo-camp-enterprise-saas', firstName: 'Sarah', lastName: 'Connor', email: 'sarah.connor@acme-corp.example', company: 'Acme Corp', title: 'VP of Sales', status: 'REPLIED', replied: true },
    { id: 'demo-p-02', camp: 'demo-camp-enterprise-saas', firstName: 'David', lastName: 'Miller', email: 'david.miller@acme-corp.example', company: 'Acme Corp', title: 'Head of RevOps', status: 'REPLIED', replied: true },
    { id: 'demo-p-03', camp: 'demo-camp-enterprise-saas', firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@acme-corp.example', company: 'Acme Corp', title: 'Enterprise AE', status: 'NEW' },
    { id: 'demo-p-04', camp: 'demo-camp-enterprise-saas', firstName: 'Elena', lastName: 'Rostova', email: 'elena.rostova@cloudscale.example', company: 'CloudScale Systems', title: 'Head of Growth', status: 'REPLIED', replied: true },
    { id: 'demo-p-05', camp: 'demo-camp-enterprise-saas', firstName: 'Alex', lastName: 'Zhao', email: 'alex.zhao@cloudscale.example', company: 'CloudScale Systems', title: 'Chief Revenue Officer', status: 'CONTACTED' },
    { id: 'demo-p-06', camp: 'demo-camp-enterprise-saas', firstName: 'Thomas', lastName: 'Wright', email: 't.wright@cloudscale.example', company: 'CloudScale Systems', title: 'Sales Operations', status: 'BOUNCED', bounced: true },

    // 2. Mid-Market Warmup Campaign (6 prospects)
    { id: 'demo-p-07', camp: 'demo-camp-midmarket-warmup', firstName: 'Marcus', lastName: 'Bell', email: 'marcus.bell@novacorp.example', company: 'NovaCorp Technologies', title: 'Chief Technology Officer', status: 'REPLIED', replied: true },
    { id: 'demo-p-08', camp: 'demo-camp-midmarket-warmup', firstName: 'Chloe', lastName: 'Dupont', email: 'chloe.d@novacorp.example', company: 'NovaCorp Technologies', title: 'VP Engineering', status: 'CONTACTED' },
    { id: 'demo-p-09', camp: 'demo-camp-midmarket-warmup', firstName: 'Benjamin', lastName: 'Foster', email: 'b.foster@novacorp.example', company: 'NovaCorp Technologies', title: 'IT Infrastructure Lead', status: 'CONTACTED' },
    { id: 'demo-p-10', camp: 'demo-camp-midmarket-warmup', firstName: 'Rachel', lastName: 'Green', email: 'rachel.green@apex-tech.example', company: 'Apex Tech Enterprises', title: 'VP Demand Generation', status: 'REPLIED', replied: true },
    { id: 'demo-p-11', camp: 'demo-camp-midmarket-warmup', firstName: 'Daniel', lastName: 'Brooks', email: 'd.brooks@apex-tech.example', company: 'Apex Tech Enterprises', title: 'Director of Growth', status: 'CONTACTED' },
    { id: 'demo-p-12', camp: 'demo-camp-midmarket-warmup', firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.m@apex-tech.example', company: 'Apex Tech Enterprises', title: 'Outbound Specialist', status: 'NEW' },

    // 3. Inbound High-Intent Signups Nurture Campaign (6 prospects - SCREENSHOT CAMPAIGN)
    { id: 'demo-p-13', camp: 'demo-camp-inbound-nurture', firstName: 'Lucas', lastName: 'Silver', email: 'lucas@solaris-systems.example', company: 'Solaris Systems', title: 'Founder & CEO', status: 'REPLIED', replied: true },
    { id: 'demo-p-14', camp: 'demo-camp-inbound-nurture', firstName: 'Aria', lastName: 'Cole', email: 'aria.cole@solaris-systems.example', company: 'Solaris Systems', title: 'Co-Founder & COO', status: 'REPLIED', replied: true },
    { id: 'demo-p-15', camp: 'demo-camp-inbound-nurture', firstName: 'Nathan', lastName: 'Drake', email: 'nathan@solaris-systems.example', company: 'Solaris Systems', title: 'Head of Partnerships', status: 'CONTACTED' },
    { id: 'demo-p-16', camp: 'demo-camp-inbound-nurture', firstName: 'Zoe', lastName: 'Barnes', email: 'zoe@solaris-systems.example', company: 'Solaris Systems', title: 'Sales Operations', status: 'CONTACTED' },
    { id: 'demo-p-17', camp: 'demo-camp-inbound-nurture', firstName: 'Leo', lastName: 'Kim', email: 'leo.kim@solaris-systems.example', company: 'Solaris Systems', title: 'Outreach Manager', status: 'NEW' },
    { id: 'demo-p-18', camp: 'demo-camp-inbound-nurture', firstName: 'Hannah', lastName: 'Scott', email: 'hannah.s@solaris-systems.example', company: 'Solaris Systems', title: 'Growth Marketer', status: 'NEW' },

    // 4. VP Sales Executive Outreach Campaign (6 prospects)
    { id: 'demo-p-19', camp: 'demo-camp-vp-execs', firstName: 'Jordan', lastName: 'Lee', email: 'jordan.lee@acme-corp.example', company: 'Acme Corp', title: 'VP Sales Strategy', status: 'REPLIED', replied: true },
    { id: 'demo-p-20', camp: 'demo-camp-vp-execs', firstName: 'Liam', lastName: 'Vance', email: 'liam.vance@acme-corp.example', company: 'Acme Corp', title: 'Director of Marketing', status: 'REPLIED', replied: true },
    { id: 'demo-p-21', camp: 'demo-camp-vp-execs', firstName: 'Jessica', lastName: 'Adams', email: 'j.adams@novacorp.example', company: 'NovaCorp Technologies', title: 'Head of Product Sales', status: 'CONTACTED' },
    { id: 'demo-p-22', camp: 'demo-camp-vp-execs', firstName: 'Ryan', lastName: 'Murphy', email: 'r.murphy@novacorp.example', company: 'NovaCorp Technologies', title: 'Regional VP Sales', status: 'NEW' },
    { id: 'demo-p-23', camp: 'demo-camp-vp-execs', firstName: 'Megan', lastName: 'Taylor', email: 'm.taylor@apex-tech.example', company: 'Apex Tech Enterprises', title: 'Executive VP Growth', status: 'CONTACTED' },
    { id: 'demo-p-24', camp: 'demo-camp-vp-execs', firstName: 'Victoria', lastName: 'Price', email: 'v.price@apex-tech.example', company: 'Apex Tech Enterprises', title: 'RevOps Specialist', status: 'NEW' },

    // 5. Product Hunt Beta Launch Sequence Campaign (6 prospects)
    { id: 'demo-p-25', camp: 'demo-camp-beta-launch', firstName: 'Maya', lastName: 'Patel', email: 'maya.patel@velocity-ai.example', company: 'Velocity AI', title: 'Head of Sales', status: 'REPLIED', replied: true },
    { id: 'demo-p-26', camp: 'demo-camp-beta-launch', firstName: 'Oliver', lastName: 'Grant', email: 'oliver.g@velocity-ai.example', company: 'Velocity AI', title: 'Founder', status: 'CONTACTED' },
    { id: 'demo-p-27', camp: 'demo-camp-beta-launch', firstName: 'Isabella', lastName: 'Cruz', email: 'isabella@example.org', company: 'Horizon Media', title: 'VP Digital Media', status: 'CONTACTED' },
    { id: 'demo-p-28', camp: 'demo-camp-beta-launch', firstName: 'Ethan', lastName: 'Hunt', email: 'ethan.hunt@example.com', company: 'Synergy Labs', title: 'Managing Director', status: 'REPLIED', replied: true },
    { id: 'demo-p-29', camp: 'demo-camp-beta-launch', firstName: 'Amelia', lastName: 'Watson', email: 'amelia.watson@example.com', company: 'Quantum Retail', title: 'Head of E-commerce', status: 'NEW' },
    { id: 'demo-p-30', camp: 'demo-camp-beta-launch', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.m@cloudscale.example', company: 'CloudScale Systems', title: 'Demand Gen Lead', status: 'CONTACTED' },
  ];

  for (const p of fictionalProspects) {
    await prisma.prospect.upsert({
      where: { id: p.id },
      update: {
        campaignId: p.camp,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        company: p.company,
        jobTitle: p.title,
        status: p.status,
        replied: !!p.replied,
        bounced: !!p.bounced,
      },
      create: {
        id: p.id,
        campaignId: p.camp,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        company: p.company,
        jobTitle: p.title,
        status: p.status,
        replied: !!p.replied,
        bounced: !!p.bounced,
      }
    });
  }
  console.log(`[SEEDED] ${fictionalProspects.length} fictional contacts across all 5 sample campaigns configured`);

  // 8. Ensure Sample Messages & Inbox Conversations across ALL 5 CAMPAIGNS
  const sampleMessages = [
    // --- CAMPAIGN 3: [DEMO] Inbound High-Intent Signups Nurture (The user screenshot campaign!) ---
    {
      id: 'demo-msg-inbound-1',
      campaignId: 'demo-camp-inbound-nurture',
      prospectId: 'demo-p-13',
      emailAccountId: 'demo-acc-1',
      sequenceStepId: 'demo-step-inbound-1',
      subject: 'Welcome to ReachOps, Lucas',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      replyText: 'Hi Alex, thanks for reaching out. We are scaling our outbound team to 15 SDRs next month and deliverability is our biggest bottleneck. Can we do a live walkthrough of your automated mailbox rotation and DNS diagnosis this Thursday?',
      replyTag: 'Positive',
      repliedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    },
    {
      id: 'demo-msg-inbound-2',
      campaignId: 'demo-camp-inbound-nurture',
      prospectId: 'demo-p-14',
      emailAccountId: 'demo-acc-1',
      sequenceStepId: 'demo-step-inbound-1',
      subject: 'Welcome to ReachOps, Aria',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      replyText: 'Hey team, does ReachOps support Google Workspace admin service account delegation for automated alias provisioning? We would like to automate onboarding 20 new mailboxes next week.',
      replyTag: 'Interested',
      repliedAt: new Date(Date.now() - 1.5 * 24 * 3600 * 1000),
    },

    // --- CAMPAIGN 1: [DEMO] Enterprise SaaS Outbound ---
    {
      id: 'demo-msg-01',
      campaignId: 'demo-camp-enterprise-saas',
      prospectId: 'demo-p-01',
      emailAccountId: 'demo-acc-1',
      sequenceStepId: 'demo-step-saas-1',
      subject: 'Quick question about Acme Corp outbound pipeline',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      replyText: 'Hi Alex, thanks for reaching out. Yes, we are actually struggling with Google Workspace deliverability for our new SDR hires right now. Can you share your calendar link for next Tuesday?',
      replyTag: 'Positive',
      repliedAt: new Date(Date.now() - 1.8 * 24 * 3600 * 1000),
    },
    {
      id: 'demo-msg-02',
      campaignId: 'demo-camp-enterprise-saas',
      prospectId: 'demo-p-02',
      emailAccountId: 'demo-acc-1',
      sequenceStepId: 'demo-step-saas-1',
      subject: 'Quick question about Acme Corp outbound pipeline',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      replyText: 'Hey Alex, looks interesting. What does your enterprise pricing model look like per mailbox, and does it include automated SPF/DKIM delegation?',
      replyTag: 'Warm',
      repliedAt: new Date(Date.now() - 2.5 * 24 * 3600 * 1000),
    },
    {
      id: 'demo-msg-03',
      campaignId: 'demo-camp-enterprise-saas',
      prospectId: 'demo-p-04',
      emailAccountId: 'demo-acc-2',
      sequenceStepId: 'demo-step-saas-1',
      subject: 'Quick question about CloudScale Systems outbound pipeline',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      replyText: 'Hello Alex, please loop in our VP of Sales Alex Zhao on this thread as he oversees our outreach infrastructure.',
      replyTag: 'Positive',
      repliedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    },

    // --- CAMPAIGN 2: [DEMO] Mid-Market Warmup ---
    {
      id: 'demo-msg-04',
      campaignId: 'demo-camp-midmarket-warmup',
      prospectId: 'demo-p-07',
      emailAccountId: 'demo-acc-2',
      sequenceStepId: 'demo-step-mm-1',
      subject: 'Optimizing NovaCorp Technologies sender reputation',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      replyText: 'Thank you for your message. I am out of the office until Monday for our quarterly offsite. For urgent matters please ping our support channel.',
      replyTag: 'Out of Office',
      repliedAt: new Date(Date.now() - 1.2 * 24 * 3600 * 1000),
    },
    {
      id: 'demo-msg-05',
      campaignId: 'demo-camp-midmarket-warmup',
      prospectId: 'demo-p-10',
      emailAccountId: 'demo-acc-3',
      sequenceStepId: 'demo-step-mm-1',
      subject: 'Optimizing Apex Tech Enterprises sender reputation',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 2.5 * 24 * 3600 * 1000),
      replyText: 'Hi Sarah, can you forward the 2-page deliverability teardown you mentioned? If the metrics look solid, I will bring this up with our growth committee.',
      replyTag: 'Positive',
      repliedAt: new Date(Date.now() - 0.8 * 24 * 3600 * 1000),
    },

    // --- CAMPAIGN 4: [DEMO] VP of Sales Executive Outreach ---
    {
      id: 'demo-msg-vp-1',
      campaignId: 'demo-camp-vp-execs',
      prospectId: 'demo-p-19',
      emailAccountId: 'demo-acc-1',
      sequenceStepId: 'demo-step-vp-1',
      subject: 'Scaling Acme Corp outbound efficiency',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      replyText: 'Hi Alex, saw your note on scaling SDR reply rates. Let\'s do a 15-min call this Thursday at 2 PM EST.',
      replyTag: 'Meeting',
      repliedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    {
      id: 'demo-msg-vp-2',
      campaignId: 'demo-camp-vp-execs',
      prospectId: 'demo-p-20',
      emailAccountId: 'demo-acc-2',
      sequenceStepId: 'demo-step-vp-1',
      subject: 'Scaling Acme Corp outbound efficiency',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      replyText: 'Following up on this. Can you send over a recording of your inbox rotation feature?',
      replyTag: 'Warm',
      repliedAt: new Date(Date.now() - 2.2 * 24 * 3600 * 1000),
    },

    // --- CAMPAIGN 5: [DEMO] Product Hunt Beta Launch ---
    {
      id: 'demo-msg-beta-1',
      campaignId: 'demo-camp-beta-launch',
      prospectId: 'demo-p-25',
      emailAccountId: 'demo-acc-3',
      sequenceStepId: 'demo-step-beta-1',
      subject: 'Thanks for supporting our launch, Maya!',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      replyText: 'Congrats on the launch! We would love to test ReachOps on our staging domains next week.',
      replyTag: 'Positive',
      repliedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    },
    {
      id: 'demo-msg-beta-2',
      campaignId: 'demo-camp-beta-launch',
      prospectId: 'demo-p-28',
      emailAccountId: 'demo-acc-3',
      sequenceStepId: 'demo-step-beta-1',
      subject: 'Thanks for supporting our launch, Ethan!',
      status: 'REPLIED',
      sentAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      replyText: 'Hi team, great launch on Product Hunt! What\'s the main difference between your warmup network and Instantly?',
      replyTag: 'Interested',
      repliedAt: new Date(Date.now() - 4.5 * 24 * 3600 * 1000),
    },

    // Additional Sent & Opened messages for metric realism
    {
      id: 'demo-msg-extra-1',
      campaignId: 'demo-camp-inbound-nurture',
      prospectId: 'demo-p-15',
      emailAccountId: 'demo-acc-1',
      sequenceStepId: 'demo-step-inbound-1',
      subject: 'Welcome to ReachOps, Nathan',
      status: 'OPENED',
      sentAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      openedAt: new Date(Date.now() - 0.5 * 24 * 3600 * 1000),
    },
    {
      id: 'demo-msg-extra-2',
      campaignId: 'demo-camp-inbound-nurture',
      prospectId: 'demo-p-16',
      emailAccountId: 'demo-acc-1',
      sequenceStepId: 'demo-step-inbound-1',
      subject: 'Welcome to ReachOps, Zoe',
      status: 'SENT',
      sentAt: new Date(Date.now() - 0.3 * 24 * 3600 * 1000),
    }
  ];

  for (const m of sampleMessages) {
    await prisma.message.upsert({
      where: { id: m.id },
      update: {
        campaignId: m.campaignId,
        prospectId: m.prospectId,
        emailAccountId: m.emailAccountId,
        sequenceStepId: m.sequenceStepId,
        subject: m.subject,
        status: m.status,
        sentAt: m.sentAt,
        openedAt: m.openedAt,
      },
      create: {
        id: m.id,
        campaignId: m.campaignId,
        prospectId: m.prospectId,
        emailAccountId: m.emailAccountId,
        sequenceStepId: m.sequenceStepId,
        subject: m.subject,
        status: m.status,
        sentAt: m.sentAt,
        openedAt: m.openedAt,
      }
    });

    if (m.replyText) {
      const eventId = `event-reply-${m.id}`;
      await prisma.messageEvent.upsert({
        where: { id: eventId },
        update: {
          messageId: m.id,
          eventType: 'REPLY',
          eventDataJson: JSON.stringify({
            replyText: m.replyText,
            replyTag: m.replyTag,
            repliedAt: m.repliedAt,
          })
        },
        create: {
          id: eventId,
          messageId: m.id,
          eventType: 'REPLY',
          eventDataJson: JSON.stringify({
            replyText: m.replyText,
            replyTag: m.replyTag,
            repliedAt: m.repliedAt,
          })
        }
      });
    }
  }
  console.log(`[SEEDED] ${sampleMessages.length} demonstration messages and active conversations configured across ALL 5 campaigns`);

  // 9. Summary
  const totalCampaigns = await prisma.campaign.count({ where: { workspaceId: demoWorkspaceId } });
  const totalProspects = await prisma.prospect.count({ where: { campaign: { workspaceId: demoWorkspaceId } } });
  const totalAccounts = await prisma.emailAccount.count({ where: { workspaceId: demoWorkspaceId } });
  const totalReplies = await prisma.messageEvent.count({
    where: { message: { campaign: { workspaceId: demoWorkspaceId } }, eventType: 'REPLY' }
  });

  console.log('========================================================');
  console.log(`Demo Workspace (${demoWorkspaceId}) Summary:`);
  console.log(`- Fictional Campaigns:  ${totalCampaigns}`);
  console.log(`- Fictional Contacts:   ${totalProspects}`);
  console.log(`- Inbox Conversations:  ${totalReplies} (active across all 5 campaigns)`);
  console.log(`- Sandbox Mailboxes:    ${totalAccounts}`);
  console.log('- Live Dispatch:        DISABLED (Safeguarded by mailer backend)');
  console.log('Client Demo Workspace Seeding Complete!');
  console.log('========================================================');
}

seedDemoWorkspace()
  .catch((err) => {
    console.error('Demo seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
