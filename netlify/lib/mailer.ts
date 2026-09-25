import { google } from 'googleapis';
import { getGoogleClient } from './google-client';
import prisma from './prisma';

interface ProspectData {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  customData?: any;
}

export function replaceVariables(text: string, prospect: ProspectData): string {
  if (!text) return '';
  return text
    .replace(/\{\{email\}\}/g, prospect.email || '')
    .replace(/\{\{firstName\}\}/g, prospect.firstName || '')
    .replace(/\{\{lastName\}\}/g, prospect.lastName || '')
    .replace(/\{\{company\}\}/g, prospect.company || '');
}

function encodeBase64Url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function stripHtml(html: string): string {
  // Basic HTML to text conversion for the plain text fallback
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

function createMimeMessage(to: string, from: string, subject: string, htmlBody: string, messageId: string): string {
  const boundary = `----=_NextPart_${Math.random().toString(36).substring(2)}`;
  const plainTextBody = stripHtml(htmlBody);
  const baseUrl = process.env.URL || 'http://localhost:8888';
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${messageId}`;

  const mimeStr = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `List-Unsubscribe: <${unsubscribeUrl}>`,
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
  messageId: string
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    const account = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId }
    });

    if (!account) throw new Error('Email account not found');

    const auth = await getGoogleClient(emailAccountId);
    const gmail = google.gmail({ version: 'v1', auth });

    const subject = replaceVariables(rawSubject, prospect);
    let bodyHtml = replaceVariables(rawBodyHtml, prospect);
    
    // Inject tracking pixel
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const trackingPixel = `<img src="${baseUrl}/api/track/open/${messageId}.gif" width="1" height="1" style="display:none;" />`;
    bodyHtml += trackingPixel;

    const from = `${account.displayName} <${account.email}>`;

    const raw = createMimeMessage(prospect.email, from, subject, bodyHtml, messageId);

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
