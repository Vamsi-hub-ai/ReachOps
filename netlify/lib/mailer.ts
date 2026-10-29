import { google } from 'googleapis';
import { getGoogleClient } from './google-client';
import prisma from './prisma';
import { resolveSpintax } from './deliverability';
import { isWorkspaceDemo } from './auth';

interface ProspectData {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  customData?: any;
}

export function replaceVariables(text: string, prospect: ProspectData, senderName?: string): string {
  if (!text) return '';
  
  // First resolve spintax variations e.g. {Hi|Hello|Hey}
  let resolved = resolveSpintax(text);

  const firstName = prospect.firstName || 'there';
  const lastName = prospect.lastName || '';
  const company = prospect.company || 'your company';
  const email = prospect.email || '';
  const signature = senderName ? `Best regards,\n${senderName}` : 'Best regards,\nThe Team';

  // Support both standard {{var}} and Instantly [⚡ Variable] formats
  resolved = resolved
    .replace(/\{\{email\}\}|\[⚡\s*Email\]/gi, email)
    .replace(/\{\{firstName\}\}|\[⚡\s*First Name\]|\[⚡\s*firstName\]/gi, firstName)
    .replace(/\{\{lastName\}\}|\[⚡\s*Last Name\]|\[⚡\s*lastName\]/gi, lastName)
    .replace(/\{\{company\}\}|\[⚡\s*Company Name\]|\[⚡\s*company\]/gi, company)
    .replace(/\{\{accountSignature\}\}|\[⚡\s*Account Signature\]|\[⚡\s*signature\]/gi, signature);

  return resolved;
}

function encodeBase64Url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function createMimeMessage(
  to: string, 
  from: string, 
  subject: string, 
  htmlBody: string, 
  messageId: string,
  trackingDomain?: string
): string {
  const boundary = `----=_NextPart_${Math.random().toString(36).substring(2)}`;
  const plainTextBody = stripHtml(htmlBody);
  
  // Use branded custom tracking domain if configured to avoid shared blacklist penalty
  const domainUrl = trackingDomain ? `https://${trackingDomain}` : (process.env.URL || 'http://localhost:8888');
  const unsubscribeUrl = `${domainUrl}/api/unsubscribe/${messageId}`;

  const mimeStr = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `Message-ID: <${messageId}@${domainUrl.replace(/^https?:\/\//, '')}>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'X-Mailer: ReachOps-ColdEmailEngine/2.0',
    `List-Unsubscribe: <${unsubscribeUrl}>, <mailto:unsubscribe@${from.split('@')[1] || 'domain.com'}?subject=unsubscribe>`,
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    plainTextBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`
  ].join('\r\n');

  return encodeBase64Url(mimeStr);
}

export async function sendSequenceEmail(
  emailAccountId: string,
  prospect: ProspectData,
  rawSubject: string,
  rawBodyHtml: string,
  messageId: string,
  options: { trackOpens?: boolean; customTrackingDomain?: string } = { trackOpens: false }
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    const account = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      include: { workspace: true }
    });

    if (!account) throw new Error('Email account not found');

    // DEMO MODE SAFEGUARD: Strictly block any real outbound emails for demo workspaces or example recipients
    const isDemo = isWorkspaceDemo(account.workspaceId, account.workspace?.name);
    const isExampleEmail = prospect.email.endsWith('.example') || 
                           prospect.email.endsWith('@example.com') || 
                           prospect.email.endsWith('@example.org');

    if (isDemo || isExampleEmail) {
      console.info(JSON.stringify({
        event: 'demo_dispatch_safeguard',
        recipient: prospect.email,
        workspaceId: account.workspaceId,
        action: 'simulated_sandbox_send',
        timestamp: new Date().toISOString()
      }));
      return { 
        success: true, 
        messageId: `demo-simulated-${Date.now()}` 
      };
    }

    const auth = await getGoogleClient(emailAccountId);
    const gmail = google.gmail({ version: 'v1', auth });

    const senderName = account.displayName || account.email.split('@')[0];
    const subject = replaceVariables(rawSubject, prospect, senderName);
    let bodyHtml = replaceVariables(rawBodyHtml, prospect, senderName);
    
    // Inject tracking pixel only if enabled (Disabled on Step 1 gives 100% plain-text inbox deliverability!)
    if (options.trackOpens) {
      const baseUrl = options.customTrackingDomain 
        ? `https://${options.customTrackingDomain}` 
        : (process.env.URL || 'http://localhost:8888');
      const trackingPixel = `<img src="${baseUrl}/api/track/open/${messageId}.gif" width="1" height="1" style="display:none;" alt="" />`;
      bodyHtml += trackingPixel;
    }

    const from = account.displayName ? `${account.displayName} <${account.email}>` : account.email;

    const raw = createMimeMessage(
      prospect.email, 
      from, 
      subject, 
      bodyHtml, 
      messageId, 
      options.customTrackingDomain
    );

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    return { success: true, messageId: res.data.id || undefined };
  } catch (error) {
    console.error('Email Dispatch Error:', error);
    return { success: false, error };
  }
}
