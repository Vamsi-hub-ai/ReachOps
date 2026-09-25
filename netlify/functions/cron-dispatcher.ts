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
          { nextSendTime: null },
          { nextSendTime: { lte: new Date() } }
        ]
      },
      include: {
        prospect: true,
        campaign: {
          include: {
            sequence: {
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

    // 2. We need an email account to send from for each campaign.
    // For simplicity, we find the first active Gmail account for the workspace.
    // In production, campaign or user should have an explicitly selected sender.
    const workspaceAccounts: Record<string, string | null> = {};

    for (const enrollment of enrollments) {
      const workspaceId = enrollment.campaign.workspaceId;
      if (workspaceAccounts[workspaceId] === undefined) {
        const account = await prisma.emailAccount.findFirst({
          where: { workspaceId, provider: 'GMAIL', status: 'ACTIVE' }
        });
        workspaceAccounts[workspaceId] = account ? account.id : null;
      }

      const accountId = workspaceAccounts[workspaceId];
      if (!accountId) {
        console.error(`No active sender account for workspace ${workspaceId}`);
        continue; // Skip this enrollment
      }

      const sequence = enrollment.campaign.sequence;
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
          customData: enrollment.prospect.customData
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
            providerMessageId: result.messageId || 'unknown'
          }
        });

        // 5. Calculate next step and update enrollment
        const nextStep = sequence.steps.find(s => s.stepNumber === currentStep.stepNumber + 1);
        
        if (nextStep) {
          const nextTime = new Date();
          nextTime.setDate(nextTime.getDate() + nextStep.delayDays);
          
          await prisma.campaignEnrollment.update({
            where: { id: enrollment.id },
            data: { 
              status: 'ACTIVE',
              currentStep: nextStep.stepNumber,
              nextSendTime: nextTime
            }
          });
        } else {
          await prisma.campaignEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'COMPLETED', nextSendTime: null }
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
            errorMessage: String(result.error)
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
