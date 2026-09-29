import { schedule } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { sendSequenceEmail } from '../lib/mailer';

// Runs every 5 minutes
export const handler = schedule('*/5 * * * *', async (event) => {
  console.log('Cron Dispatcher Triggered');
  try {
    // 1. Find enrollments ready to send
    const enrollments = await prisma.campaignEnrollment.findMany({
      where: {
        status: { in: ['PENDING', 'ACTIVE'] },
        campaign: { status: 'ACTIVE' },
        OR: [
          { nextActionAt: null },
          { nextActionAt: { lte: new Date() } }
        ]
      },
      include: {
        prospect: true,
        campaign: {
          include: {
            sequences: {
              include: { steps: { orderBy: { stepNumber: 'asc' } } }
            }
          }
        }
      },
      take: 50 // Limit batch size to avoid timeout
    });

    if (enrollments.length === 0) {
      console.log('No pending emails to dispatch.');
      return { statusCode: 200, body: 'No pending emails' };
    }

    for (const enrollment of enrollments) {
      // PRODUCTION FIX: Inbox Rotation & Daily Limits
      // Fetch available accounts dynamically per email to support round-robin rotation
      const accounts = await prisma.emailAccount.findMany({
        where: { 
          workspaceId: enrollment.campaign.workspaceId, 
          status: 'ACTIVE' 
        },
        orderBy: { sentToday: 'asc' }
      });

      const account = accounts.find(acc => acc.sentToday < acc.dailyLimit);

      if (!account) {
        console.error(`No available sender account (limits reached) for workspace ${enrollment.campaign.workspaceId}`);
        continue; // Skip this enrollment until tomorrow
      }

      const accountId = account.id;

      const sequence = enrollment.campaign.sequences[0];
      if (!sequence || sequence.steps.length === 0) {
        console.error(`No sequence or steps for campaign ${enrollment.campaignId}`);
        continue;
      }

      const currentStep = sequence.steps.find(s => s.stepNumber === enrollment.currentStep);
      
      if (!currentStep) {
        // If they are on a step that doesn't exist (e.g. sequence finished)
        await prisma.campaignEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED' }
        });
        continue;
      }

      // 3. Dispatch the email
      console.log(`Sending step ${currentStep.stepNumber} to ${enrollment.prospect.email}`);
      const messageId = uuidv4();
      const result = await sendSequenceEmail(
        accountId, 
        {
          email: enrollment.prospect.email,
          firstName: enrollment.prospect.firstName,
          lastName: enrollment.prospect.lastName,
          company: enrollment.prospect.company,
          customData: enrollment.prospect.customFieldsJson ? JSON.parse(enrollment.prospect.customFieldsJson) : {}
        }, 
        currentStep.subject, 
        currentStep.bodyHtml,
        messageId
      );

      if (result.success) {
        // 4. Log the message
        await prisma.message.create({
          data: {
            id: messageId,
            campaignId: enrollment.campaignId,
            prospectId: enrollment.prospectId,
            sequenceStepId: currentStep.id,
            emailAccountId: accountId,
            status: 'SENT',
            providerMessageId: result.messageId || 'unknown',
            subject: currentStep.subject
          }
        });

        // Update account limits
        await prisma.emailAccount.update({
          where: { id: accountId },
          data: { 
            sentToday: { increment: 1 },
            lastSentAt: new Date()
          }
        });

        // 5. Calculate next step and update enrollment
        const nextStep = sequence.steps.find(s => s.stepNumber === currentStep.stepNumber + 1);
        
        if (nextStep) {
          const nextTime = new Date();
          nextTime.setDate(nextTime.getDate() + (nextStep.delayDays || 0));
          nextTime.setHours(nextTime.getHours() + (nextStep.delayHours || 0));
          nextTime.setMinutes(nextTime.getMinutes() + (nextStep.delayMinutes || 0));
          
          await prisma.campaignEnrollment.update({
            where: { id: enrollment.id },
            data: { 
              status: 'ACTIVE',
              currentStep: nextStep.stepNumber,
              nextActionAt: nextTime
            }
          });
        } else {
          await prisma.campaignEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'COMPLETED', nextActionAt: null }
          });
        }
      } else {
        // 6. Log Failure
        console.error(`Failed to send to ${enrollment.prospect.email}:`, result.error);
        await prisma.message.create({
          data: {
            campaignId: enrollment.campaignId,
            prospectId: enrollment.prospectId,
            sequenceStepId: currentStep.id,
            emailAccountId: accountId,
            status: 'FAILED',
            errorMessage: String(result.error),
            subject: currentStep.subject
          }
        });
      }
    }

    return { statusCode: 200, body: `Processed ${enrollments.length} enrollments.` };
  } catch (error: any) {
    console.error('Cron Dispatch Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
});
