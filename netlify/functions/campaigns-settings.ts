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

    const { workspaceIds, isDemo } = auth;

    // Extract campaignId from path or query string
    const match = event.path.match(/\/campaigns\/([^/]+)/);
    let campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);

    if (!campaignId) {
      return { 
        statusCode: 400, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'campaignId is required' }) 
      };
    }

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
      where: { id: campaignId, workspaceId: { in: workspaceIds } }
    });

    if (!campaign && isDemo) {
      campaign = await prisma.campaign.findFirst({
        where: { workspaceId: { in: workspaceIds } }
      });
    }

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
        campaignId: campaign.id,
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
        selectedAccounts: customSettings.selectedAccounts || [],
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      };
    }

    if (method === 'PUT' || method === 'POST') {
      let payload: any = {};
      try {
        payload = JSON.parse(event.body || '{}');
      } catch {}

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
