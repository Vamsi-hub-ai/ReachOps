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

    // Fetch the 50 most recent messages across the workspace
    const recentMessages = await prisma.message.findMany({
      where: { campaign: { workspaceId: { in: workspaceIds } } },
      orderBy: { sentAt: 'desc' },
      take: 50,
      include: {
        campaign: { select: { name: true } },
        prospect: { select: { email: true } },
      }
    });

    const formattedLog = recentMessages.map(msg => ({
      id: msg.id,
      timestamp: msg.sentAt,
      description: `Email ${msg.status.toLowerCase()} to ${msg.prospect.email}`,
      campaignName: msg.campaign.name,
      status: msg.status
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: formattedLog }),
    };
  } catch (error: any) {
    console.error('Activity Log Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
