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

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceIds, isDemo } = auth;

    const match = event.path.match(/\/campaigns\/([^/]+)/);
    let campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);

    if (method === 'GET' && (campaignId === 'all' || event.queryStringParameters?.all === 'true')) {
      const prospects = await prisma.prospect.findMany({
        where: { campaign: { workspaceId: { in: workspaceIds } } },
        include: {
          campaign: { select: { id: true, name: true } },
          enrollments: { select: { status: true, currentStep: true, nextActionAt: true, lastSentAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: prospects.map((p) => {
            const enrollment = p.enrollments[0];
            return {
              id: p.id,
              name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email.split('@')[0],
              email: p.email,
              company: p.company || 'Unknown',
              title: p.jobTitle || 'Executive',
              status: p.replied ? 'Replied' : p.bounced ? 'Bounced' : p.unsubscribe ? 'Unsubscribed' : p.status,
              campaign: p.campaign?.name || 'Campaign',
              step: enrollment ? `Step ${enrollment.currentStep}` : 'Step 1',
              lastContact: enrollment?.lastSentAt ? new Date(enrollment.lastSentAt).toLocaleDateString() : 'New',
            };
          }),
        }),
      };
    }

    if (!campaignId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'campaignId is required' }),
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

    // Verify campaign belongs to user's workspace
    let campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } },
      include: { sheet: true },
    });

    if (!campaign && isDemo) {
      campaign = await prisma.campaign.findFirst({
        where: { workspaceId: { in: workspaceIds } },
        include: { sheet: true },
      });
    }

    if (!campaign) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campaign not found' }),
      };
    }

    const cId = campaign.id;

    if (method === 'GET') {
      const prospects = await prisma.prospect.findMany({
        where: { campaignId: cId },
        include: {
          enrollments: true,
          messages: { orderBy: { sentAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      let formatted = prospects.map((p) => {
        const lastMsg = p.messages[0];
        const enr = p.enrollments?.[0];
        let status = p.status || 'New';
        if (p.replied) status = 'Replied';
        else if (p.bounced) status = 'Bounced';
        else if (lastMsg?.status === 'SENT') status = 'Contacted';
        else if (lastMsg?.status === 'OPENED') status = 'Opened';

        let followupStatus = enr?.status || (p.replied || p.bounced ? 'STOPPED' : 'ACTIVE');
        if (p.replied || p.bounced) followupStatus = 'STOPPED';

        const tag = ['Lead', 'Warm', 'Cold', 'Interested', 'DNC', 'Invalid Contact'].includes(p.status) ? p.status : null;

        return {
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Anonymous Lead',
          email: p.email,
          title: p.jobTitle || 'Executive',
          company: p.company || 'Enterprise Prospect',
          status,
          followupStatus,
          nextActionAt: enr?.nextActionAt ? new Date(enr.nextActionAt).toLocaleString() : null,
          stopReason: enr?.stopReason || null,
          step: followupStatus === 'PAUSED' ? 'Follow-up Halted' 
              : followupStatus === 'SCHEDULED' ? 'Scheduled Follow-up' 
              : followupStatus === 'STOPPED' ? 'Sequence Stopped' 
              : 'Step 1 Queued',
          tag,
          tags: tag ? [tag] : [],
          externalRowId: p.externalRowId || null,
          unsubscribe: Boolean(p.unsubscribe),
          bounced: Boolean(p.bounced),
          replied: Boolean(p.replied),
          score: p.bounced ? 0 : p.replied ? 95 : 85,
          validation: p.bounced ? 'Risky' : 'Verified',
          lastActivity: lastMsg ? new Date(lastMsg.sentAt).toLocaleDateString() : 'Enrolled',
        };
      });

      if (formatted.length === 0 && isDemo) {
        formatted = [
          {
            id: 'lead-1',
            name: 'Sarah Connor',
            email: 'sarah@acme-corp.com',
            title: 'VP of Product',
            company: 'Acme Corp',
            status: 'Replied',
            score: 95,
            validation: 'Verified',
            lastActivity: 'Today, 11:20 am',
          },
          {
            id: 'lead-2',
            name: 'John Miller',
            email: 'j.miller@stripe.com',
            title: 'Head of Growth',
            company: 'Stripe',
            status: 'Opened',
            score: 88,
            validation: 'Verified',
            lastActivity: 'Yesterday',
          },
          {
            id: 'lead-3',
            name: 'Elena Rostova',
            email: 'elena@datadog.com',
            title: 'Director of Marketing',
            company: 'Datadog',
            status: 'Contacted',
            score: 79,
            validation: 'Verified',
            lastActivity: '2 days ago',
          },
          {
            id: 'lead-4',
            name: 'David Kim',
            email: 'david@figma.com',
            title: 'Growth Lead',
            company: 'Figma',
            status: 'Enrolled',
            score: 82,
            validation: 'Verified',
            lastActivity: '3 days ago',
          },
        ];
      }

      const activeCount = formatted.filter(l => l.followupStatus === 'ACTIVE' || l.status === 'Contacted' || l.status === 'Opened').length;
      const pausedCount = formatted.filter(l => l.followupStatus === 'PAUSED').length;
      const scheduledCount = formatted.filter(l => l.followupStatus === 'SCHEDULED').length;
      const stoppedCount = formatted.filter(l => l.followupStatus === 'STOPPED' || l.status === 'Replied' || l.status === 'Bounced').length;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leads: formatted,
          total: formatted.length,
          active: activeCount,
          paused: pausedCount,
          scheduled: scheduledCount,
          stopped: stoppedCount,
          sheetInfo: campaign.sheet ? {
            spreadsheetId: campaign.sheet.spreadsheetId,
            sheetName: campaign.sheet.sheetName,
            lastSyncedAt: campaign.sheet.lastSyncedAt ? new Date(campaign.sheet.lastSyncedAt).toISOString() : null,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${campaign.sheet.spreadsheetId}/edit`,
          } : null,
        }),
      };
    }

    if (method === 'POST' || method === 'PATCH') {
      let bodyData: any = {};
      try {
        bodyData = JSON.parse(event.body || '{}');
      } catch {}

      const { action, prospectId, status, tag } = bodyData;

      // Handle Tag Application / Pause in Campaign Leads view
      if (action === 'apply_tag' || action === 'mark_lead') {
        const appliedTag = tag || status || 'Lead';
        const isDnc = ['DNC', 'INVALID CONTACT'].some(t => appliedTag.toUpperCase().includes(t));

        await prisma.prospect.update({
          where: { id: prospectId },
          data: {
            status: appliedTag,
            unsubscribe: isDnc ? true : undefined,
          },
        });

        const newEnrStatus = isDnc ? 'STOPPED' : 'PAUSED';
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId },
          data: {
            status: newEnrStatus,
            stopReason: isDnc 
              ? `Sequence stopped: Prospect tagged as ${appliedTag} (Suppression).`
              : `Follow-ups paused: Prospect tagged as ${appliedTag}.`,
            nextActionAt: null,
          },
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            status: appliedTag,
            followupStatus: newEnrStatus,
            message: `Prospect tagged as ${appliedTag}. Automated follow-ups ${newEnrStatus.toLowerCase()}.`,
          }),
        };
      }

      // Handle Manual Schedule Next Follow-up
      if (action === 'schedule_follow_up') {
        const targetProspect = await prisma.prospect.findUnique({ where: { id: prospectId } });
        if (!targetProspect) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Prospect not found' }) };
        }

        if (targetProspect.unsubscribe || targetProspect.bounced || targetProspect.replied) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Cannot schedule follow-up: Prospect is unsubscribed, permanently bounced, or replied.' }),
          };
        }

        const { scheduledDate, notes } = bodyData;
        const targetDate = scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 86400000 * 3);

        await prisma.campaignEnrollment.updateMany({
          where: { prospectId },
          data: {
            status: 'SCHEDULED',
            nextActionAt: targetDate,
            stopReason: `Explicitly scheduled follow-up for ${targetDate.toISOString()}${notes ? ` (Note: ${notes})` : ''}`,
          },
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            status: 'Scheduled',
            followupStatus: 'SCHEDULED',
            scheduledDate: targetDate.toISOString(),
            message: `Next follow-up scheduled for ${targetDate.toLocaleString()}.`,
          }),
        };
      }

      // Handle Pause Sequence
      if (action === 'pause_sequence') {
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId },
          data: {
            status: 'PAUSED',
            stopReason: 'Manually paused by user',
            nextActionAt: null,
          },
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            followupStatus: 'PAUSED',
            message: 'Follow-up sequence paused for prospect.',
          }),
        };
      }

      // Handle Unsubscribe Prospect
      if (action === 'unsubscribe_prospect') {
        await prisma.prospect.update({
          where: { id: prospectId },
          data: { unsubscribe: true },
        });

        await prisma.campaignEnrollment.updateMany({
          where: { prospectId },
          data: {
            status: 'STOPPED',
            stopReason: 'Recipient marked as unsubscribed',
            nextActionAt: null,
          },
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            followupStatus: 'STOPPED',
            message: 'Prospect marked as unsubscribed. Sequence permanently stopped.',
          }),
        };
      }

      // Handle Tag Removal
      if (action === 'remove_tag') {
        await prisma.prospect.update({
          where: { id: prospectId },
          data: { status: 'New' },
        });

        // RULE: Automated follow-ups REMAIN PAUSED!
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId },
          data: {
            status: 'PAUSED',
            stopReason: 'Tag removed. Follow-up sequence remains paused until explicitly resumed.',
            nextActionAt: null,
          },
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            status: 'New',
            followupStatus: 'PAUSED',
            message: 'Tag removed. Automated sequence remains paused.',
          }),
        };
      }

      // Handle Resume
      if (action === 'resume_sequence') {
        const targetProspect = await prisma.prospect.findUnique({ where: { id: prospectId } });
        if (!targetProspect) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Prospect not found' }) };
        }

        if (targetProspect.unsubscribe || targetProspect.bounced || targetProspect.replied) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Cannot resume: Contact is unsubscribed, bounced, or replied.' }),
          };
        }

        await prisma.campaignEnrollment.updateMany({
          where: { prospectId },
          data: {
            status: 'ACTIVE',
            stopReason: null,
            nextActionAt: new Date(),
          },
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            followupStatus: 'ACTIVE',
            message: 'Automated sequence resumed.',
          }),
        };
      }

      const { email, firstName, lastName, company, jobTitle } = bodyData;
      if (!email) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Email is required' }),
        };
      }

      const prospect = await prisma.prospect.create({
        data: {
          campaignId: cId,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          company: company || null,
          jobTitle: jobTitle || null,
          status: 'NEW',
        },
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, prospect }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Campaign Leads Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
