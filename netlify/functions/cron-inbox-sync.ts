import { schedule } from '@netlify/functions';
import { google } from 'googleapis';
import prisma from '../lib/prisma';
import { getGoogleClient } from '../lib/google-client';
import { syncReplyToSheet } from '../lib/follow-up-engine';
import { isWorkspaceDemo } from '../lib/auth';

// Runs every 15 minutes in background
export const handler = schedule('*/15 * * * *', async (event) => {
  console.log('Inbox Sync Cron Triggered');
  try {
    const now = new Date();

    // 1. Fetch all active Google email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { provider: 'GMAIL', status: 'ACTIVE' },
      include: { workspace: true }
    });

    let totalRepliesProcessed = 0;

    for (const account of emailAccounts) {
      // Demo workspace safeguard: do not poll external Gmail API for demo accounts
      if (isWorkspaceDemo(account.workspaceId, account.workspace?.name)) {
        continue;
      }

      try {
        const auth = await getGoogleClient(account.id);
        const gmail = google.gmail({ version: 'v1', auth });

        // 2. Query for unread emails from the last 2 days
        const res = await gmail.users.messages.list({
          userId: 'me',
          q: 'is:unread newer_than:2d category:primary',
          maxResults: 50,
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) continue;

        for (const msg of messages) {
          if (!msg.id) continue;

          // 3. Fetch message metadata and snippet
          const msgDetails = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = msgDetails.data.payload?.headers || [];
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
          const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'Re: Outreach';
          const snippet = msgDetails.data.snippet || '';

          // 4. Extract sender email
          const emailMatch = fromHeader.match(/<([^>]+)>/);
          const senderEmail = emailMatch ? emailMatch[1].toLowerCase().trim() : fromHeader.trim().toLowerCase();

          if (!senderEmail || !senderEmail.includes('@')) continue;

          // 5. Look for matching prospect in the workspace
          const prospect = await prisma.prospect.findFirst({
            where: {
              campaign: { workspaceId: account.workspaceId },
              email: senderEmail,
            },
            include: {
              campaign: true,
              enrollments: true,
            },
          });

          // Ignore senders that are not active prospects in this workspace
          if (!prospect || prospect.enrollments.length === 0) continue;

          console.log(`[REAL_REPLY_DETECTED] Inbound reply from ${senderEmail} in campaign ${prospect.campaignId}`);

          // 6. Update Prospect to Replied
          await prisma.prospect.update({
            where: { id: prospect.id },
            data: { replied: true, status: 'Replied' },
          });

          // 7. Stop all automated and manual follow-ups permanently
          for (const enrollment of prospect.enrollments) {
            await prisma.campaignEnrollment.update({
              where: { id: enrollment.id },
              data: {
                status: 'STOPPED',
                nextActionAt: null,
                stopReason: 'REPLY_RECEIVED',
              },
            });

            // Find latest sent message to mark as REPLIED and record reply event
            const lastMessage = await prisma.message.findFirst({
              where: {
                campaignId: enrollment.campaignId,
                prospectId: prospect.id,
              },
              orderBy: { sentAt: 'desc' },
            });

            if (lastMessage) {
              await prisma.message.update({
                where: { id: lastMessage.id },
                data: { status: 'REPLIED' },
              });

              // Log MessageEvent
              await prisma.messageEvent.create({
                data: {
                  messageId: lastMessage.id,
                  eventType: 'REPLY',
                  eventDataJson: JSON.stringify({
                    from: fromHeader,
                    subject: subjectHeader,
                    replyText: snippet,
                    repliedAt: now.toISOString(),
                  }),
                },
              });
            }

            // 8. Synchronize Reply State to Google Sheet
            await syncReplyToSheet({
              workspaceId: account.workspaceId,
              campaignId: enrollment.campaignId,
              prospectEmail: prospect.email,
              subject: subjectHeader,
              snippet,
              repliedAt: now,
            });

            totalRepliesProcessed++;
          }

          // 9. Mark email as read in Gmail so it is not processed on subsequent ticks
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          }).catch(err => {
            console.warn(`Could not mark message ${msg.id} as read:`, err.message);
          });
        }
      } catch (accountError: any) {
        console.error(`Failed syncing inbox for account ${account.email}:`, accountError.message);
      }
    }

    return { statusCode: 200, body: `Processed ${totalRepliesProcessed} inbound replies.` };
  } catch (error: any) {
    console.error('Cron Inbox Sync Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
});
