import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { getGoogleClient } from '../lib/google-client';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const emailAccountId = event.queryStringParameters?.accountId;
    if (!emailAccountId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'accountId is required' }) };
    }

    // Verify account belongs to user's workspace
    const account = await prisma.emailAccount.findFirst({
      where: { id: emailAccountId, workspaceId: { in: auth.workspaceIds } }
    });

    if (!account) {
      return forbiddenResponse('Account not found or access denied');
    }

    const googleAuth = await getGoogleClient(emailAccountId);
    const drive = google.drive({ version: 'v3', auth: googleAuth });

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
