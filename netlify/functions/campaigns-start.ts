import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceIds } = auth;

    const match = event.path.match(/\/campaigns\/([^/]+)/);
    const campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);
    if (!campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'campaignId is required' }) };
    }

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

    // Toggle or start campaign
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: newStatus },
    });

    if (newStatus === 'ACTIVE') {
      await prisma.campaignEnrollment.updateMany({
        where: { campaignId, status: 'PENDING' },
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
        status: newStatus,
        message: `Campaign ${newStatus === 'ACTIVE' ? 'started' : 'paused'} successfully`,
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
