import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { getGoogleClient } from '../lib/google-client';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    
    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    const campaignId = event.path.split('/')[3]; // /api/campaigns/[id]/sync-sheet
    if (!campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'campaignId is required' }) };
    }

    // Verify user has access to campaign
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });
    
    const workspaceIds = user?.workspaceMembers.map(m => m.workspaceId) || [];
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

    const mapping = JSON.parse(sheet.columnMappingJson); // { email: "ColA", firstName: "ColB", ... }
    
    // We need an email account to fetch the sheet. We'll find any active one in this workspace.
    // In a full implementation, you might save the exact emailAccountId on the CampaignSheet.
    const account = await prisma.emailAccount.findFirst({
      where: { workspaceId: campaign.workspaceId, provider: 'GMAIL', status: 'ACTIVE' }
    });

    if (!account) {
      return { statusCode: 403, body: JSON.stringify({ error: 'No active Google connection found for this workspace' }) };
    }

    const auth = await getGoogleClient(account.id);
    const sheets = google.sheets({ version: 'v4', auth });

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

    // Helper to find the index of a mapped column
    const getColIndex = (mappedColName: string) => headers.indexOf(mappedColName);

    const emailIdx = mapping.email ? getColIndex(mapping.email) : -1;
    const firstNameIdx = mapping.firstName ? getColIndex(mapping.firstName) : -1;
    const lastNameIdx = mapping.lastName ? getColIndex(mapping.lastName) : -1;
    const companyIdx = mapping.company ? getColIndex(mapping.company) : -1;
    const customFieldsIdx = mapping.customFields ? Object.entries(mapping.customFields).map(([k, v]: [string, any]) => ({ key: k, idx: getColIndex(v) })) : [];

    if (emailIdx === -1) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email column mapping is invalid' }) };
    }

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

      // Upsert Prospect
      const prospect = await prisma.prospect.upsert({
         where: { 
           workspaceId_email: { workspaceId: campaign.workspaceId, email }
         },
         create: {
           workspaceId: campaign.workspaceId,
           email,
           firstName,
           lastName,
           company,
           customData
         },
         update: {
           firstName,
           lastName,
           company,
           customData
         }
      });

      // Add to campaign if not already in it
      await prisma.campaignEnrollment.upsert({
        where: {
          campaignId_prospectId: { campaignId: campaign.id, prospectId: prospect.id }
        },
        create: {
          campaignId: campaign.id,
          prospectId: prospect.id,
          status: 'PENDING'
        },
        update: {}
      });

      syncedCount++;
    }

    // Update last sync time
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
