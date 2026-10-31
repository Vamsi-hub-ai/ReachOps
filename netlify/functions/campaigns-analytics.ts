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
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceIds, isDemo } = auth;

    const match = event.path.match(/\/campaigns\/([^/]+)/);
    let campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);

    if (!campaignId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'campaignId is required' }),
      };
    }

    if (isDemo && DEMO_CAMPAIGN_MAP[campaignId]) {
      const mapped = DEMO_CAMPAIGN_MAP[campaignId];
      const checkMapped = await prisma.campaign.findFirst({
        where: { id: mapped, workspaceId: { in: workspaceIds } },
      });
      if (checkMapped) {
        campaignId = mapped;
      }
    }

    // Verify campaign belongs to user's workspace
    let campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } },
      include: {
        sequences: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    if (!campaign && isDemo) {
      campaign = await prisma.campaign.findFirst({
        where: { workspaceId: { in: workspaceIds } },
        include: {
          sequences: {
            include: {
              steps: { orderBy: { stepNumber: 'asc' } },
            },
          },
        },
      });
    }

    if (!campaign) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campaign not found' }),
      };
    }

    const cId = campaign.id;
    const totalEnrolled = await prisma.campaignEnrollment.count({ where: { campaignId: cId } });
    const totalSent = await prisma.message.count({ where: { campaignId: cId, status: 'SENT' } });
    const totalOpened = await prisma.message.count({ where: { campaignId: cId, status: 'OPENED' } });
    const totalClicked = await prisma.message.count({ where: { campaignId: cId, status: 'CLICKED' } });
    const totalReplied = await prisma.message.count({ where: { campaignId: cId, status: 'REPLIED' } });
    const totalBounced = await prisma.message.count({ where: { campaignId: cId, status: 'BOUNCED' } });

    // Build step metrics
    const stepsList = campaign?.sequences?.[0]?.steps || [];
    let formattedSteps: any[] = [];

    if (stepsList.length > 0) {
      formattedSteps = await Promise.all(
        stepsList.map(async (step, idx) => {
          const stepSent = await prisma.message.count({
            where: { campaignId: cId, sequenceStepId: step.id, status: 'SENT' },
          });
          const stepOpened = await prisma.message.count({
            where: { campaignId: cId, sequenceStepId: step.id, status: 'OPENED' },
          });
          const stepReplied = await prisma.message.count({
            where: { campaignId: cId, sequenceStepId: step.id, status: 'REPLIED' },
          });

          return {
            stepNumber: step.stepNumber || idx + 1,
            subject: step.subject,
            sent: stepSent,
            opened: stepOpened,
            replied: stepReplied,
            openRate: stepSent > 0 ? ((stepOpened / stepSent) * 100).toFixed(1) + '%' : '0%',
            replyRate: stepSent > 0 ? ((stepReplied / stepSent) * 100).toFixed(1) + '%' : '0%',
          };
        })
      );
    }

    const response = {
      campaignId: cId,
      campaignName: campaign.name,
      status: campaign.status,
      metrics: {
        enrolled: totalEnrolled || (isDemo ? 30 : 0),
        sent: totalSent || (isDemo ? 14 : 0),
        opened: totalOpened || (isDemo ? 12 : 0),
        clicked: totalClicked || (isDemo ? 6 : 0),
        replied: totalReplied || (isDemo ? 11 : 0),
        bounced: totalBounced || 0,
        openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) + '%' : (isDemo ? '85.7%' : '0%'),
        replyRate: totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) + '%' : (isDemo ? '78.6%' : '0%'),
        clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) + '%' : (isDemo ? '42.9%' : '0%'),
      },
      steps: formattedSteps.length > 0 ? formattedSteps : [
        {
          stepNumber: 1,
          subject: 'Initial Outreach',
          sent: isDemo ? 14 : 0,
          opened: isDemo ? 12 : 0,
          replied: isDemo ? 11 : 0,
          openRate: isDemo ? '85.7%' : '0%',
          replyRate: isDemo ? '78.6%' : '0%',
        }
      ],
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
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
