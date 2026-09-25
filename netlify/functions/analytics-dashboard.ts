import { Handler } from '@netlify/functions';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    
    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });
    
    const workspaceIds = user?.workspaceMembers.map(m => m.workspaceId) || [];

    // Aggregations
    const activeCampaignsCount = await prisma.campaign.count({
      where: { workspaceId: { in: workspaceIds }, status: 'ACTIVE' }
    });

    const totalProspectsCount = await prisma.prospect.count({
      where: { workspaceId: { in: workspaceIds } }
    });

    const totalSent = await prisma.message.count({
      where: {
        campaign: { workspaceId: { in: workspaceIds } },
        status: 'SENT'
      }
    });

    const totalOpened = await prisma.message.count({
      where: {
        campaign: { workspaceId: { in: workspaceIds } },
        status: 'OPENED'
      }
    });

    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeCampaigns: activeCampaignsCount,
        totalProspects: totalProspectsCount,
        totalSent,
        openRate
      }),
    };
  } catch (error: any) {
    console.error('Analytics Dashboard Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
