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

    const { accountId, spreadsheetId } = event.queryStringParameters || {};
    if (!accountId || !spreadsheetId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'accountId and spreadsheetId are required' }) };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });
    
    const workspaceIds = user?.workspaceMembers.map(m => m.workspaceId) || [];
    const account = await prisma.emailAccount.findFirst({
      where: { id: accountId, workspaceId: { in: workspaceIds } }
    });

    if (!account) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Account not found or access denied' }) };
    }

    const auth = await getGoogleClient(accountId);
    const sheets = google.sheets({ version: 'v4', auth });

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
