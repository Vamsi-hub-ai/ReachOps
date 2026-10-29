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

    let activeCampaignsCount = 0;
    let totalCampaignsCount = 0;
    let totalProspectsCount = 0;
    let totalSent = 0;
    let totalOpened = 0;
    let totalReplied = 0;

    try {
      // Aggregations from real Prisma DB for user's workspaces
      activeCampaignsCount = await prisma.campaign.count({
        where: { workspaceId: { in: workspaceIds }, status: 'ACTIVE' },
      });

      totalCampaignsCount = await prisma.campaign.count({
        where: { workspaceId: { in: workspaceIds } },
      });

      totalProspectsCount = await prisma.prospect.count({
        where: { campaign: { workspaceId: { in: workspaceIds } } },
      });

      totalSent = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: 'SENT',
        },
      });

      totalOpened = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: 'OPENED',
        },
      });

      totalReplied = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: 'REPLIED',
        },
      });
    } catch (dbErr: any) {
      console.warn('Analytics DB lookup failed:', dbErr?.message);
    }

    if (totalCampaignsCount === 0 && auth.isDemo) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeCampaigns: 4,
          totalCampaigns: 5,
          totalProspects: 1840,
          totalSent: 1420,
          totalOpened: 890,
          totalReplied: 312,
          openRate: '62.7%',
          replyRate: '22.0%',
          bounceRate: '0.4%',
          emailsToday: '142 / 1,000',
        }),
      };
    }

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
