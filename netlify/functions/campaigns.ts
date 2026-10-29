import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceId, workspaceIds } = auth;

    if (method === 'GET') {
      const campaigns = await prisma.campaign.findMany({
        where: { workspaceId: { in: workspaceIds } },
        include: {
          prospects: { select: { id: true } },
          messages: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = campaigns.map((c) => {
        const sent = c.messages.filter((m) => m.status === 'SENT').length;
        const replies = c.messages.filter((m) => m.status === 'REPLIED').length;
        const rate = sent > 0 ? ((replies / sent) * 100).toFixed(1) + '%' : '0%';

        return {
          id: c.id,
          name: c.name,
          status: c.status === 'ACTIVE' ? 'Running' : c.status === 'DRAFT' ? 'Draft' : 'Paused',
          created: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          prospects: c.prospects.length,
          sent: sent,
          replies: replies,
          replyRate: rate,
          nextSend: c.status === 'ACTIVE' ? 'Today, 14:00 (Rotated)' : 'Scheduled',
        };
      });

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
          workspaceId,
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
                subject: 'Quick question for {{company}}',
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
      const id = body.id || event.queryStringParameters?.id || event.path.split('/').pop();

      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Campaign ID is required' }) };
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
        where: { id },
        data: updateData,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      };
    }

    if (method === 'DELETE') {
      const id = event.queryStringParameters?.id || JSON.parse(event.body || '{}').id || event.path.split('/').pop();
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Campaign ID is required' }) };
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

      await prisma.campaign.delete({
        where: { id },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: `Campaign ${id} deleted` }),
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
