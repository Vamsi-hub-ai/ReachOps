import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { getGoogleClient } from '../lib/google-client';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceIds } = auth;

    const match = event.path.match(/\/campaigns\/([^/]+)/);
    const campaignId = match ? match[1] : (event.queryStringParameters?.id || event.queryStringParameters?.campaignId);

    if (!campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'campaignId is required' }) };
    }

    // Verify user has access to campaign
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: { in: workspaceIds } },
      include: { sheet: true }
    });

    if (!campaign || !campaign.sheet) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Campaign or CampaignSheet not found' }) };
    }

    const { sheet } = campaign;
    if (!sheet.columnMappingJson) {
       return { statusCode: 400, body: JSON.stringify({ error: 'Column mapping not configured' }) };
    }

    const mapping = JSON.parse(sheet.columnMappingJson);

    const account = await prisma.emailAccount.findFirst({
      where: { workspaceId: campaign.workspaceId, provider: 'GMAIL', status: 'ACTIVE' }
    });

    if (!account) {
      return { statusCode: 403, body: JSON.stringify({ error: 'No active Google connection found for this workspace' }) };
    }

    const googleAuth = await getGoogleClient(account.id);
    const sheets = google.sheets({ version: 'v4', auth: googleAuth });

    // Fetch the sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheet.spreadsheetId,
      range: sheet.sheetName,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
       return { statusCode: 200, body: JSON.stringify({ message: 'No data found in sheet', synced: 0 }) };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    let syncedCount = 0;

    const getColIndex = (mappedColName: string) => headers.indexOf(mappedColName);

    const emailIdx = mapping.email ? getColIndex(mapping.email) : -1;
    const firstNameIdx = mapping.firstName ? getColIndex(mapping.firstName) : -1;
    const lastNameIdx = mapping.lastName ? getColIndex(mapping.lastName) : -1;
    const companyIdx = mapping.company ? getColIndex(mapping.company) : -1;
    const customFieldsIdx = mapping.customFields ? Object.entries(mapping.customFields).map(([k, v]: [string, any]) => ({ key: k, idx: getColIndex(v) })) : [];

    if (emailIdx === -1) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email column mapping is invalid' }) };
    }

    const sequence = await prisma.sequence.findFirst({
      where: { campaignId: campaign.id }
    });

    for (const row of dataRows) {
      const email = row[emailIdx];
      if (!email) continue;

      const firstName = firstNameIdx !== -1 ? row[firstNameIdx] : null;
      const lastName = lastNameIdx !== -1 ? row[lastNameIdx] : null;
      const company = companyIdx !== -1 ? row[companyIdx] : null;
      
      const customData: any = {};
      customFieldsIdx.forEach(({key, idx}) => {
         if (idx !== -1) customData[key] = row[idx];
      });
      const customFieldsJson = Object.keys(customData).length > 0 ? JSON.stringify(customData) : null;

      let prospect = await prisma.prospect.findFirst({
         where: { campaignId: campaign.id, email }
      });

      if (prospect) {
         prospect = await prisma.prospect.update({
           where: { id: prospect.id },
           data: { firstName, lastName, company, customFieldsJson }
         });
      } else {
         prospect = await prisma.prospect.create({
           data: {
             campaignId: campaign.id,
             email,
             firstName,
             lastName,
             company,
             customFieldsJson
           }
         });
      }

      const existingEnrollment = await prisma.campaignEnrollment.findFirst({
        where: { campaignId: campaign.id, prospectId: prospect.id }
      });

      if (!existingEnrollment && sequence) {
        await prisma.campaignEnrollment.create({
          data: {
            campaignId: campaign.id,
            sequenceId: sequence.id,
            prospectId: prospect.id,
            status: 'PENDING'
          }
        });
      }

      syncedCount++;
    }

    await prisma.campaignSheet.update({
      where: { id: sheet.id },
      data: { lastSyncedAt: new Date() }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Sync complete', synced: syncedCount }),
    };

  } catch (error: any) {
    console.error('Sync Sheet Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to sync sheet' }),
    };
  }
};
