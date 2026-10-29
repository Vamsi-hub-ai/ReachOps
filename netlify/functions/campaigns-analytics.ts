import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

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
      include: {
        sequences: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    if (!campaign) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campaign not found' }),
      };
    }

    const totalEnrolled = await prisma.campaignEnrollment.count({ where: { campaignId } });
    const totalSent = await prisma.message.count({ where: { campaignId, status: 'SENT' } });
    const totalOpened = await prisma.message.count({ where: { campaignId, status: 'OPENED' } });
    const totalClicked = await prisma.message.count({ where: { campaignId, status: 'CLICKED' } });
    const totalReplied = await prisma.message.count({ where: { campaignId, status: 'REPLIED' } });
    const totalBounced = await prisma.message.count({ where: { campaignId, status: 'BOUNCED' } });

    // Build step metrics
    const stepsList = campaign?.sequences?.[0]?.steps || [];
    let formattedSteps: any[] = [];

    if (stepsList.length > 0) {
      formattedSteps = await Promise.all(
        stepsList.map(async (step) => {
          const stepSent = await prisma.message.count({
            where: { sequenceStepId: step.id, status: 'SENT' },
          });
          const stepOpened = await prisma.message.count({
            where: { sequenceStepId: step.id, status: 'OPENED' },
          });
          const stepReplied = await prisma.message.count({
            where: { sequenceStepId: step.id, status: 'REPLIED' },
          });

          const sRate = stepSent > 0 ? ((stepReplied / stepSent) * 100).toFixed(1) + '%' : '0%';

          return {
            id: `step-${step.stepNumber}`,
            name: `Step ${step.stepNumber}`,
            subject: step.subject,
            sent: stepSent,
            opened: stepOpened,
            replied: stepReplied,
            replyRate: stepSent > 0 ? sRate : '-',
            posReplyRate: '-',
            opps: 0,
            meetings: 0,
            won: 0,
          };
        })
      );
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        campaignName: campaign?.name || 'Campaign Outreach',
        enrolled: totalEnrolled,
        sent: totalSent,
        opened: totalOpened,
        clicked: totalClicked,
        replied: totalReplied,
        bounced: totalBounced,
        openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) + '%' : '0.0%',
        replyRate: totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) + '%' : '0.0%',
        steps: formattedSteps,
      }),
    };
  } catch (error: any) {
    console.error('Campaign Analytics Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
