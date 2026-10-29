import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

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

    const { workspaceIds } = auth;

    // Extract campaignId from path or query string
    const match = event.path.match(/\/campaigns\/([^/]+)/);
    const campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);

    if (!campaignId) {
      return { 
        statusCode: 400, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'campaignId is required' }) 
      };
    }

    // Verify campaign exists and belongs to user's workspace
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } }
    });

    if (!campaign) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campaign not found' })
      };
    }

    if (method === 'GET') {
      let customSettings: any = {};
      if (campaign?.description && campaign.description.startsWith('{')) {
        try {
          customSettings = JSON.parse(campaign.description);
        } catch {}
      }

      const responseData = {
        campaignId,
        name: campaign.name || campaignId,
        dailyLimit: campaign.dailyLimit || 90,
        timezone: campaign.timezone || 'UTC',
        sendingWindowStart: campaign.sendingWindowStart || '09:00',
        sendingWindowEnd: campaign.sendingWindowEnd || '17:00',
        weekendSendingEnabled: campaign.weekendSendingEnabled || false,
        minGapMinutes: customSettings.minGapMinutes ?? 9,
        randomAdditionalMinutes: customSettings.randomAdditionalMinutes ?? 5,
        maxNewLeadsPerDay: customSettings.maxNewLeadsPerDay ?? 15,
        prioritizeNewLeads: customSettings.prioritizeNewLeads ?? false,
        winningMetric: customSettings.winningMetric || 'Reply Rate',
        providerMatching: customSettings.providerMatching ?? false,
        espRules: customSettings.espRules || [],
        companyReplyStop: customSettings.companyReplyStop ?? true,
        stopOnAutoReply: customSettings.stopOnAutoReply ?? false,
        unsubscribeLinkHeader: customSettings.unsubscribeLinkHeader ?? false,
        enableRiskyEmails: customSettings.enableRiskyEmails ?? false,
        disableBounceProtect: customSettings.disableBounceProtect ?? false,
        overrideCampaignDeliverability: customSettings.overrideCampaignDeliverability ?? false,
        ccRecipients: customSettings.ccRecipients || '',
        bccRecipients: customSettings.bccRecipients || '',
        stopOnReply: customSettings.stopOnReply ?? true,
        openTracking: customSettings.openTracking ?? true,
        linkTracking: customSettings.linkTracking ?? false,
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      };
    }

    if (method === 'PUT' || method === 'POST') {
      const payload = JSON.parse(event.body || '{}');

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          dailyLimit: payload.dailyLimit !== undefined ? Number(payload.dailyLimit) : campaign.dailyLimit,
          timezone: payload.timezone || campaign.timezone,
          sendingWindowStart: payload.fromTime || payload.sendingWindowStart || campaign.sendingWindowStart,
          sendingWindowEnd: payload.toTime || payload.sendingWindowEnd || campaign.sendingWindowEnd,
          description: JSON.stringify(payload)
        }
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Settings saved successfully' }),
      };
    }

    return { statusCode: 400, body: 'Bad Request' };
  } catch (error: any) {
    console.error('Campaign Settings Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
