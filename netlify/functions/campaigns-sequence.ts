import { Handler } from '@netlify/functions';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const handler: Handler = async (event) => {
  const method = event.httpMethod;
  if (method !== 'GET' && method !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    
    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    const campaignId = event.path.split('/')[3]; // /api/campaigns/[id]/sequence
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
      where: { id: campaignId, workspaceId: { in: workspaceIds } },
      include: { sequence: { include: { steps: { orderBy: { stepNumber: 'asc' } } } } }
    });

    if (!campaign) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Campaign not found' }) };
    }

    if (method === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: campaign.sequence }),
      };
    }

    if (method === 'PUT') {
      const { name, steps } = JSON.parse(event.body || '{}');

      if (!name || !Array.isArray(steps)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payload' }) };
      }

      // Upsert sequence
      const sequence = await prisma.sequence.upsert({
        where: { campaignId },
        create: {
          campaignId,
          name,
        },
        update: {
          name,
        }
      });

      // Transaction to replace all steps
      // 1. Delete existing steps for this sequence
      // 2. Create new steps
      await prisma.$transaction([
        prisma.sequenceStep.deleteMany({
          where: { sequenceId: sequence.id }
        }),
        prisma.sequenceStep.createMany({
          data: steps.map((step: any, index: number) => ({
            sequenceId: sequence.id,
            stepNumber: index + 1, // Enforce correct ordering
            subject: step.subject || '',
            bodyText: step.bodyText || '',
            bodyHtml: step.bodyHtml || '',
            delayDays: parseInt(step.delayDays) || 1,
          }))
        })
      ]);

      // Fetch the newly updated sequence
      const updatedSequence = await prisma.sequence.findUnique({
        where: { id: sequence.id },
        include: { steps: { orderBy: { stepNumber: 'asc' } } }
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: updatedSequence }),
      };
    }

  } catch (error: any) {
    console.error('Sequence API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }

  return { statusCode: 400, body: 'Bad Request' };
};
