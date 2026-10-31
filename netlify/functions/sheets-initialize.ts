import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { getGoogleClient } from '../lib/google-client';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';
import { 
  extractSpreadsheetId, 
  inspectSpreadsheet, 
  initializeEmptySpreadsheet, 
  appendMissingReachOpsColumns,
  REACHOPS_SYSTEM_COLUMNS,
  SCHEMA_VERSION
} from '../lib/google-sheets-service';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    let payload: any = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {}

    const { accountId, sheetName, campaignId } = payload;
    const rawSpreadsheet = payload.spreadsheetUrl || payload.spreadsheetId;

    if (!rawSpreadsheet) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'spreadsheetUrl or spreadsheetId is required' }),
      };
    }

    const spreadsheetId = extractSpreadsheetId(rawSpreadsheet);

    // Find active Gmail account in workspace
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

    // Demo Mode Simulation
    if (!account || auth.isDemo) {
      const isKnownEmpty = rawSpreadsheet.toLowerCase().includes('empty');
      const targetSheet = sheetName || 'Sheet1';

      // Record in CampaignSheet if campaignId provided
      if (campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: { id: campaignId, workspaceId: { in: auth.workspaceIds } },
          include: { sheet: true }
        });
        if (campaign) {
          if (campaign.sheet) {
            await prisma.campaignSheet.update({
              where: { id: campaign.sheet.id },
              data: {
                spreadsheetId,
                sheetName: targetSheet,
                lastSyncedAt: new Date(),
              }
            });
          } else {
            await prisma.campaignSheet.create({
              data: {
                campaignId: campaign.id,
                spreadsheetId,
                sheetId: '0',
                sheetName: targetSheet,
                lastSyncedAt: new Date(),
              }
            });
          }
        }
      }

      if (isKnownEmpty) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            isDemoSimulation: true,
            mode: 'empty_generated',
            sheetTitle: targetSheet,
            columnsCreated: REACHOPS_SYSTEM_COLUMNS.length,
            frozenRows: 1,
            filtersEnabled: true,
            schemaVersion: SCHEMA_VERSION,
            message: `ReachOps schema initialized! Generated ${REACHOPS_SYSTEM_COLUMNS.length} system columns, froze header row, applied dark theme styling, and enabled filters.`,
          }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          isDemoSimulation: true,
          mode: 'columns_appended',
          sheetTitle: targetSheet,
          columnsAppended: REACHOPS_SYSTEM_COLUMNS.length - 4,
          preservedUserColumns: ['First Name', 'Last Name', 'Email', 'Company', 'Industry', 'Lead Score'],
          schemaVersion: SCHEMA_VERSION,
          message: `Successfully preserved existing user data and appended ${REACHOPS_SYSTEM_COLUMNS.length - 4} missing ReachOps system columns.`,
        }),
      };
    }

    // Live Google Sheets API Execution
    const googleAuth = await getGoogleClient(account.id);
    const sheets = google.sheets({ version: 'v4', auth: googleAuth });

    // Inspect first to determine if empty or existing
    const inspection = await inspectSpreadsheet(sheets, spreadsheetId, sheetName);

    let result: any = {};
    if (inspection.isEmpty) {
      result = await initializeEmptySpreadsheet(
        sheets,
        spreadsheetId,
        inspection.sheetId,
        inspection.sheetTitle
      );
      result.mode = 'empty_generated';
      result.message = `Generated full ReachOps column schema (${result.headersCreated} columns) with frozen header and formatting.`;
    } else {
      result = await appendMissingReachOpsColumns(
        sheets,
        spreadsheetId,
        inspection.sheetId,
        inspection.sheetTitle,
        inspection.existingHeaders,
        inspection.missingColumns
      );
      result.mode = 'columns_appended';
    }

    // Link CampaignSheet if campaignId provided
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, workspaceId: { in: auth.workspaceIds } },
        include: { sheet: true },
      });
      if (campaign) {
        if (campaign.sheet) {
          await prisma.campaignSheet.update({
            where: { id: campaign.sheet.id },
            data: {
              spreadsheetId,
              sheetId: String(inspection.sheetId),
              sheetName: inspection.sheetTitle,
              lastSyncedAt: new Date(),
            },
          });
        } else {
          await prisma.campaignSheet.create({
            data: {
              campaignId: campaign.id,
              spreadsheetId,
              sheetId: String(inspection.sheetId),
              sheetName: inspection.sheetTitle,
              lastSyncedAt: new Date(),
            },
          });
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        isDemoSimulation: false,
        ...result,
      }),
    };
  } catch (error: any) {
    console.error('Initialize Sheet Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Failed to initialize spreadsheet schema' }),
    };
  }
};

