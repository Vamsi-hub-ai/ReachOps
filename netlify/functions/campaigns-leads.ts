import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceIds } = auth;

    const match = event.path.match(/\/campaigns\/([^/]+)/);
    const campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);

    if (!campaignId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'campaignId is required' }),
      };
    }

    // Verify campaign belongs to user's workspace
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } },
    });

    if (!campaign) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campaign not found' }),
      };
    }

    if (method === 'GET') {
      const prospects = await prisma.prospect.findMany({
        where: { campaignId },
        include: {
          enrollments: true,
          messages: { orderBy: { sentAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      let formatted = prospects.map((p) => {
        const enrollment = p.enrollments[0];
        const lastMsg = p.messages[0];
        const status = p.replied
          ? 'Replied'
          : p.bounced
          ? 'Bounced'
          : lastMsg?.status === 'OPENED'
          ? 'Opened'
          : enrollment?.status === 'ACTIVE'
          ? 'Active'
          : 'Pending';

        return {
          id: p.id,
          name: [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email.split('@')[0],
          email: p.email,
          company: p.company || 'Enterprise Inc',
          status,
          step: `Step ${enrollment?.currentStep || 1}`,
          nextAction: p.replied
            ? 'Replied: Ready for call'
            : status === 'Opened'
            ? 'Wait 2 days before next step'
            : 'Scheduled for outreach',
          deliverability: 'Verified',
        };
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: formatted,
          total: formatted.length,
          active: formatted.filter((l) => l.status === 'Active' || l.status === 'Opened').length,
          replied: formatted.filter((l) => l.status === 'Replied').length,
        }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { email, firstName, lastName, company } = body;

      if (!email) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
      }

      const prospect = await prisma.prospect.create({
        data: {
          campaignId,
          email,
          firstName,
          lastName,
          company,
          status: 'ACTIVE',
        },
      });

      // Enroll in active sequence
      const sequence = await prisma.sequence.findFirst({
        where: { campaignId, status: 'ACTIVE' },
      });

      if (sequence) {
        await prisma.campaignEnrollment.create({
          data: {
            campaignId,
            sequenceId: sequence.id,
            prospectId: prospect.id,
            currentStep: 1,
            status: 'ACTIVE',
            nextActionAt: new Date(),
          },
        });
      }

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospect),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Campaign Leads Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
