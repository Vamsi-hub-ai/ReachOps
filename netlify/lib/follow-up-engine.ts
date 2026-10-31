import prisma from './prisma';
import { google } from 'googleapis';
import { getGoogleClient } from './google-client';
import { sanitizeCellValue } from './google-sheets-service';

export interface CampaignWindowConfig {
  timezone?: string;
  sendingWindowStart?: string;
  sendingWindowEnd?: string;
  weekendSendingEnabled?: boolean;
}

/**
 * Checks whether the current time falls within the configured campaign sending window
 * and respects weekend exclusion in the campaign's local timezone.
 */
export function isWithinSendingWindow(
  config: CampaignWindowConfig,
  currentDate: Date = new Date()
): { isAllowed: boolean; reason?: string } {
  const tz = config.timezone || 'UTC';
  
  // Format current time in campaign timezone
  let localHour = 9;
  let localMinute = 0;
  let localDayOfWeek = 1; // 0 = Sunday, 1 = Monday, etc.

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz.includes('EST') || tz.includes('Eastern') ? 'America/New_York' 
              : tz.includes('PST') || tz.includes('Pacific') ? 'America/Los_Angeles'
              : tz.includes('CST') || tz.includes('Central') ? 'America/Chicago'
              : tz.includes('UTC') ? 'UTC' : tz,
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hour12: false,
    });

    const parts = formatter.formatToParts(currentDate);
    const hourPart = parts.find(p => p.type === 'hour');
    const minutePart = parts.find(p => p.type === 'minute');
    const weekdayPart = parts.find(p => p.type === 'weekday');

    if (hourPart) localHour = parseInt(hourPart.value, 10);
    if (minutePart) localMinute = parseInt(minutePart.value, 10);

    const weekdayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
    };
    if (weekdayPart?.value && weekdayMap[weekdayPart.value] !== undefined) {
      localDayOfWeek = weekdayMap[weekdayPart.value];
    }
  } catch {
    localHour = currentDate.getUTCHours();
    localMinute = currentDate.getUTCMinutes();
    localDayOfWeek = currentDate.getUTCDay();
  }

  // 1. Check Weekend Sending
  const isWeekend = localDayOfWeek === 0 || localDayOfWeek === 6;
  if (isWeekend && !config.weekendSendingEnabled) {
    return {
      isAllowed: false,
      reason: `Weekend sending disabled. Holding dispatch until Monday in timezone ${tz}.`,
    };
  }

  // 2. Check Daily Time Window
  const startStr = config.sendingWindowStart || '09:00';
  const endStr = config.sendingWindowEnd || '17:00';

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  const currentMinutes = localHour * 60 + localMinute;
  const startMinutes = (startH || 9) * 60 + (startM || 0);
  const endMinutes = (endH || 17) * 60 + (endM || 0);

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return {
      isAllowed: false,
      reason: `Current time (${String(localHour).padStart(2, '0')}:${String(localMinute).padStart(2, '0')}) is outside sending window (${startStr} - ${endStr}) in timezone ${tz}.`,
    };
  }

  return { isAllowed: true };
}

/**
 * Pre-Send Compliance Verification
 * Strict guard preventing sends if prospect was unsubscribed, bounced, replied, or suppressed.
 */
export async function checkPreSendCompliance(
  workspaceId: string,
  prospect: { email: string; unsubscribe: boolean; bounced: boolean; replied: boolean }
): Promise<{ eligible: boolean; blockReason?: string }> {
  if (prospect.unsubscribe) {
    return { eligible: false, blockReason: 'Prospect is unsubscribed (CAN-SPAM compliance)' };
  }
  if (prospect.bounced) {
    return { eligible: false, blockReason: 'Prospect previously suffered a permanent bounce' };
  }
  if (prospect.replied) {
    return { eligible: false, blockReason: 'Inbound reply already received from prospect' };
  }

  // Check workspace suppression list
  const suppressed = await prisma.suppression.findFirst({
    where: {
      workspaceId,
      email: prospect.email.toLowerCase().trim(),
    },
  });

  if (suppressed) {
    return { eligible: false, blockReason: `Recipient is on workspace suppression list (${suppressed.reason})` };
  }

  return { eligible: true };
}

/**
 * Atomically acquires an execution lock on an enrollment, guaranteeing that
 * concurrent cron tasks or background workers will never process the same prospect twice.
 */
export async function acquireEnrollmentLock(enrollmentId: string): Promise<boolean> {
  const result = await prisma.campaignEnrollment.updateMany({
    where: {
      id: enrollmentId,
      status: { in: ['ACTIVE', 'SCHEDULED', 'PENDING'] },
    },
    data: {
      status: 'PROCESSING',
    },
  });

  return result.count > 0;
}

/**
 * Updates Google Sheet row with dispatch telemetry (emails sent count, timestamps, delivery status)
 */
export async function syncSendTelemetryToSheet(params: {
  workspaceId: string;
  campaignId: string;
  prospectEmail: string;
  stepNumber: number;
  messageSubject: string;
  sentAt: Date;
  nextStepNumber?: number;
  nextActionAt?: Date | null;
}) {
  try {
    const campaignSheet = await prisma.campaignSheet.findUnique({
      where: { campaignId: params.campaignId },
    });

    if (!campaignSheet) return;

    // Find active Gmail account in workspace to access Google Sheets API
    const account = await prisma.emailAccount.findFirst({
      where: { workspaceId: params.workspaceId, provider: 'GMAIL', status: 'ACTIVE' },
    });

    if (!account) return;

    const googleAuth = await getGoogleClient(account.id);
    const sheets = google.sheets({ version: 'v4', auth: googleAuth });

    // Read headers to locate columns
    const sheetName = campaignSheet.sheetName || 'Sheet1';
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: campaignSheet.spreadsheetId,
      range: `'${sheetName}'!1:1`,
    });

    const headers = (headerRes.data.values?.[0] || []).map(h => String(h || '').trim().toLowerCase());
    const emailIdx = headers.findIndex(h => h === 'email');
    if (emailIdx === -1) return;

    // Read email column to find matching row
    function colIdxToLetter(idx: number): string {
      let result = '';
      let n = idx;
      while (n >= 0) {
        result = String.fromCharCode((n % 26) + 65) + result;
        n = Math.floor(n / 26) - 1;
      }
      return result;
    }

    const emailColLetter = colIdxToLetter(emailIdx);
    const colRes = await sheets.spreadsheets.values.get({
      spreadsheetId: campaignSheet.spreadsheetId,
      range: `'${sheetName}'!${emailColLetter}2:${emailColLetter}`,
    });

    const rows = colRes.data.values || [];
    const targetRowRelativeIdx = rows.findIndex(r => (r[0] || '').trim().toLowerCase() === params.prospectEmail.toLowerCase().trim());
    if (targetRowRelativeIdx === -1) return;

    const actualRowNumber = targetRowRelativeIdx + 2;

    // Build update values for telemetry columns
    const updateEntries: { colName: string; value: string }[] = [
      { colName: 'delivery_status', value: 'DELIVERED' },
      { colName: 'last_email_sent_at', value: params.sentAt.toISOString() },
      { colName: 'current_sequence_step', value: String(params.stepNumber) },
      { colName: 'last_activity', value: `Step ${params.stepNumber} sent (${params.messageSubject.slice(0, 30)}...)` },
    ];

    if (params.stepNumber === 1) {
      updateEntries.push(
        { colName: 'initial_email_subject', value: sanitizeCellValue(params.messageSubject) },
        { colName: 'initial_email_status', value: 'SENT' },
        { colName: 'initial_email_sent_at', value: params.sentAt.toISOString() }
      );
    }

    if (params.nextStepNumber && params.nextActionAt) {
      updateEntries.push(
        { colName: 'next_followup_step', value: String(params.nextStepNumber) },
        { colName: 'next_followup_at', value: params.nextActionAt.toISOString() },
        { colName: 'next_followup_date', value: params.nextActionAt.toLocaleDateString() },
        { colName: 'next_followup_time', value: params.nextActionAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { colName: 'followup_status', value: 'ACTIVE' }
      );
    } else {
      updateEntries.push(
        { colName: 'next_followup_step', value: '-' },
        { colName: 'next_followup_at', value: '' },
        { colName: 'followup_status', value: 'COMPLETED' }
      );
    }

    // Apply updates
    for (const entry of updateEntries) {
      const colIdx = headers.findIndex(h => h === entry.colName.toLowerCase());
      if (colIdx !== -1) {
        const colLetter = colIdxToLetter(colIdx);
        await sheets.spreadsheets.values.update({
          spreadsheetId: campaignSheet.spreadsheetId,
          range: `'${sheetName}'!${colLetter}${actualRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[sanitizeCellValue(entry.value)]],
          },
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    console.warn('Google Sheet telemetry write deferred:', err.message);
  }
}

/**
 * Synchronizes an inbound reply event to Google Sheets:
 * Sets reply_status = 'REPLIED', reply_detected = 'TRUE',
 * followup_status = 'STOPPED', sequence_stopped_reason = 'REPLY_RECEIVED'
 */
export async function syncReplyToSheet(params: {
  workspaceId: string;
  campaignId: string;
  prospectEmail: string;
  subject?: string;
  snippet?: string;
  repliedAt: Date;
}) {
  try {
    const campaignSheet = await prisma.campaignSheet.findUnique({
      where: { campaignId: params.campaignId },
    });
    if (!campaignSheet) return;

    const account = await prisma.emailAccount.findFirst({
      where: { workspaceId: params.workspaceId, provider: 'GMAIL', status: 'ACTIVE' },
    });
    if (!account) return;

    const googleAuth = await getGoogleClient(account.id);
    const sheets = google.sheets({ version: 'v4', auth: googleAuth });

    const sheetName = campaignSheet.sheetName || 'Sheet1';
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: campaignSheet.spreadsheetId,
      range: `'${sheetName}'!1:1`,
    });

    const headers = (headerRes.data.values?.[0] || []).map(h => String(h || '').trim().toLowerCase());
    const emailIdx = headers.findIndex(h => h === 'email');
    if (emailIdx === -1) return;

    function colIdxToLetter(idx: number): string {
      let result = '';
      let n = idx;
      while (n >= 0) {
        result = String.fromCharCode((n % 26) + 65) + result;
        n = Math.floor(n / 26) - 1;
      }
      return result;
    }

    const emailColLetter = colIdxToLetter(emailIdx);
    const colRes = await sheets.spreadsheets.values.get({
      spreadsheetId: campaignSheet.spreadsheetId,
      range: `'${sheetName}'!${emailColLetter}2:${emailColLetter}`,
    });

    const rows = colRes.data.values || [];
    const targetRowRelativeIdx = rows.findIndex(r => (r[0] || '').trim().toLowerCase() === params.prospectEmail.toLowerCase().trim());
    if (targetRowRelativeIdx === -1) return;

    const actualRowNumber = targetRowRelativeIdx + 2;

    const replyEntries: { colName: string; value: string }[] = [
      { colName: 'reply_status', value: 'REPLIED' },
      { colName: 'reply_received_at', value: params.repliedAt.toISOString() },
      { colName: 'reply_detected', value: 'TRUE' },
      { colName: 'sequence_stopped_reason', value: 'REPLY_RECEIVED' },
      { colName: 'followup_status', value: 'STOPPED' },
      { colName: 'followup_paused', value: 'TRUE' },
      { colName: 'followup_pause_reason', value: 'Inbound reply received from prospect' },
      { colName: 'next_followup_at', value: '' },
      { colName: 'next_followup_step', value: '-' },
      { colName: 'reply_subject', value: params.subject || 'Re: Outreach' },
      { colName: 'reply_content', value: params.snippet || 'Inbound reply' },
      { colName: 'last_activity', value: 'Reply received. Follow-up sequence permanently stopped.' },
    ];

    for (const entry of replyEntries) {
      const colIdx = headers.findIndex(h => h === entry.colName.toLowerCase());
      if (colIdx !== -1) {
        const colLetter = colIdxToLetter(colIdx);
        await sheets.spreadsheets.values.update({
          spreadsheetId: campaignSheet.spreadsheetId,
          range: `'${sheetName}'!${colLetter}${actualRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[sanitizeCellValue(entry.value)]],
          },
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    console.warn('Google Sheet reply sync deferred:', err.message);
  }
}


