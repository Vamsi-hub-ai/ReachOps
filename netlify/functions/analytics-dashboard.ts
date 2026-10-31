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

    const { workspaceIds, isDemo } = auth;

    // 1. If DEMO user: return fixed demo numbers matching reference UX
    if (isDemo) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeCampaigns: 3,
          totalCampaigns: 5,
          totalProspects: 30,
          totalSent: 13,
          totalOpened: 11,
          totalReplied: 11,
          totalBounced: 0,
          scheduledSends: 3,
          sentToday: 14,
          dailyLimit: 1000,
          openRate: '84.6%',
          replyRate: '84.6%',
          bounceRate: '0.0%',
          emailsToday: '14 / 1,000',
          poolHealth: '98.6%',
          mailboxesCount: 3,
          activeMailboxesCount: 3,
          telemetry: [
            { label: 'Oct 1', sent: 20, delivered: 18, replies: 2, bounces: 0 },
            { label: 'Oct 4', sent: 32, delivered: 30, replies: 5, bounces: 0 },
            { label: 'Oct 7', sent: 50, delivered: 48, replies: 8, bounces: 1 },
            { label: 'Oct 10', sent: 42, delivered: 40, replies: 6, bounces: 0 },
            { label: 'Oct 13', sent: 68, delivered: 65, replies: 11, bounces: 0 },
            { label: 'Oct 16', sent: 58, delivered: 55, replies: 9, bounces: 1 },
            { label: 'Oct 19', sent: 82, delivered: 80, replies: 14, bounces: 0 },
            { label: 'Oct 22', sent: 98, delivered: 94, replies: 16, bounces: 1 },
            { label: 'Oct 25', sent: 142, delivered: 138, replies: 18, bounces: 2 },
            { label: 'Oct 28', sent: 128, dailyLimit: 1000, delivered: 124, replies: 15, bounces: 1 },
            { label: 'Oct 30', sent: 175, delivered: 170, replies: 22, bounces: 2 },
          ],
        }),
      };
    }

    // 2. Real Production Account (e.g. vamsipallela31@gmail.com):
    // Real-time aggregations strictly scoped to authenticated workspace(s)
    let activeCampaignsCount = 0;
    let totalCampaignsCount = 0;
    let totalProspectsCount = 0;
    let totalSent = 0;
    let totalOpened = 0;
    let totalReplied = 0;
    let totalBounced = 0;
    let scheduledSends = 0;
    let sentToday = 0;
    let mailboxesCount = 0;
    let activeMailboxesCount = 0;
    let dailyLimit = 1000;

    try {
      // Real DB counts
      activeCampaignsCount = await prisma.campaign.count({
        where: {
          workspaceId: { in: workspaceIds },
          status: { in: ['ACTIVE', 'Running', 'sending'] },
        },
      });

      totalCampaignsCount = await prisma.campaign.count({
        where: { workspaceId: { in: workspaceIds } },
      });

      totalProspectsCount = await prisma.prospect.count({
        where: { campaign: { workspaceId: { in: workspaceIds } } },
      });

      totalSent = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: { in: ['SENT', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED'] },
        },
      });

      totalOpened = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: { in: ['OPENED', 'CLICKED', 'REPLIED'] },
        },
      });

      totalReplied = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: 'REPLIED',
        },
      });

      totalBounced = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: 'BOUNCED',
        },
      });

      // Scheduled sends: pending messages + active enrollments waiting for next action
      const pendingMessages = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: 'QUEUED',
        },
      });
      const activeEnrollments = await prisma.campaignEnrollment.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: 'ACTIVE',
          nextActionAt: { not: null },
        },
      });
      scheduledSends = pendingMessages + activeEnrollments;

      // Sent today (since local/UTC midnight)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      sentToday = await prisma.message.count({
        where: {
          campaign: { workspaceId: { in: workspaceIds } },
          status: { in: ['SENT', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED'] },
          sentAt: { gte: todayStart },
        },
      });

      // Connected mailboxes
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { workspaceId: { in: workspaceIds } },
      });
      mailboxesCount = emailAccounts.length;
      activeMailboxesCount = emailAccounts.filter((a) => a.status === 'ACTIVE').length;
      if (mailboxesCount > 0) {
        dailyLimit = emailAccounts.reduce((acc, a) => acc + (a.dailyLimit || 100), 0);
      }
    } catch (dbErr: any) {
      console.warn('Live analytics DB aggregation warning:', dbErr?.message);
    }

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) + '%' : '0.0%';
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) + '%' : '0.0%';
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) + '%' : '0.0%';
    const poolHealth =
      mailboxesCount > 0 ? `${((activeMailboxesCount / mailboxesCount) * 100).toFixed(1)}%` : '0.0%';

    // Build real telemetry points over last 30 days
    const telemetry: { label: string; sent: number; delivered: number; replies: number; bounces: number }[] = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 3);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // When real user has 0 sent, baseline is clean 0
      telemetry.push({
        label,
        sent: 0,
        delivered: 0,
        replies: 0,
        bounces: 0,
      });
    }

    // If real user has sent messages, aggregate into buckets
    if (totalSent > 0) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const messages = await prisma.message.findMany({
          where: {
            campaign: { workspaceId: { in: workspaceIds } },
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            status: true,
            createdAt: true,
          },
        });

        // Group into the 11 buckets
        for (const msg of messages) {
          const msgTime = new Date(msg.createdAt).getTime();
          // Find closest bucket
          let closestIdx = 0;
          let minDiff = Infinity;
          for (let idx = 0; idx < telemetry.length; idx++) {
            const bucketDate = new Date(now);
            bucketDate.setDate(bucketDate.getDate() - (10 - idx) * 3);
            const diff = Math.abs(msgTime - bucketDate.getTime());
            if (diff < minDiff) {
              minDiff = diff;
              closestIdx = idx;
            }
          }
          if (['SENT', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED'].includes(msg.status)) {
            telemetry[closestIdx].sent++;
          }
          if (['SENT', 'OPENED', 'CLICKED', 'REPLIED'].includes(msg.status)) {
            telemetry[closestIdx].delivered++;
          }
          if (msg.status === 'REPLIED') {
            telemetry[closestIdx].replies++;
          }
          if (msg.status === 'BOUNCED') {
            telemetry[closestIdx].bounces++;
          }
        }
      } catch (telemetryErr: any) {
        console.warn('Telemetry calculation warning:', telemetryErr?.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeCampaigns: activeCampaignsCount,
        totalCampaigns: totalCampaignsCount,
        totalProspects: totalProspectsCount,
        totalSent,
        totalOpened,
        totalReplied,
        totalBounced,
        scheduledSends,
        sentToday,
        dailyLimit,
        openRate,
        replyRate,
        bounceRate,
        emailsToday: `${sentToday} / ${dailyLimit.toLocaleString()}`,
        poolHealth,
        mailboxesCount,
        activeMailboxesCount,
        telemetry,
      }),
    };
  } catch (error: any) {
    console.error('Analytics Dashboard Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
