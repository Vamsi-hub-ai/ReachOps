import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { getGoogleClient } from '../lib/google-client';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '../lib/auth';
import { 
  extractSpreadsheetId, 
  inspectSpreadsheet, 
  REACHOPS_SYSTEM_COLUMNS, 
  SCHEMA_VERSION 
} from '../lib/google-sheets-service';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    let payload: any = {};
    if (event.httpMethod === 'POST') {
      try {
        payload = JSON.parse(event.body || '{}');
      } catch {}
    } else {
      payload = event.queryStringParameters || {};
    }

    const { accountId, sheetName } = payload;
    const rawSpreadsheet = payload.spreadsheetUrl || payload.spreadsheetId;

    if (!rawSpreadsheet) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'spreadsheetUrl or spreadsheetId is required' }),
      };
    }

    const spreadsheetId = extractSpreadsheetId(rawSpreadsheet);

    // Look for Gmail email account in user's workspace
    let account = null;
    if (accountId) {
      account = await prisma.emailAccount.findFirst({
        where: { id: accountId, workspaceId: { in: auth.workspaceIds } },
      });
    } else {
      account = await prisma.emailAccount.findFirst({
        where: { workspaceId: { in: auth.workspaceIds }, provider: 'GMAIL', status: 'ACTIVE' },
      });
    }

    // Demo Mode fallback inspection (if no live Google account is connected)
    if (!account || auth.isDemo) {
      const isKnownEmpty = rawSpreadsheet.toLowerCase().includes('empty');
      const isExistingSample = rawSpreadsheet.toLowerCase().includes('existing');

      if (isKnownEmpty) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            isDemoSimulation: true,
            spreadsheetId,
            spreadsheetTitle: 'Outreach Prospects Database (New)',
            sheetId: 0,
            sheetTitle: sheetName || 'Sheet1',
            worksheets: [
              { id: 0, title: 'Sheet1', index: 0 },
              { id: 1, title: 'Archived', index: 1 },
            ],
            isEmpty: true,
            existingHeaders: [],
            recognizedColumns: [],
            missingColumns: REACHOPS_SYSTEM_COLUMNS,
            customColumns: [],
            totalSystemColumns: REACHOPS_SYSTEM_COLUMNS.length,
            schemaVersion: SCHEMA_VERSION,
            message: 'Spreadsheet detected as empty. Ready for ReachOps automatic column generation.',
          }),
        };
      }

      // Default sample existing sheet in demo mode
      const sampleHeaders = ['First Name', 'Last Name', 'Email', 'Company', 'Industry', 'Lead Score'];
      const recognized = [
        { header: 'First Name', matchedSystemKey: 'first_name' },
        { header: 'Last Name', matchedSystemKey: 'last_name' },
        { header: 'Email', matchedSystemKey: 'email' },
        { header: 'Company', matchedSystemKey: 'company' },
      ];
      const custom = ['Industry', 'Lead Score'];
      const missing = REACHOPS_SYSTEM_COLUMNS.filter(c => 
        !['first_name', 'last_name', 'email', 'company'].includes(c.key)
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          isDemoSimulation: true,
          spreadsheetId,
          spreadsheetTitle: 'Q4 High-Growth SaaS Prospects',
          sheetId: 0,
          sheetTitle: sheetName || 'Prospects',
          worksheets: [
            { id: 0, title: 'Prospects', index: 0 },
            { id: 1, title: 'Suppressed Leads', index: 1 },
          ],
          isEmpty: false,
          existingHeaders: sampleHeaders,
          recognizedColumns: recognized,
          missingColumns: missing,
          customColumns: custom,
          totalSystemColumns: REACHOPS_SYSTEM_COLUMNS.length,
          schemaVersion: SCHEMA_VERSION,
          message: 'Found existing spreadsheet with 4 recognized contact fields and 2 custom columns. Ready to safely append missing system columns.',
        }),
      };
    }

    // Live Google API inspection
    const googleAuth = await getGoogleClient(account.id);
    const sheets = google.sheets({ version: 'v4', auth: googleAuth });

    const inspection = await inspectSpreadsheet(sheets, spreadsheetId, sheetName);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        isDemoSimulation: false,
        ...inspection,
      }),
    };
  } catch (error: any) {
    console.error('Inspect Sheet Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Failed to inspect spreadsheet' }),
    };
  }
};

