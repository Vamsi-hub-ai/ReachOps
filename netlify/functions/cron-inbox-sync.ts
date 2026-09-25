import { schedule } from '@netlify/functions';
import { google } from 'googleapis';
import prisma from '../lib/prisma';
import { getGoogleClient } from '../lib/google-client';

// Runs every 15 minutes
export const handler = schedule('*/15 * * * *', async (event) => {
  console.log('Inbox Sync Cron Triggered');
  try {
    // 1. Fetch all active Google email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { provider: 'GMAIL', status: 'ACTIVE' }
    });

    let totalRepliesProcessed = 0;

    for (const account of emailAccounts) {
      try {
        const auth = await getGoogleClient(account.id);
        const gmail = google.gmail({ version: 'v1', auth });

        // 2. Query for unread emails from the last day
        const res = await gmail.users.messages.list({
          userId: 'me',
          q: 'is:unread newer_than:1d category:primary',
          maxResults: 50
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) continue;

        for (const msg of messages) {
          if (!msg.id) continue;

          // 3. Fetch message metadata
          const msgDetails = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From']
          });

          const headers = msgDetails.data.payload?.headers || [];
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';

          // 4. Extract email address from the "From" header (e.g., "John Doe <john@example.com>" -> "john@example.com")
          const emailMatch = fromHeader.match(/<([^>]+)>/);
          const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : fromHeader.trim().toLowerCase();

          if (!senderEmail) continue;

          // 5. Look for matching prospect in the workspace
          const prospect = await prisma.prospect.findFirst({
            where: {
              workspaceId: account.workspaceId,
              email: senderEmail
            },
            include: {
              enrollments: {
                where: { status: { in: ['ACTIVE', 'PENDING'] } }
              }
            }
          });

          // If this sender is not an active prospect, ignore
          if (!prospect || prospect.enrollments.length === 0) continue;

          // 6. Pause their campaigns
          for (const enrollment of prospect.enrollments) {
            // Mark enrollment as PAUSED
            await prisma.campaignEnrollment.update({
              where: { id: enrollment.id },
              data: { status: 'PAUSED' }
            });

            // Find the most recently sent message to mark as REPLIED
            const lastMessage = await prisma.message.findFirst({
              where: {
                campaignId: enrollment.campaignId,
                prospectId: prospect.id,
                status: 'SENT' // Only update if it hasn't been marked replied yet
              },
              orderBy: { sentAt: 'desc' }
            });

            if (lastMessage) {
              await prisma.message.update({
                where: { id: lastMessage.id },
                data: { status: 'REPLIED' }
              });
            }

            totalRepliesProcessed++;
            console.log(`Paused campaign ${enrollment.campaignId} for prospect ${prospect.email} due to reply.`);
          }

          // (Optional) Mark email as read so we don't process it again next tick
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: {
              removeLabelIds: ['UNREAD']
            }
          });
        }

      } catch (accountError) {
        console.error(`Failed syncing inbox for account ${account.email}:`, accountError);
      }
    }

    return { statusCode: 200, body: `Processed ${totalRepliesProcessed} replies.` };
  } catch (error: any) {
    console.error('Cron Inbox Sync Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
});
