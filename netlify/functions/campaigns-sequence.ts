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
  const method = event.httpMethod;
  if (method !== 'GET' && method !== 'PUT' && method !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceId, workspaceIds, isDemo } = auth;

    const match = event.path.match(/\/campaigns\/([^/]+)/);
    let campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);

    if (!campaignId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'campaignId is required' }),
      };
    }

    // Resolve mapped demo campaigns if needed
    if (isDemo && DEMO_CAMPAIGN_MAP[campaignId]) {
      const mapped = DEMO_CAMPAIGN_MAP[campaignId];
      const checkMapped = await prisma.campaign.findFirst({
        where: { id: mapped, workspaceId: { in: workspaceIds } },
      });
      if (checkMapped) {
        campaignId = mapped;
      }
    }

    // Verify campaign exists and belongs to user's workspace
    let campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } },
    });

    // Resilient fallback for demo workspace: auto-provision campaign if missing
    if (!campaign && isDemo) {
      campaign = await prisma.campaign.findFirst({
        where: { workspaceId: { in: workspaceIds } },
      });

      if (!campaign) {
        campaign = await prisma.campaign.create({
          data: {
            id: campaignId,
            name: campaignId.startsWith('demo-') ? `[DEMO] Campaign ${campaignId}` : campaignId,
            workspaceId: workspaceId || workspaceIds[0],
            status: 'ACTIVE',
            dailyLimit: 100,
          },
        });
      }
    }

    if (!campaign) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campaign not found' }),
      };
    }

    let sequence = await prisma.sequence.findFirst({
      where: { campaignId: campaign.id },
      include: { steps: { orderBy: { stepNumber: 'asc' } } }
    });

    if (!sequence) {
      sequence = await prisma.sequence.create({
        data: {
          campaignId: campaign.id,
          name: `${campaign.name} Sequence`,
          status: 'ACTIVE',
          steps: {
            create: [
              {
                stepNumber: 1,
                delayDays: 0,
                delayHours: 0,
                delayMinutes: 0,
                subject: 'Quick question regarding {{company}} outreach strategy',
                bodyHtml: '<p>Hi {{firstName}},</p><p>Saw what your team is building at {{company}}. Reaching out as we help B2B sales leaders eliminate spam folder landing. Are you free for a brief chat?</p><p>{{accountSignature}}</p>',
                bodyText: 'Hi {{firstName}},\n\nSaw what your team is building at {{company}}. Reaching out as we help B2B sales leaders eliminate spam folder landing. Are you free for a brief chat?\n\n{{accountSignature}}',
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

    if (method === 'PUT' || method === 'POST') {
      let bodyData: any = {};
      try {
        bodyData = JSON.parse(event.body || '{}');
      } catch {
        bodyData = {};
      }

      const { name, steps } = bodyData;

      if (sequence) {
        if (name) {
          sequence = await prisma.sequence.update({
            where: { id: sequence.id },
            data: { name },
            include: { steps: true }
          });
        }

        if (Array.isArray(steps) && steps.length > 0) {
          // 1. Remove steps beyond the new length so deletions properly persist
          await prisma.sequenceStep.deleteMany({
            where: {
              sequenceId: sequence.id,
              stepNumber: { gt: steps.length }
            }
          });

          // 2. Upsert each step
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepNum = i + 1;
            const existingStep = sequence.steps.find(s => s.stepNumber === stepNum);

            const subject = step.subject ?? (existingStep?.subject || `Step ${stepNum}`);
            const bodyHtml = step.bodyHtml ?? (step.body ? `<p>${step.body.replace(/\n/g, '<br/>')}</p>` : (existingStep?.bodyHtml || ''));
            const bodyText = step.bodyText ?? (step.body ? step.body.replace(/<[^>]+>/g, '') : (existingStep?.bodyText || ''));
            const delayDays = step.delayDays !== undefined ? Number(step.delayDays) : (existingStep?.delayDays ?? (i === 0 ? 0 : 2));
            const delayHours = step.delayHours !== undefined ? Number(step.delayHours) : (existingStep?.delayHours ?? 0);
            const delayMinutes = step.delayMinutes !== undefined ? Number(step.delayMinutes) : (existingStep?.delayMinutes ?? 0);

            if (existingStep) {
              await prisma.sequenceStep.update({
                where: { id: existingStep.id },
                data: {
                  subject,
                  bodyHtml,
                  bodyText,
                  delayDays,
                  delayHours,
                  delayMinutes,
                  enabled: step.enabled !== undefined ? Boolean(step.enabled) : true,
                }
              });
            } else {
              await prisma.sequenceStep.create({
                data: {
                  sequenceId: sequence.id,
                  stepNumber: stepNum,
                  subject,
                  bodyHtml,
                  bodyText,
                  delayDays,
                  delayHours,
                  delayMinutes,
                  enabled: true,
                }
              });
            }
          }

          // Fetch fresh sequence
          sequence = await prisma.sequence.findUnique({
            where: { id: sequence.id },
            include: { steps: { orderBy: { stepNumber: 'asc' } } }
          }) || sequence;
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          message: 'Sequence updated successfully',
          sequence
        }),
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
