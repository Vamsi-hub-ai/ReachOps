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

    const { accountId, spreadsheetId } = event.queryStringParameters || {};
    if (!accountId || !spreadsheetId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'accountId and spreadsheetId are required' }) };
    }

    const account = await prisma.emailAccount.findFirst({
      where: { id: accountId, workspaceId: { in: auth.workspaceIds } }
    });

    if (!account) {
      return forbiddenResponse('Account not found or access denied');
    }

    const googleAuth = await getGoogleClient(accountId);
    const sheets = google.sheets({ version: 'v4', auth: googleAuth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties(sheetId,title)',
    });

    const worksheets = response.data.sheets?.map(s => ({
      id: s.properties?.sheetId,
      title: s.properties?.title
    })) || [];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worksheets }),
    };

  } catch (error: any) {
    console.error('List Worksheets Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to fetch worksheets' }),
    };
  }
};
