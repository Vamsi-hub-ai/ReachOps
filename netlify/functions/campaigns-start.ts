import { Handler } from '@netlify/functions';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    
    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    const campaignId = event.path.split('/')[3]; // /api/campaigns/[id]/start
    if (!campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'campaignId is required' }) };
    }

    // Verify user has access to campaign
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });
    
    const workspaceIds = user?.workspaceMembers.map(m => m.workspaceId) || [];
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } }
    });

    if (!campaign) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Campaign not found' }) };
    }

    // Update Campaign Status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' }
    });

    // Optionally: also set all PENDING enrollments' nextSendTime to NOW so the cron picks them up immediately.
    await prisma.campaignEnrollment.updateMany({
      where: { campaignId, status: 'PENDING' },
      data: { 
        status: 'ACTIVE',
        nextSendTime: new Date()
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Campaign started successfully' }),
    };
  } catch (error: any) {
    console.error('Campaign Start Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
