import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  const method = event.httpMethod;
  if (method !== 'GET' && method !== 'PUT') {
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
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'campaignId is required' }),
      };
    }

    // Verify campaign exists and belongs to user's workspace
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

    let sequence = await prisma.sequence.findFirst({
      where: { campaignId },
      include: { steps: { orderBy: { stepNumber: 'asc' } } }
    });

    if (!sequence) {
      sequence = await prisma.sequence.create({
        data: {
          campaignId,
          name: `${campaign.name} Sequence`,
          status: 'ACTIVE',
          steps: {
            create: [
              {
                stepNumber: 1,
                delayDays: 0,
                subject: 'Quick question about {{company}} B2B pipeline',
                bodyHtml: '<p>Hi {{firstName}},</p><p>Saw what your team is building at {{company}}.</p>',
                bodyText: 'Hi {{firstName}},\n\nSaw what your team is building at {{company}}.',
              }
            ]
          }
        },
        include: { steps: { orderBy: { stepNumber: 'asc' } } }
      });
    }

    if (method === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence }),
      };
    }

    if (method === 'PUT') {
      const { name, steps } = JSON.parse(event.body || '{}');

      if (sequence) {
        if (name) {
          sequence = await prisma.sequence.update({
            where: { id: sequence.id },
            data: { name },
            include: { steps: true }
          });
        }

        if (Array.isArray(steps)) {
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const existingStep = sequence.steps.find(s => s.stepNumber === i + 1);
            if (existingStep) {
              await prisma.sequenceStep.update({
                where: { id: existingStep.id },
                data: {
                  subject: step.subject || existingStep.subject,
                  bodyHtml: step.bodyHtml || existingStep.bodyHtml,
                  bodyText: step.bodyText || existingStep.bodyText,
                  delayDays: step.delayDays !== undefined ? step.delayDays : existingStep.delayDays,
                }
              });
            } else {
              await prisma.sequenceStep.create({
                data: {
                  sequenceId: sequence.id,
                  stepNumber: i + 1,
                  subject: step.subject || 'Step ' + (i + 1),
                  bodyHtml: step.bodyHtml || '<p>Follow-up</p>',
                  bodyText: step.bodyText || 'Follow-up',
                  delayDays: step.delayDays || 2,
                }
              });
            }
          }
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Sequence updated successfully' }),
      };
    }

    return { statusCode: 400, body: 'Bad Request' };
  } catch (error: any) {
    console.error('Campaign Sequence Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
