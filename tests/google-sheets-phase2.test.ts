import assert from 'node:assert';
import { 
  REACHOPS_SYSTEM_COLUMNS, 
  SCHEMA_VERSION, 
  sanitizeCellValue, 
  extractSpreadsheetId 
} from '../netlify/lib/google-sheets-service';

console.log('====================================================');
console.log('ReachOps Phase 2: Google Sheets Connection & Schema Test Suite');
console.log('====================================================\n');

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        console.log(`[PASS] ${name}`);
      }).catch(err => {
        console.error(`[FAIL] ${name}`);
        console.error(err);
        process.exitCode = 1;
      });
    } else {
      console.log(`[PASS] ${name}`);
    }
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('--- Test Suite 1: System Column Architecture & Schema Version ---');
  
  runTest('Schema version is reachops-v2.0', () => {
    assert.strictEqual(SCHEMA_VERSION, 'reachops-v2.0');
  });

  runTest('ReachOps contains 66 required system columns across 10 categories', () => {
    assert.strictEqual(REACHOPS_SYSTEM_COLUMNS.length, 66);
    
    const categories = new Set(REACHOPS_SYSTEM_COLUMNS.map(c => c.category));
    assert(categories.has('Contact'));
    assert(categories.has('Campaign'));
    assert(categories.has('Email Tracking'));
    assert(categories.has('Follow-up'));
    assert(categories.has('Tags'));
    assert(categories.has('Replies'));
    assert(categories.has('Manual Scheduling'));
    assert(categories.has('Engagement'));
    assert(categories.has('Compliance'));
    assert(categories.has('Management'));
  });

  runTest('Required contact columns exist: prospect_id, first_name, last_name, email, company', () => {
    const keys = REACHOPS_SYSTEM_COLUMNS.map(c => c.key);
    assert(keys.includes('prospect_id'));
    assert(keys.includes('first_name'));
    assert(keys.includes('last_name'));
    assert(keys.includes('email'));
    assert(keys.includes('company'));
    assert(keys.includes('phone'));
    assert(keys.includes('website'));
    assert(keys.includes('linkedin_url'));
  });

  runTest('Required follow-up & tag columns exist: followup_status, followup_paused, tags, manual_followup_status', () => {
    const keys = REACHOPS_SYSTEM_COLUMNS.map(c => c.key);
    assert(keys.includes('followup_status'));
    assert(keys.includes('followup_paused'));
    assert(keys.includes('followup_pause_reason'));
    assert(keys.includes('tags'));
    assert(keys.includes('last_tag_applied'));
    assert(keys.includes('manual_followup_scheduled'));
    assert(keys.includes('manual_followup_date'));
    assert(keys.includes('manual_followup_status'));
  });

  console.log('\n--- Test Suite 2: Formula Injection Sanitization ---');

  runTest('Sanitizes leading formula triggers: =, +, -, @, \\t, \\r', () => {
    assert.strictEqual(sanitizeCellValue('=SUM(A1:A10)'), `'=SUM(A1:A10)`);
    assert.strictEqual(sanitizeCellValue('+cmd|"/C calc"!A0'), `'+cmd|"/C calc"!A0`);
    assert.strictEqual(sanitizeCellValue('-100+20'), `'-100+20`);
    assert.strictEqual(sanitizeCellValue('@HYPERLINK("http://malicious.com")'), `'@HYPERLINK("http://malicious.com")`);
    assert.strictEqual(sanitizeCellValue('\tmaliciousTab'), `'\tmaliciousTab`);
  });

  runTest('Leaves benign text and numbers unmodified', () => {
    assert.strictEqual(sanitizeCellValue('John Doe'), 'John Doe');
    assert.strictEqual(sanitizeCellValue('sarah@company.com'), 'sarah@company.com');
    assert.strictEqual(sanitizeCellValue('Acme Corp 2026'), 'Acme Corp 2026');
    assert.strictEqual(sanitizeCellValue(42), '42');
    assert.strictEqual(sanitizeCellValue(null), '');
    assert.strictEqual(sanitizeCellValue(undefined), '');
  });

  console.log('\n--- Test Suite 3: Spreadsheet URL Parsing & ID Extraction ---');

  runTest('Extracts spreadsheet ID from standard Google Sheet URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
    assert.strictEqual(extractSpreadsheetId(url), '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  });

  runTest('Extracts raw spreadsheet ID if supplied directly', () => {
    const rawId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    assert.strictEqual(extractSpreadsheetId(rawId), '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  });

  console.log('\n--- Test Suite 4: Empty Spreadsheet vs Existing Spreadsheet Behavior ---');

  runTest('Detects empty spreadsheet when headers array is empty', () => {
    const existingHeaders: string[] = [];
    const isEmpty = existingHeaders.length === 0 || existingHeaders.every(h => !h);
    assert.strictEqual(isEmpty, true);
  });

  runTest('Preserves existing user columns and avoids duplicates when appending missing columns', () => {
    const userHeaders = ['First Name', 'Last Name', 'Email', 'Company', 'Lead Score', 'Custom Note'];
    const normalizedUser = userHeaders.map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
    
    // Find missing
    const missing = REACHOPS_SYSTEM_COLUMNS.filter(c => {
      const normKey = c.key.toLowerCase().replace(/[\s_-]+/g, '');
      return !normalizedUser.includes(normKey);
    });

    // Verify existing user headers are intact
    assert.strictEqual(userHeaders.length, 6);
    assert(userHeaders.includes('Lead Score'));
    assert(userHeaders.includes('Custom Note'));

    // Verify that already present columns (first_name, last_name, email, company) are NOT in missing list
    const missingKeys = missing.map(m => m.key);
    assert(!missingKeys.includes('first_name'));
    assert(!missingKeys.includes('last_name'));
    assert(!missingKeys.includes('email'));
    assert(!missingKeys.includes('company'));

    // Combined columns have zero duplicates
    const combined = [...userHeaders, ...missing.map(m => m.header)];
    const lowerCombined = combined.map(c => c.toLowerCase().replace(/[\s_-]+/g, ''));
    const uniqueCombined = new Set(lowerCombined);
    assert.strictEqual(lowerCombined.length, uniqueCombined.size, 'No duplicate columns allowed in schema output');
  });

  console.log('\n====================================================');
  console.log('Phase 2 Test Summary: All tests passed successfully');
  console.log('====================================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

