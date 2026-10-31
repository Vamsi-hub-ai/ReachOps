import { google, sheets_v4 } from 'googleapis';

export const SCHEMA_VERSION = 'reachops-v2.0';

export interface ColumnDefinition {
  key: string;
  header: string;
  category: string;
  width: number;
  description: string;
}

export const REACHOPS_SYSTEM_COLUMNS: ColumnDefinition[] = [
  // A. Contact information
  { key: 'prospect_id', header: 'prospect_id', category: 'Contact', width: 140, description: 'Stable ReachOps prospect unique identifier' },
  { key: 'first_name', header: 'first_name', category: 'Contact', width: 120, description: 'Prospect first name' },
  { key: 'last_name', header: 'last_name', category: 'Contact', width: 120, description: 'Prospect last name' },
  { key: 'email', header: 'email', category: 'Contact', width: 220, description: 'Prospect verified email address' },
  { key: 'company', header: 'company', category: 'Contact', width: 160, description: 'Prospect company name' },
  { key: 'job_title', header: 'job_title', category: 'Contact', width: 160, description: 'Prospect job title or position' },
  { key: 'phone', header: 'phone', category: 'Contact', width: 130, description: 'Prospect phone number' },
  { key: 'website', header: 'website', category: 'Contact', width: 160, description: 'Company or personal website' },
  { key: 'linkedin_url', header: 'linkedin_url', category: 'Contact', width: 200, description: 'LinkedIn profile URL' },
  { key: 'location', header: 'location', category: 'Contact', width: 140, description: 'Prospect geographical location or city' },

  // B. Campaign information
  { key: 'campaign_id', header: 'campaign_id', category: 'Campaign', width: 140, description: 'ReachOps campaign identifier' },
  { key: 'campaign_name', header: 'campaign_name', category: 'Campaign', width: 180, description: 'Outreach campaign title' },
  { key: 'campaign_status', header: 'campaign_status', category: 'Campaign', width: 130, description: 'Campaign status (ACTIVE, DRAFT, PAUSED)' },
  { key: 'mailbox_id', header: 'mailbox_id', category: 'Campaign', width: 130, description: 'Assigned sending mailbox identifier' },
  { key: 'mailbox_email', header: 'mailbox_email', category: 'Campaign', width: 200, description: 'Sending mailbox email address' },
  { key: 'campaign_created_at', header: 'campaign_created_at', category: 'Campaign', width: 160, description: 'Timestamp when campaign was created' },
  { key: 'campaign_started_at', header: 'campaign_started_at', category: 'Campaign', width: 160, description: 'Timestamp when campaign was launched' },

  // C. Email tracking
  { key: 'initial_email_subject', header: 'initial_email_subject', category: 'Email Tracking', width: 220, description: 'Subject line of initial outreach email' },
  { key: 'initial_email_status', header: 'initial_email_status', category: 'Email Tracking', width: 130, description: 'Initial email status (SENT, QUEUED, FAILED)' },
  { key: 'initial_email_sent_at', header: 'initial_email_sent_at', category: 'Email Tracking', width: 160, description: 'Timestamp when initial email was dispatched' },
  { key: 'total_emails_sent', header: 'total_emails_sent', category: 'Email Tracking', width: 120, description: 'Total sequence emails sent to prospect' },
  { key: 'last_email_sent_at', header: 'last_email_sent_at', category: 'Email Tracking', width: 160, description: 'Timestamp of the most recent email sent' },
  { key: 'delivery_status', header: 'delivery_status', category: 'Email Tracking', width: 130, description: 'Deliverability status (DELIVERED, PENDING)' },
  { key: 'bounce_status', header: 'bounce_status', category: 'Email Tracking', width: 120, description: 'Bounce status (NONE, SOFT, HARD)' },
  { key: 'bounce_reason', header: 'bounce_reason', category: 'Email Tracking', width: 180, description: 'SMTP bounce reason or diagnostic code' },

  // D. Follow-up management
  { key: 'followup_count', header: 'followup_count', category: 'Follow-up', width: 120, description: 'Count of automated follow-ups sent' },
  { key: 'current_sequence_step', header: 'current_sequence_step', category: 'Follow-up', width: 140, description: 'Current active sequence step index' },
  { key: 'next_followup_step', header: 'next_followup_step', category: 'Follow-up', width: 140, description: 'Next scheduled sequence step index' },
  { key: 'next_followup_date', header: 'next_followup_date', category: 'Follow-up', width: 130, description: 'Date of next scheduled follow-up' },
  { key: 'next_followup_time', header: 'next_followup_time', category: 'Follow-up', width: 120, description: 'Time of next scheduled follow-up' },
  { key: 'next_followup_timezone', header: 'next_followup_timezone', category: 'Follow-up', width: 150, description: 'Target timezone for dispatching' },
  { key: 'next_followup_at', header: 'next_followup_at', category: 'Follow-up', width: 170, description: 'ISO 8601 UTC timestamp for next follow-up' },
  { key: 'followup_status', header: 'followup_status', category: 'Follow-up', width: 130, description: 'Follow-up state (ACTIVE, PAUSED, SCHEDULED, STOPPED)' },
  { key: 'followup_paused', header: 'followup_paused', category: 'Follow-up', width: 120, description: 'Boolean flag indicating if automated follow-ups are paused' },
  { key: 'followup_pause_reason', header: 'followup_pause_reason', category: 'Follow-up', width: 220, description: 'Reason why follow-ups were paused' },

  // E. Tag management
  { key: 'tags', header: 'tags', category: 'Tags', width: 180, description: 'Comma-separated tags (Lead, Warm, Cold, DNC, etc.)' },
  { key: 'last_tag_applied', header: 'last_tag_applied', category: 'Tags', width: 140, description: 'Most recently applied tag name' },
  { key: 'tag_applied_at', header: 'tag_applied_at', category: 'Tags', width: 160, description: 'Timestamp when last tag was applied' },
  { key: 'tag_applied_by', header: 'tag_applied_by', category: 'Tags', width: 140, description: 'User or system that applied the tag' },
  { key: 'tag_action', header: 'tag_action', category: 'Tags', width: 160, description: 'Action triggered by tag (PAUSE_FOLLOWUP, STOP_SEQUENCE)' },

  // F. Reply management
  { key: 'reply_status', header: 'reply_status', category: 'Replies', width: 130, description: 'Reply status (NONE, REPLIED, INTERESTED, NOT_INTERESTED)' },
  { key: 'reply_received_at', header: 'reply_received_at', category: 'Replies', width: 160, description: 'Timestamp when inbound reply was detected' },
  { key: 'reply_subject', header: 'reply_subject', category: 'Replies', width: 200, description: 'Subject line of received reply' },
  { key: 'reply_content', header: 'reply_content', category: 'Replies', width: 250, description: 'Excerpt/snippet of the inbound reply' },
  { key: 'reply_detected', header: 'reply_detected', category: 'Replies', width: 120, description: 'Boolean flag indicating reply detection' },
  { key: 'sequence_stopped_reason', header: 'sequence_stopped_reason', category: 'Replies', width: 220, description: 'Permanent sequence halt reason (REPLY_RECEIVED, UNSUBSCRIBED)' },

  // G. Manual scheduling
  { key: 'manual_followup_scheduled', header: 'manual_followup_scheduled', category: 'Manual Scheduling', width: 160, description: 'Boolean flag indicating an explicit manual schedule' },
  { key: 'manual_followup_date', header: 'manual_followup_date', category: 'Manual Scheduling', width: 140, description: 'Target date for manual follow-up' },
  { key: 'manual_followup_time', header: 'manual_followup_time', category: 'Manual Scheduling', width: 130, description: 'Target time for manual follow-up' },
  { key: 'manual_followup_timezone', header: 'manual_followup_timezone', category: 'Manual Scheduling', width: 150, description: 'Timezone for manual follow-up' },
  { key: 'manual_followup_at', header: 'manual_followup_at', category: 'Manual Scheduling', width: 170, description: 'ISO 8601 UTC timestamp for manual follow-up' },
  { key: 'manual_followup_status', header: 'manual_followup_status', category: 'Manual Scheduling', width: 150, description: 'Status of manual follow-up (SCHEDULED, SENT, CANCELLED)' },
  { key: 'manual_followup_created_at', header: 'manual_followup_created_at', category: 'Manual Scheduling', width: 170, description: 'Timestamp when manual follow-up was scheduled' },

  // H. Engagement tracking
  { key: 'open_count', header: 'open_count', category: 'Engagement', width: 110, description: 'Total tracked email opens' },
  { key: 'click_count', header: 'click_count', category: 'Engagement', width: 110, description: 'Total tracked link clicks' },
  { key: 'last_opened_at', header: 'last_opened_at', category: 'Engagement', width: 160, description: 'Timestamp of the most recent open' },
  { key: 'last_clicked_at', header: 'last_clicked_at', category: 'Engagement', width: 160, description: 'Timestamp of the most recent click' },

  // I. Compliance and suppression
  { key: 'unsubscribe_status', header: 'unsubscribe_status', category: 'Compliance', width: 140, description: 'Unsubscribe status (NONE, UNSUBSCRIBED)' },
  { key: 'unsubscribed_at', header: 'unsubscribed_at', category: 'Compliance', width: 160, description: 'Timestamp of unsubscribe action' },
  { key: 'do_not_contact', header: 'do_not_contact', category: 'Compliance', width: 120, description: 'Boolean flag marking prospect as DNC' },
  { key: 'suppression_reason', header: 'suppression_reason', category: 'Compliance', width: 180, description: 'Suppression list rule or reason' },

  // J. Management
  { key: 'prospect_status', header: 'prospect_status', category: 'Management', width: 130, description: 'Overall prospect status (NEW, CONTACTED, WARM, WON)' },
  { key: 'last_activity', header: 'last_activity', category: 'Management', width: 180, description: 'Summary description of latest activity' },
  { key: 'created_at', header: 'created_at', category: 'Management', width: 160, description: 'Timestamp when record was imported' },
  { key: 'updated_at', header: 'updated_at', category: 'Management', width: 160, description: 'Timestamp of latest modification' },
  { key: 'notes', header: 'notes', category: 'Management', width: 220, description: 'Free-form sales or outreach notes' },
];

/**
 * Neutralizes potential formula injection characters (=, +, -, @, \t, \r)
 * by prefixing single quote (') so spreadsheets treat it as string literal.
 */
export function sanitizeCellValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Extracts spreadsheet ID from full Google Sheet URL or raw ID
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}

/**
 * Inspects spreadsheet metadata, checks whether sheet is empty or existing,
 * and identifies recognized vs missing ReachOps system columns.
 */
export async function inspectSpreadsheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  targetSheetTitle?: string
) {
  const metaRes = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'spreadsheetId,properties.title,sheets(properties(sheetId,title,index,gridProperties))',
  });

  const sheetList = metaRes.data.sheets || [];
  if (sheetList.length === 0) {
    throw new Error('Spreadsheet has no worksheets.');
  }

  const selectedSheet = targetSheetTitle 
    ? sheetList.find(s => s.properties?.title?.toLowerCase() === targetSheetTitle.toLowerCase()) || sheetList[0]
    : sheetList[0];

  const sheetTitle = selectedSheet.properties?.title || 'Sheet1';
  const sheetId = selectedSheet.properties?.sheetId ?? 0;
  const rowCount = selectedSheet.properties?.gridProperties?.rowCount || 1000;
  const columnCount = selectedSheet.properties?.gridProperties?.columnCount || 26;

  // Read row 1 headers
  let existingHeaders: string[] = [];
  try {
    const valRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle}'!1:1`,
    });
    existingHeaders = (valRes.data.values?.[0] || []).map(h => String(h || '').trim());
  } catch (err: any) {
    console.warn(`Could not read headers from '${sheetTitle}':`, err.message);
  }

  const isEmpty = existingHeaders.length === 0 || existingHeaders.every(h => !h);

  // Match recognized vs missing columns
  const normalizedExisting = existingHeaders.map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
  const recognizedColumns: { header: string; matchedSystemKey: string }[] = [];
  const missingColumns: ColumnDefinition[] = [];

  for (const sysCol of REACHOPS_SYSTEM_COLUMNS) {
    const normalizedKey = sysCol.key.toLowerCase().replace(/[\s_-]+/g, '');
    const foundIdx = normalizedExisting.findIndex(e => e === normalizedKey);
    if (foundIdx !== -1) {
      recognizedColumns.push({
        header: existingHeaders[foundIdx],
        matchedSystemKey: sysCol.key,
      });
    } else {
      missingColumns.push(sysCol);
    }
  }

  const customColumns = existingHeaders.filter(h => {
    const norm = h.toLowerCase().replace(/[\s_-]+/g, '');
    return !REACHOPS_SYSTEM_COLUMNS.some(sys => sys.key.toLowerCase().replace(/[\s_-]+/g, '') === norm);
  });

  return {
    spreadsheetId,
    spreadsheetTitle: metaRes.data.properties?.title || 'ReachOps Outreach Database',
    sheetId,
    sheetTitle,
    worksheets: sheetList.map(s => ({
      id: s.properties?.sheetId,
      title: s.properties?.title || 'Untitled',
      index: s.properties?.index,
    })),
    isEmpty,
    existingHeaders,
    recognizedColumns,
    missingColumns,
    customColumns,
    totalSystemColumns: REACHOPS_SYSTEM_COLUMNS.length,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Automatically initializes an empty sheet with all ReachOps system columns,
 * freezes header row, sets dark professional formatting, column widths, and enables filters.
 */
export async function initializeEmptySpreadsheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetId: number,
  sheetTitle: string
) {
  const headers = REACHOPS_SYSTEM_COLUMNS.map(c => c.header);

  // 1. Ensure sheet has enough columns
  if (headers.length > 26) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                gridProperties: {
                  columnCount: Math.max(headers.length + 5, 75),
                  rowCount: 1000,
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.columnCount,gridProperties.rowCount,gridProperties.frozenRowCount',
            },
          },
        ],
      },
    });
  }

  // 2. Write Header Row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [headers],
    },
  });

  // 3. Apply Professional Header Styling & Column Widths
  const requests: sheets_v4.Schema$Request[] = [
    // Freeze row 1
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    },
    // Header Style: Charcoal background (#171717), White bold text, centered vertical
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: headers.length,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: {
              red: 0.09, // #171717 Charcoal Black
              green: 0.09,
              blue: 0.09,
            },
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 10,
              fontFamily: 'Google Sans',
            },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
            padding: { top: 6, bottom: 6, left: 8, right: 8 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)',
      },
    },
    // Auto-filter on all system columns
    {
      setBasicFilter: {
        filter: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1000,
            startColumnIndex: 0,
            endColumnIndex: headers.length,
          },
        },
      },
    },
  ];

  // Set explicit column widths
  REACHOPS_SYSTEM_COLUMNS.forEach((col, idx) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: idx,
          endIndex: idx + 1,
        },
        properties: {
          pixelSize: col.width,
        },
        fields: 'pixelSize',
      },
    });
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });

  return {
    success: true,
    sheetTitle,
    sheetId,
    headersCreated: headers.length,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * For existing sheets with user data:
 * Preserves all user columns, never renames or overwrites existing data,
 * and safely appends missing ReachOps system columns at the end with formatting.
 */
export async function appendMissingReachOpsColumns(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetId: number,
  sheetTitle: string,
  existingHeaders: string[],
  missingColumns: ColumnDefinition[]
) {
  if (missingColumns.length === 0) {
    return {
      success: true,
      addedCount: 0,
      message: 'All ReachOps system columns already present.',
      allHeaders: existingHeaders,
    };
  }

  const startColIdx = existingHeaders.length;
  const newHeaders = missingColumns.map(c => c.header);
  const totalColsNeeded = startColIdx + newHeaders.length;

  // 1. Expand sheet column count if necessary
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: {
                columnCount: Math.max(totalColsNeeded + 5, 80),
                frozenRowCount: 1,
              },
            },
            fields: 'gridProperties.columnCount,gridProperties.frozenRowCount',
          },
        },
      ],
    },
  });

  // 2. Helper to convert column number (0-indexed) to letter (A, B, ..., AA, etc.)
  function colIndexToA1(idx: number): string {
    let result = '';
    let n = idx;
    while (n >= 0) {
      result = String.fromCharCode((n % 26) + 65) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  }

  const startLetter = colIndexToA1(startColIdx);
  const range = `'${sheetTitle}'!${startLetter}1`;

  // 3. Write appended columns safely
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newHeaders],
    },
  });

  // 4. Style appended columns with signature dark header
  const requests: sheets_v4.Schema$Request[] = [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: startColIdx,
          endColumnIndex: totalColsNeeded,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.09, green: 0.09, blue: 0.09 },
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 10,
              fontFamily: 'Google Sans',
            },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
            padding: { top: 6, bottom: 6, left: 8, right: 8 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)',
      },
    },
  ];

  // Set widths for added columns
  missingColumns.forEach((col, idx) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: startColIdx + idx,
          endIndex: startColIdx + idx + 1,
        },
        properties: {
          pixelSize: col.width,
        },
        fields: 'pixelSize',
      },
    });
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });

  return {
    success: true,
    addedCount: newHeaders.length,
    addedColumns: newHeaders,
    allHeaders: [...existingHeaders, ...newHeaders],
    message: `Safely appended ${newHeaders.length} missing ReachOps system columns without altering existing data.`,
  };
}

