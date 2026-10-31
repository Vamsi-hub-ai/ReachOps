import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

const DEMO_CAMPAIGN_MAP: Record<string, string> = {
  'demo-c1': 'demo-camp-inbound-nurture',
  'demo-c2': 'demo-camp-beta-launch',
  'demo-c3': 'demo-camp-enterprise-saas',
  'demo-c4': 'demo-camp-midmarket-warmup',
  'demo-c5': 'demo-camp-vp-execs',
  'tga-sales': 'demo-camp-vp-execs',
};

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceId, workspaceIds, isDemo } = auth;

    if (method === 'GET') {
      let formatted: any[] = [];
      try {
        const campaigns = await prisma.campaign.findMany({
          where: { workspaceId: { in: workspaceIds } },
          include: {
            prospects: { select: { id: true } },
            messages: { select: { id: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        formatted = campaigns.map((c) => {
          const sent = c.messages.filter((m) => m.status === 'SENT').length;
          const replies = c.messages.filter((m) => m.status === 'REPLIED').length;
          const rate = sent > 0 ? ((replies / sent) * 100).toFixed(1) + '%' : '0%';

          return {
            id: c.id,
            name: c.name,
            status: c.status === 'ACTIVE' ? 'Running' : c.status === 'DRAFT' ? 'Draft' : 'Paused',
            created: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            prospects: c.prospects.length || (isDemo ? 12 : 0),
            sent: sent || (isDemo ? 8 : 0),
            replies: replies || (isDemo ? 3 : 0),
            replyRate: sent > 0 ? rate : (isDemo ? '37.5%' : '0%'),
            nextSend: c.status === 'ACTIVE' ? 'Today, 14:00 (Rotated)' : 'Scheduled',
          };
        });
      } catch (dbErr: any) {
        console.warn('Prisma campaigns query failed:', dbErr?.message);
      }

      if (formatted.length === 0 && isDemo) {
        formatted = [
          {
            id: 'demo-camp-inbound-nurture',
            name: '[DEMO] Inbound High-Intent Signups Nurture',
            status: 'Running',
            created: 'Oct 23, 2026',
            prospects: 12,
            sent: 8,
            replies: 3,
            replyRate: '37.5%',
            nextSend: 'Today, 14:00 (Rotated)',
          },
          {
            id: 'demo-camp-beta-launch',
            name: '[DEMO] Product Hunt Beta Launch Sequence',
            status: 'Running',
            created: 'Oct 24, 2026',
            prospects: 8,
            sent: 5,
            replies: 2,
            replyRate: '40.0%',
            nextSend: 'Today, 15:30 (Rotated)',
          },
          {
            id: 'demo-camp-enterprise-saas',
            name: '[DEMO] Enterprise SaaS Outbound — Q4 Pipeline',
            status: 'Running',
            created: 'Oct 25, 2026',
            prospects: 24,
            sent: 16,
            replies: 6,
            replyRate: '37.5%',
            nextSend: 'Today, 16:00 (Rotated)',
          },
          {
            id: 'demo-camp-midmarket-warmup',
            name: '[DEMO] Mid-Market Product Qualified Lead Warmup',
            status: 'Running',
            created: 'Oct 26, 2026',
            prospects: 18,
            sent: 11,
            replies: 4,
            replyRate: '36.4%',
            nextSend: 'Today, 17:15 (Rotated)',
          },
          {
            id: 'demo-camp-vp-execs',
            name: '[DEMO] VP of Sales Executive Outreach',
            status: 'Paused',
            created: 'Oct 27, 2026',
            prospects: 6,
            sent: 4,
            replies: 1,
            replyRate: '25.0%',
            nextSend: 'Scheduled',
          },
        ];
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatted),
      };
    }

    if (method === 'POST') {
      const { name, dailyLimit, timezone, status } = JSON.parse(event.body || '{}');
      if (!name) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Name is required' }) };
      }

      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'campaign';
      const id = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

      const campaign = await prisma.campaign.create({
        data: {
          id,
          workspaceId: workspaceId || workspaceIds[0],
          name,
          dailyLimit: dailyLimit || 100,
          timezone: timezone || 'UTC',
          status: status === 'ACTIVE' || status === 'Running' ? 'ACTIVE' : 'DRAFT',
        },
      });

      // Also create an initial sequence for this campaign
      await prisma.sequence.create({
        data: {
          campaignId: id,
          name: 'Primary Cold Sequence',
          status: 'ACTIVE',
          steps: {
            create: [
              {
                stepNumber: 1,
                subject: 'Quick question regarding {{company}} outreach strategy',
                bodyHtml: '<p>Hi {{firstName}},</p><p>Wanted to reach out directly regarding your cold outreach.</p>',
                bodyText: 'Hi {{firstName}}, Wanted to reach out directly regarding your cold outreach.',
                delayDays: 0,
              },
            ],
          },
        },
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      };
    }

    if (method === 'PATCH' || method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      let id = body.id || event.queryStringParameters?.id || event.path.split('/').pop();

      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Campaign ID is required' }) };
      }

      if (isDemo && DEMO_CAMPAIGN_MAP[id]) {
        const mapped = DEMO_CAMPAIGN_MAP[id];
        const checkMapped = await prisma.campaign.findFirst({
          where: { id: mapped, workspaceId: { in: workspaceIds } },
        });
        if (checkMapped) id = mapped;
      }

      // Verify campaign belongs to user's workspace
      let existing = await prisma.campaign.findFirst({
        where: { id, workspaceId: { in: workspaceIds } },
      });

      if (!existing && isDemo) {
        existing = await prisma.campaign.findFirst({
          where: { workspaceId: { in: workspaceIds } },
        });
      }

      if (!existing) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Campaign not found' }),
        };
      }

      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.status) {
        updateData.status = 
          body.status === 'Running' || body.status === 'Active' || body.status === 'ACTIVE' 
            ? 'ACTIVE' 
            : body.status === 'Paused' || body.status === 'PAUSED'
            ? 'PAUSED'
            : 'DRAFT';
      }
      if (body.dailyLimit) updateData.dailyLimit = parseInt(body.dailyLimit);

      const updated = await prisma.campaign.update({
        where: { id: existing.id },
        data: updateData,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      };
    }

    if (method === 'DELETE') {
      let id = event.queryStringParameters?.id || JSON.parse(event.body || '{}').id || event.path.split('/').pop();
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Campaign ID is required' }) };
      }

      if (isDemo && DEMO_CAMPAIGN_MAP[id]) {
        const mapped = DEMO_CAMPAIGN_MAP[id];
        const checkMapped = await prisma.campaign.findFirst({
          where: { id: mapped, workspaceId: { in: workspaceIds } },
        });
        if (checkMapped) id = mapped;
      }

      // Verify campaign belongs to user's workspace
      const existing = await prisma.campaign.findFirst({
        where: { id, workspaceId: { in: workspaceIds } },
      });

      if (!existing) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Campaign not found' }),
        };
      }

      await prisma.campaign.delete({ where: { id: existing.id } });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Campaign deleted' }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Campaigns Handler Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
