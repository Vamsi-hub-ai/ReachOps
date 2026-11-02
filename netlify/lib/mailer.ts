import { google } from 'googleapis';
import { getGoogleClient } from './google-client';
import prisma from './prisma';
import { resolveSpintax } from './deliverability';
import { isWorkspaceDemo } from './auth';
import { decrypt } from './encryption';
import { sendSmtpEmail } from './smtp-client';

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

  const firstName = prospect.firstName || 'there';
  const lastName = prospect.lastName || '';
  const company = prospect.company || 'your company';
  const email = prospect.email || '';
  const jobTitle = prospect.jobTitle || '';
  const sName = senderName || 'Alex Rivera';
  const signature = senderName ? `Best regards,\n${senderName}` : 'Best regards,\nThe Team';

  // Support both standard {{var}} and Instantly [⚡ Variable] formats
  let resolved = text
    .replace(/\{\{email\}\}|\[⚡\s*Email\]/gi, email)
    .replace(/\{\{firstName\}\}|\[⚡\s*First Name\]|\[⚡\s*firstName\]/gi, firstName)
    .replace(/\{\{lastName\}\}|\[⚡\s*Last Name\]|\[⚡\s*lastName\]/gi, lastName)
    .replace(/\{\{company\}\}|\{\{companyName\}\}|\[⚡\s*Company Name\]|\[⚡\s*company\]/gi, company)
    .replace(/\{\{jobTitle\}\}|\[⚡\s*Job Title\]|\[⚡\s*jobTitle\]/gi, jobTitle)
    .replace(/\{\{senderName\}\}|\[⚡\s*Sender Name\]/gi, sName)
    .replace(/\{\{accountSignature\}\}|\[⚡\s*Account Signature\]|\[⚡\s*signature\]/gi, signature);

  // Next resolve spintax variations e.g. {Hi|Hello|Hey}
  resolved = resolveSpintax(resolved);

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

/**
 * Creates RFC 5322 MIME message optimized for 100% Primary Inbox placement.
 * - Avoids List-Unsubscribe headers that trigger Gmail/Outlook Promotions Tab routing.
 * - Enforces clean domain alignment on Message-ID.
 * - Places text/plain part before text/html part.
 */
function createMimeMessage(
  to: string, 
  from: string, 
  subject: string, 
  htmlBody: string, 
  messageId: string,
  options?: {
    trackingDomain?: string;
    inReplyTo?: string;
    references?: string;
  }
): { base64Url: string; rawMime: string } {
  const boundary = `----=_NextPart_${Math.random().toString(36).substring(2)}`;
  const plainTextBody = stripHtml(htmlBody);

  // Extract pure sender email & domain for Message-ID alignment
  const fromMatch = from.match(/<([^>]+)>/) || [null, from];
  const senderEmail = (fromMatch[1] || from).trim();
  const senderDomain = senderEmail.split('@')[1] || 'reachops.io';
  const cleanMessageId = `<${messageId || Date.now()}.${Math.random().toString(36).substring(2, 9)}@${senderDomain}>`;

  const headers = [
    `To: ${to}`,
    `From: ${from}`,
    `Reply-To: ${senderEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${cleanMessageId}`,
    'MIME-Version: 1.0',
    'X-Mailer: ReachOps Outbound Engine/2.0',
  ];

  if (options?.inReplyTo) {
    headers.push(`In-Reply-To: ${options.inReplyTo}`);
    headers.push(`References: ${options.references || options.inReplyTo}`);
  }

  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

  const mimeStr = [
    ...headers,
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

  return {
    rawMime: mimeStr,
    base64Url: encodeBase64Url(mimeStr),
  };
}

export async function sendSequenceEmail(
  emailAccountId: string,
  prospect: ProspectData,
  rawSubject: string,
  rawBodyHtml: string,
  messageId: string,
  options: { 
    trackOpens?: boolean; 
    customTrackingDomain?: string;
    isTestSend?: boolean;
    inReplyTo?: string;
    references?: string;
  } = { trackOpens: false }
): Promise<{ success: boolean; messageId?: string; error?: any; response?: string }> {
  try {
    const account = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      include: { workspace: true }
    });

    if (!account) throw new Error('Email account not found');

    // SAFEGUARD: Only block real outbound emails for reserved .example domains
    const isExampleEmail = prospect.email.endsWith('.example') || 
                           prospect.email.endsWith('@example.com') || 
                           prospect.email.endsWith('@example.org');

    // If it's a bulk campaign in a demo workspace and NOT an explicit test send to a real address, simulate
    const isDemo = isWorkspaceDemo(account.workspaceId, account.workspace?.name);
    if ((isDemo && !options.isTestSend) || isExampleEmail) {
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

    const senderName = account.displayName || account.email.split('@')[0];
    const subject = replaceVariables(rawSubject, prospect, senderName);
    let bodyHtml = replaceVariables(rawBodyHtml, prospect, senderName);
    
    // Inject tracking pixel ONLY if enabled with verified custom domain (Disabled on cold step 1 gives 100% primary inbox deliverability)
    if (options.trackOpens && options.customTrackingDomain) {
      const baseUrl = `https://${options.customTrackingDomain}`;
      const trackingPixel = `<img src="${baseUrl}/api/track/open/${messageId}.gif" width="1" height="1" style="display:none;" alt="" />`;
      bodyHtml += trackingPixel;
    }

    const from = account.displayName ? `"${account.displayName}" <${account.email}>` : account.email;

    const { rawMime, base64Url } = createMimeMessage(
      prospect.email, 
      from, 
      subject, 
      bodyHtml, 
      messageId, 
      {
        trackingDomain: options.customTrackingDomain,
        inReplyTo: options.inReplyTo,
        references: options.references,
      }
    );

    const decryptedSecret = account.accessTokenEncrypted ? decrypt(account.accessTokenEncrypted) : '';
    const decryptedRefresh = account.refreshTokenEncrypted ? decrypt(account.refreshTokenEncrypted) : '';

    // DISPATCH METHOD 1: Google OAuth 2.0 (Account has refresh token or OAuth access token)
    if (account.provider === 'GMAIL' && (decryptedRefresh || decryptedSecret.startsWith('ya29.'))) {
      try {
        const auth = await getGoogleClient(emailAccountId);
        const gmail = google.gmail({ version: 'v1', auth });
        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: base64Url },
        });

        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: { sentToday: { increment: 1 }, lastSentAt: new Date() }
        }).catch(() => {});

        return { success: true, messageId: res.data.id || undefined };
      } catch (oauthErr: any) {
        console.warn('Google API OAuth dispatch attempt failed, falling back to SMTP:', oauthErr?.message);
      }
    }

    // DISPATCH METHOD 2: Google App Password (via smtp.gmail.com:465 SSL/TLS)
    if (account.provider === 'GMAIL' || account.email.toLowerCase().includes('@gmail')) {
      const smtpResult = await sendSmtpEmail(
        {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: account.email,
            pass: decryptedSecret,
          },
        },
        {
          from,
          to: prospect.email,
          rawMime,
        }
      );

      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { sentToday: { increment: 1 }, lastSentAt: new Date() }
      }).catch(() => {});

      return {
        success: true,
        messageId: smtpResult.messageId,
        response: smtpResult.response,
      };
    }

    // DISPATCH METHOD 3: Microsoft 365 / Outlook (via smtp.office365.com:587 STARTTLS)
    if (account.provider === 'MICROSOFT' || account.email.toLowerCase().includes('@outlook') || account.email.toLowerCase().includes('@hotmail')) {
      const smtpResult = await sendSmtpEmail(
        {
          host: 'smtp.office365.com',
          port: 587,
          secure: false,
          auth: {
            user: account.email,
            pass: decryptedSecret,
          },
        },
        {
          from,
          to: prospect.email,
          rawMime,
        }
      );

      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { sentToday: { increment: 1 }, lastSentAt: new Date() }
      }).catch(() => {});

      return {
        success: true,
        messageId: smtpResult.messageId,
        response: smtpResult.response,
      };
    }

    // DISPATCH METHOD 4: Universal Custom SMTP Server
    const smtpHost = (account as any).smtpHost || 'smtp.gmail.com';
    const smtpPort = Number((account as any).smtpPort) || 465;
    const smtpResult = await sendSmtpEmail(
      {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: account.email,
          pass: decryptedSecret,
        },
      },
      {
        from,
        to: prospect.email,
        rawMime,
      }
    );

    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { sentToday: { increment: 1 }, lastSentAt: new Date() }
    }).catch(() => {});

    return {
      success: true,
      messageId: smtpResult.messageId,
      response: smtpResult.response,
    };

  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

