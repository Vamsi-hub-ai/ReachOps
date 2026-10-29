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

    // Aggregations from real Prisma DB for user's workspaces
    const activeCampaignsCount = await prisma.campaign.count({
      where: { workspaceId: { in: workspaceIds }, status: 'ACTIVE' },
    });

    const totalCampaignsCount = await prisma.campaign.count({
      where: { workspaceId: { in: workspaceIds } },
    });

    const totalProspectsCount = await prisma.prospect.count({
      where: { campaign: { workspaceId: { in: workspaceIds } } },
    });

    const totalSent = await prisma.message.count({
      where: {
        campaign: { workspaceId: { in: workspaceIds } },
        status: 'SENT',
      },
    });

    const totalOpened = await prisma.message.count({
      where: {
        campaign: { workspaceId: { in: workspaceIds } },
        status: 'OPENED',
      },
    });

    const totalReplied = await prisma.message.count({
      where: {
        campaign: { workspaceId: { in: workspaceIds } },
        status: 'REPLIED',
      },
    });

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) + '%' : '0.0%';
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) + '%' : '0.0%';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeCampaigns: activeCampaignsCount,
        totalCampaigns: totalCampaignsCount,
        totalProspects: totalProspectsCount,
        totalSent,
        totalOpened,
        totalReplied,
        openRate,
        replyRate,
        bounceRate: '0.0%',
        emailsToday: `${totalSent} / 1,000`,
      }),
    };
  } catch (error: any) {
    console.error('Analytics Dashboard Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
