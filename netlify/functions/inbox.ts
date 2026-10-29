import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceIds } = auth;

    // Extract campaignId from path (/api/campaigns/:id/inbox) or query (?campaignId=...)
    const eventPath = event.path || '';
    const pathMatch = eventPath.match(/\/campaigns\/([^/]+)/);
    const campaignId = pathMatch ? pathMatch[1] : (event.queryStringParameters?.campaignId || event.queryStringParameters?.id);
    const filter = event.queryStringParameters?.filter || 'All';
    const search = event.queryStringParameters?.search?.toLowerCase() || '';

    if (method === 'GET') {
      const whereClause: any = {
        campaign: { workspaceId: { in: workspaceIds } }
      };

      if (campaignId && campaignId !== 'all' && campaignId !== 'All Campaigns') {
        whereClause.campaignId = campaignId;
      }

      // We look for prospects with interactions or replies
      const prospects = await prisma.prospect.findMany({
        where: {
          ...whereClause,
          OR: [
            { replied: true },
            { status: { in: ['Replied', 'REPLIED', 'Opened', 'Lead', 'Warm'] } },
            { messages: { some: { status: { in: ['REPLIED', 'OPENED', 'SENT'] } } } },
          ]
        },
        include: {
          campaign: { select: { id: true, name: true } },
          enrollments: { take: 1, orderBy: { createdAt: 'desc' } },
          messages: {
            include: { sequenceStep: true, events: true },
            orderBy: { sentAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      let threads = prospects.map((p) => {
        const lastMsg = p.messages[0];
        const step = lastMsg?.sequenceStep;
        const replyEvent = lastMsg?.events?.find(e => e.eventType === 'REPLY');
        let parsedReplyData: any = {};
        if (replyEvent?.eventDataJson) {
          try {
            parsedReplyData = JSON.parse(replyEvent.eventDataJson);
          } catch {}
        }

        const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email.split('@')[0];
        const company = p.company || 'Enterprise';
        const title = p.jobTitle || 'Decision Maker';

        // Outbound email body
        const outboundSubject = lastMsg?.subject || step?.subject?.replace('{{company}}', company) || `Quick question regarding ${company} pipeline`;
        const outboundBody = step?.bodyText || (step?.bodyHtml ? step.bodyHtml.replace(/<[^>]+>/g, '') : `Hi ${p.firstName || 'there'},\n\nNoticed what your team is doing at ${company}.\n\nWould you be open to a 10-minute chat this week?`);

        // Inbound reply body
        const defaultReply = `Hi, thanks for reaching out. Yes, we are actively looking into this. Can you share more details or send a calendar link for next week?`;
        const replyBody = parsedReplyData.replyText || defaultReply;
        const tag = parsedReplyData.replyTag || (p.status === 'Warm' ? 'Warm' : p.bounced ? 'Bounced' : 'Positive');

        const repliedDate = parsedReplyData.repliedAt ? new Date(parsedReplyData.repliedAt) : new Date(p.updatedAt);
        const timeStr = repliedDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + repliedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const history = [
          {
            sender: 'You',
            time: lastMsg?.sentAt ? new Date(lastMsg.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Yesterday, 09:30 AM',
            body: outboundBody,
          },
          {
            sender: name,
            time: timeStr,
            body: replyBody,
          }
        ];

        return {
          id: p.id,
          prospectId: p.id,
          campaignId: p.campaignId,
          campaignName: p.campaign?.name || 'Outreach Campaign',
          name,
          email: p.email,
          company,
          title,
          time: timeStr,
          subject: outboundSubject.startsWith('Re:') ? outboundSubject : `Re: ${outboundSubject}`,
          snippet: replyBody.slice(0, 95) + (replyBody.length > 95 ? '...' : ''),
          tag,
          unread: true,
          step: `Step ${p.enrollments[0]?.currentStep || 1}`,
          status: p.status || 'Replied',
          history,
        };
      });

      // Filter by tag if selected
      if (filter && filter !== 'All') {
        threads = threads.filter(t => {
          if (filter === 'Unread') return t.unread;
          if (filter === 'Replied') return t.tag === 'Positive' || t.tag === 'Meeting' || t.tag === 'Interested' || t.tag === 'Question';
          if (filter === 'Bounced') return t.tag === 'Bounced';
          return true;
        });
      }

      // Filter by search query
      if (search) {
        threads = threads.filter(t =>
          t.name.toLowerCase().includes(search) ||
          t.email.toLowerCase().includes(search) ||
          t.company.toLowerCase().includes(search) ||
          t.subject.toLowerCase().includes(search) ||
          t.snippet.toLowerCase().includes(search)
        );
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId || null,
          total: threads.length,
          threads,
        }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action, prospectId, replyText, status } = body;

      if (!prospectId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'prospectId is required' }),
        };
      }

      // Verify prospect belongs to user's workspace
      const prospect = await prisma.prospect.findFirst({
        where: { id: prospectId, campaign: { workspaceId: { in: workspaceIds } } }
      });

      if (!prospect) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Prospect not found' }),
        };
      }

      if (action === 'reply' && replyText) {
        const emailAccount = await prisma.emailAccount.findFirst({
          where: { workspaceId: { in: workspaceIds } }
        });

        // Ensure a valid sequence step id
        const firstStep = await prisma.sequenceStep.findFirst({
          where: { sequence: { campaignId: prospect.campaignId } }
        });

        if (emailAccount && firstStep) {
          await prisma.message.create({
            data: {
              campaignId: prospect.campaignId,
              prospectId: prospect.id,
              emailAccountId: emailAccount.id,
              sequenceStepId: firstStep.id,
              subject: `Re: Conversation with ${prospect.company || 'Enterprise'}`,
              status: 'SENT',
              sentAt: new Date(),
            }
          });
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: {
              sender: 'You',
              time: 'Just now',
              body: replyText,
            }
          }),
        };
      }

      if (action === 'mark_lead') {
        await prisma.prospect.update({
          where: { id: prospect.id },
          data: { status: status || 'Lead' }
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, status }),
        };
      }

      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Inbox API Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
