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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceIds, isDemo } = auth;

    const match = event.path.match(/\/campaigns\/([^/]+)/);
    let campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);
    if (!campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'campaignId is required' }) };
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

    let campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } },
    });

    if (!campaign && isDemo) {
      campaign = await prisma.campaign.findFirst({
        where: { workspaceId: { in: workspaceIds } },
      });
    }

    if (!campaign) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campaign not found' }),
      };
    }

    let payload: any = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {}

    // When launching explicitly, set to ACTIVE
    const desiredStatus = payload.status || (payload.action === 'pause' ? 'PAUSED' : 'ACTIVE');

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: desiredStatus },
    });

    if (desiredStatus === 'ACTIVE') {
      await prisma.campaignEnrollment.updateMany({
        where: { campaignId: campaign.id, status: 'PENDING' },
        data: {
          status: 'ACTIVE',
          nextActionAt: new Date(),
        },
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        status: desiredStatus,
        message: `Campaign ${desiredStatus === 'ACTIVE' ? 'launched and active' : 'paused'} successfully`,
      }),
    };
  } catch (error: any) {
    console.error('Campaign Start Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
