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

    // Fetch recent messages across the user's workspaces
    const recentMessages = await prisma.message.findMany({
      where: { campaign: { workspaceId: { in: workspaceIds } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        campaign: { select: { name: true } },
        prospect: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    const formattedLog = recentMessages.map((msg) => ({
      id: msg.id,
      timestamp: (msg.sentAt || msg.createdAt).toISOString(),
      description: `Email ${msg.status.toLowerCase()} to ${msg.prospect?.email || 'prospect'}`,
      campaignName: msg.campaign?.name || 'Outreach',
      status: msg.status,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: formattedLog }),
    };
  } catch (error: any) {
    console.error('Activity Log Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
