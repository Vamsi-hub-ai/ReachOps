import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { getGoogleClient } from '../lib/google-client';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    
    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    const emailAccountId = event.queryStringParameters?.accountId;
    if (!emailAccountId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'accountId is required' }) };
    }

    // Verify account belongs to user's workspace
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });
    
    const workspaceIds = user?.workspaceMembers.map(m => m.workspaceId) || [];
    const account = await prisma.emailAccount.findFirst({
      where: { id: emailAccountId, workspaceId: { in: workspaceIds } }
    });

    if (!account) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Account not found or access denied' }) };
    }

    const auth = await getGoogleClient(emailAccountId);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id, name)',
      orderBy: 'modifiedTime desc',
      pageSize: 50,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheets: response.data.files || [] }),
    };

  } catch (error: any) {
    console.error('List Sheets Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to fetch sheets' }),
    };
  }
};
