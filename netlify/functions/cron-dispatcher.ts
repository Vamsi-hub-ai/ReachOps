import { schedule } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { sendSequenceEmail } from '../lib/mailer';
import { 
  isWithinSendingWindow, 
  checkPreSendCompliance, 
  acquireEnrollmentLock,
  syncSendTelemetryToSheet 
} from '../lib/follow-up-engine';

// Runs every 5 minutes on background schedule
export const handler = schedule('*/5 * * * *', async (event) => {
  console.log('Cron Dispatcher Triggered');
  try {
    const now = new Date();

    // 1. Find enrollments ready to dispatch
    const enrollments = await prisma.campaignEnrollment.findMany({
      where: {
        status: { in: ['PENDING', 'ACTIVE', 'SCHEDULED'] },
        campaign: { status: 'ACTIVE' },
        OR: [
          { nextActionAt: null },
          { nextActionAt: { lte: now } }
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
      take: 50 // Limit batch size to protect function execution timeout
    });

    if (enrollments.length === 0) {
      console.log('No pending emails to dispatch.');
      return { statusCode: 200, body: 'No pending emails' };
    }

    let processedCount = 0;

    for (const enrollment of enrollments) {
      const campaign = enrollment.campaign;
      const prospect = enrollment.prospect;

      // RULE 1: If any tag is applied, automated follow-up sequence MUST STOP!
      const STOPPED_TAGS = ['LEAD', 'WARM', 'COLD', 'DNC', 'INVALID CONTACT', 'UNSUBSCRIBED', 'PAUSED'];
      const pStatus = (prospect.status || '').toUpperCase();
      const hasTag = STOPPED_TAGS.some(t => pStatus.includes(t));

      if (hasTag && enrollment.status !== 'SCHEDULED') {
        console.log(`[TAG_STOP] Skipping dispatch: ${prospect.email} tagged as ${prospect.status}. Follow-up paused.`);
        await prisma.campaignEnrollment.update({
          where: { id: enrollment.id },
          data: {
            status: 'PAUSED',
            stopReason: `Lead tagged as ${prospect.status}. Automated follow-up halted.`,
            nextActionAt: null
          }
        });
        continue;
      }

      // RULE 2: If status is SCHEDULED, verify scheduled date has arrived
      if (enrollment.status === 'SCHEDULED' && enrollment.nextActionAt) {
        if (now < enrollment.nextActionAt) {
          console.log(`[SCHEDULED_WAIT] Skipping dispatch: ${prospect.email} scheduled for ${enrollment.nextActionAt.toISOString()}`);
          continue;
        }
        console.log(`[SCHEDULED_DISPATCH] Scheduled time arrived for ${prospect.email}. Dispatching now!`);
      }

      // RULE 3: Sending Window & Weekend Schedule Verification
      const windowCheck = isWithinSendingWindow({
        timezone: campaign.timezone,
        sendingWindowStart: campaign.sendingWindowStart,
        sendingWindowEnd: campaign.sendingWindowEnd,
        weekendSendingEnabled: campaign.weekendSendingEnabled,
      }, now);

      if (!windowCheck.isAllowed) {
        console.log(`[WINDOW_HOLD] Skipping ${prospect.email}: ${windowCheck.reason}`);
        continue;
      }

      // RULE 4: Pre-Send Compliance Verification (Unsubscribe, Bounce, Reply, Suppression)
      const compliance = await checkPreSendCompliance(campaign.workspaceId, prospect);
      if (!compliance.eligible) {
        console.log(`[COMPLIANCE_BLOCK] Canceling dispatch for ${prospect.email}: ${compliance.blockReason}`);
        await prisma.campaignEnrollment.update({
          where: { id: enrollment.id },
          data: {
            status: 'STOPPED',
            stopReason: compliance.blockReason,
            nextActionAt: null,
          },
        });
        continue;
      }

      // RULE 5: Atomically acquire execution lock to prevent double-dispatch
      const isLocked = await acquireEnrollmentLock(enrollment.id);
      if (!isLocked) {
        console.log(`[CONCURRENCY_LOCK] Enrollment ${enrollment.id} is already being processed by another worker.`);
        continue;
      }

      // RULE 6: Inbox Rotation & Daily Limit Safeguards
      const accounts = await prisma.emailAccount.findMany({
        where: { 
          workspaceId: campaign.workspaceId, 
          status: 'ACTIVE' 
        },
        orderBy: { sentToday: 'asc' }
      });

      const account = accounts.find(acc => acc.sentToday < acc.dailyLimit);

      if (!account) {
        console.error(`No available sender account (limits reached) for workspace ${campaign.workspaceId}`);
        // Revert lock back to ACTIVE
        await prisma.campaignEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'ACTIVE' },
        });
        continue;
      }

      const accountId = account.id;

      const sequence = campaign.sequences[0];
      if (!sequence || sequence.steps.length === 0) {
        console.error(`No sequence or steps for campaign ${enrollment.campaignId}`);
        await prisma.campaignEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'PAUSED', stopReason: 'No sequence steps found' },
        });
        continue;
      }

      const currentStep = sequence.steps.find(s => s.stepNumber === enrollment.currentStep);
      
      if (!currentStep) {
        await prisma.campaignEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED', nextActionAt: null }
        });
        continue;
      }

      // 7. Dispatch the Email via Provider (with Demo Safeguards)
      console.log(`Sending step ${currentStep.stepNumber} to ${prospect.email}`);
      const messageId = uuidv4();
      const sendResult = await sendSequenceEmail(
        accountId, 
        {
          email: prospect.email,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          company: prospect.company,
          customData: prospect.customFieldsJson ? JSON.parse(prospect.customFieldsJson) : {}
        }, 
        currentStep.subject, 
        currentStep.bodyHtml,
        messageId
      );

      if (sendResult.success) {
        // 8. Record Message Log
        await prisma.message.create({
          data: {
            id: messageId,
            campaignId: enrollment.campaignId,
            prospectId: enrollment.prospectId,
            sequenceStepId: currentStep.id,
            emailAccountId: accountId,
            status: 'SENT',
            providerMessageId: sendResult.messageId || 'unknown',
            subject: currentStep.subject,
            sentAt: now,
          }
        });

        // Update Account Daily Limits
        await prisma.emailAccount.update({
          where: { id: accountId },
          data: { 
            sentToday: { increment: 1 },
            lastSentAt: now,
          }
        });

        // 9. Advance Sequence Cadence
        const wasManualScheduled = enrollment.status === 'SCHEDULED';

        let nextStepNumber: number | undefined = undefined;
        let nextTime: Date | null = null;

        if (wasManualScheduled) {
          // RULE: After the manually scheduled follow-up is sent, keep original automated sequence PAUSED!
          await prisma.campaignEnrollment.update({
            where: { id: enrollment.id },
            data: {
              status: 'PAUSED',
              lastSentAt: now,
              stopReason: 'Manual scheduled follow-up sent. Automated sequence remains paused.',
              nextActionAt: null,
            },
          });
        } else {
          const nextStep = sequence.steps.find(s => s.stepNumber === currentStep.stepNumber + 1);
          
          if (nextStep) {
            nextStepNumber = nextStep.stepNumber;
            nextTime = new Date();
            nextTime.setDate(nextTime.getDate() + (nextStep.delayDays || 0));
            nextTime.setHours(nextTime.getHours() + (nextStep.delayHours || 0));
            nextTime.setMinutes(nextTime.getMinutes() + (nextStep.delayMinutes || 0));
            
            await prisma.campaignEnrollment.update({
              where: { id: enrollment.id },
              data: { 
                status: 'ACTIVE',
                currentStep: nextStep.stepNumber,
                lastSentAt: now,
                nextActionAt: nextTime
              }
            });
          } else {
            await prisma.campaignEnrollment.update({
              where: { id: enrollment.id },
              data: { 
                status: 'COMPLETED', 
                lastSentAt: now,
                completedAt: now,
                nextActionAt: null 
              }
            });
          }
        }

        // 10. Sync Telemetry to Google Sheets Row
        await syncSendTelemetryToSheet({
          workspaceId: campaign.workspaceId,
          campaignId: campaign.id,
          prospectEmail: prospect.email,
          stepNumber: currentStep.stepNumber,
          messageSubject: currentStep.subject,
          sentAt: now,
          nextStepNumber,
          nextActionAt: nextTime,
        });

        processedCount++;
      } else {
        // 11. Record Failure & Release Lock
        console.error(`Failed to send to ${prospect.email}:`, sendResult.error);
        await prisma.message.create({
          data: {
            campaignId: enrollment.campaignId,
            prospectId: enrollment.prospectId,
            sequenceStepId: currentStep.id,
            emailAccountId: accountId,
            status: 'FAILED',
            errorMessage: String(sendResult.error),
            subject: currentStep.subject,
            failedAt: now,
          }
        });

        await prisma.campaignEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'ACTIVE', stopReason: `Send error: ${String(sendResult.error)}` }
        });
      }
    }

    return { statusCode: 200, body: `Processed ${processedCount} enrollments.` };
  } catch (error: any) {
    console.error('Cron Dispatch Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
});
