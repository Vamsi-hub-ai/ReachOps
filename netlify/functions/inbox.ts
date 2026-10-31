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
      let prospects: any[] = [];
      try {
        prospects = await prisma.prospect.findMany({
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
      } catch (dbErr: any) {
        console.warn('Prisma prospect lookup failed:', dbErr?.message);
      }

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

      if (threads.length === 0 && auth.isDemo) {
        threads = [
          {
            id: 'demo-p-28',
            prospectId: 'demo-p-28',
            campaignId: 'demo-camp-beta-launch',
            campaignName: '[DEMO] Product Hunt Beta Launch Sequence',
            name: 'Ethan Hunt',
            email: 'ethan.hunt@example.com',
            company: 'Synergy Labs',
            title: 'Managing Director',
            time: '25 Oct, 06:16 am',
            subject: 'Re: Thanks for supporting our launch, Ethan!',
            snippet: 'Hi team, great launch on Product Hunt! What\'s the main difference between your warmup network a...',
            tag: 'INTERESTED',
            unread: false,
            step: 'Step 1',
            status: 'REPLIED',
            history: [
              {
                sender: 'You',
                time: '23 Oct, 06:16 pm',
                body: 'Hi {{firstName}},\n\nSaw you engaged with ReachOps on Product Hunt. Here is exclusive early access to our automated warmup pool.\n\n{{accountSignature}}',
              },
              {
                sender: 'Ethan Hunt',
                time: '25 Oct, 06:16 am',
                body: 'Hi team, great launch on Product Hunt! What\'s the main difference between your warmup network and Instantly?',
              }
            ],
          },
          {
            id: 'demo-p-29',
            prospectId: 'demo-p-29',
            campaignId: 'demo-camp-beta-launch',
            campaignName: '[DEMO] Product Hunt Beta Launch Sequence',
            name: 'Maya Patel',
            email: 'maya.patel@example.com',
            company: 'Velocity AI',
            title: 'VP Growth',
            time: '25 Oct, 06:16 pm',
            subject: 'Re: Thanks for supporting our launch, Maya!',
            snippet: 'Congrats on the launch! We would love to test ReachOps on our staging domains next week.',
            tag: 'POSITIVE',
            unread: false,
            step: 'Step 1',
            status: 'REPLIED',
            history: [
              {
                sender: 'You',
                time: '24 Oct, 11:20 am',
                body: 'Hi Maya,\n\nExcited to connect following the Product Hunt launch! Let me know if your team wants a demo account setup.',
              },
              {
                sender: 'Maya Patel',
                time: '25 Oct, 06:16 pm',
                body: 'Congrats on the launch! We would love to test ReachOps on our staging domains next week.',
              }
            ],
          }
        ];
      }

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

      if (action === 'mark_lead' || action === 'apply_tag') {
        const appliedTag = status || body.tag || 'Lead';
        const isDnc = ['DNC', 'INVALID CONTACT'].some(t => appliedTag.toUpperCase().includes(t));

        await prisma.prospect.update({
          where: { id: prospect.id },
          data: { 
            status: appliedTag,
            unsubscribe: isDnc ? true : prospect.unsubscribe
          }
        });

        // RULE: Whenever ANY tag is applied, automatically pause automated follow-ups for this prospect
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId: prospect.id },
          data: {
            status: 'PAUSED',
            stopReason: `Follow-ups paused: Prospect tagged as ${appliedTag}. Other campaign prospects continue sending.`,
            nextActionAt: null
          }
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: true, 
            status: appliedTag,
            sequencePaused: true,
            followupStatus: 'PAUSED',
            stopReason: `Automated follow-up paused: Prospect tagged as ${appliedTag}`
          }),
        };
      }

      if (action === 'remove_tag') {
        await prisma.prospect.update({
          where: { id: prospect.id },
          data: { status: 'New' }
        });

        // RULE: When a tag is removed, automated sequence REMAINS PAUSED!
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId: prospect.id },
          data: {
            status: 'PAUSED',
            stopReason: 'Tag removed. Follow-up sequence remains paused until explicitly resumed.',
            nextActionAt: null
          }
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            status: 'New',
            sequencePaused: true,
            followupStatus: 'PAUSED',
            message: 'Tag removed. Automated sequence remains paused until explicitly resumed.'
          }),
        };
      }

      if (action === 'pause_sequence') {
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId: prospect.id },
          data: {
            status: 'PAUSED',
            stopReason: 'Manually paused by user.',
            nextActionAt: null
          }
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            sequencePaused: true,
            followupStatus: 'PAUSED',
            message: 'Sequence manually paused for this prospect.'
          }),
        };
      }

      if (action === 'resume_sequence') {
        // SYSTEM-PROTECTED STOPPING CONDITIONS:
        // Reply received, Unsubscribed, Permanent bounce, or Suppressed
        if (prospect.unsubscribe || prospect.bounced || prospect.replied) {
          const reason = prospect.unsubscribe ? 'unsubscribed' : prospect.bounced ? 'permanently bounced' : 'replied';
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: `Compliance restriction: Cannot resume sequence. Recipient has ${reason}.`
            }),
          };
        }

        const isSuppressed = await prisma.suppression.findFirst({
          where: { workspaceId: { in: workspaceIds }, email: prospect.email }
        });
        if (isSuppressed) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: `Compliance restriction: Cannot resume sequence. Recipient is suppressed (${isSuppressed.reason}).`
            }),
          };
        }

        // Resume sequence if eligible
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId: prospect.id },
          data: {
            status: 'ACTIVE',
            stopReason: null,
            nextActionAt: new Date()
          }
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            sequencePaused: false,
            followupStatus: 'ACTIVE',
            message: 'Automated sequence resumed successfully.'
          }),
        };
      }

      if (action === 'schedule_follow_up') {
        // SYSTEM-PROTECTED STOPPING CONDITIONS:
        if (prospect.unsubscribe || prospect.bounced || prospect.replied) {
          const reason = prospect.unsubscribe ? 'unsubscribed' : prospect.bounced ? 'permanently bounced' : 'replied';
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: `Scheduling blocked by compliance: Recipient has ${reason}. Manual scheduling is not permitted.`
            }),
          };
        }

        const isSuppressed = await prisma.suppression.findFirst({
          where: { workspaceId: { in: workspaceIds }, email: prospect.email }
        });
        if (isSuppressed) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: `Scheduling blocked: Recipient is on the workspace suppression list (${isSuppressed.reason}).`
            }),
          };
        }

        const { scheduledDate, scheduledTime, formattedLabel, timezone = 'UTC' } = body;
        let targetDate = new Date();
        try {
          if (scheduledDate) {
            const timePart = scheduledTime || '09:00';
            targetDate = new Date(`${scheduledDate}T${timePart}:00`);
            if (isNaN(targetDate.getTime())) targetDate = new Date(Date.now() + 86400000);
          } else {
            targetDate = new Date(Date.now() + 86400000);
          }
        } catch {
          targetDate = new Date(Date.now() + 86400000);
        }

        const statusLabel = `Scheduled (${formattedLabel || scheduledDate})`;

        await prisma.prospect.update({
          where: { id: prospect.id },
          data: { status: statusLabel }
        });

        // Set enrollment to SCHEDULED with the specific target date
        // Note: Authorizes this single follow-up only; keeps original sequence paused!
        await prisma.campaignEnrollment.updateMany({
          where: { prospectId: prospect.id },
          data: {
            status: 'SCHEDULED',
            nextActionAt: targetDate,
            stopReason: `Explicit single follow-up scheduled for ${formattedLabel || scheduledDate}. Original sequence remains paused.`
          }
        });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            status: statusLabel,
            scheduledAt: targetDate.toISOString(),
            formattedLabel: formattedLabel || scheduledDate,
            timezone,
            message: `Next follow-up email scheduled for ${formattedLabel || scheduledDate}. Original sequence remains paused.`
          }),
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
