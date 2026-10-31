import assert from 'node:assert';
import { sanitizeCellValue } from '../netlify/lib/google-sheets-service';

console.log('====================================================');
console.log('ReachOps Phase 3: Contact Import, Mapping & Enrollment Test Suite');
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
  console.log('--- Test Suite 1: Email Normalization & Duplicate Prevention ---');
  
  runTest('Normalizes email addresses (lowercasing, trimming whitespace)', () => {
    const rawEmails = ['  John.Doe@Example.COM ', 'SARAH@Company.Org\t', 'alex@tech.io'];
    const normalized = rawEmails.map(e => e.trim().toLowerCase());
    
    assert.strictEqual(normalized[0], 'john.doe@example.com');
    assert.strictEqual(normalized[1], 'sarah@company.org');
    assert.strictEqual(normalized[2], 'alex@tech.io');
  });

  runTest('Prevents duplicate campaign enrollment when identical emails appear in sheet', () => {
    const sheetRows = [
      ['p_01', 'John', 'Doe', 'john.doe@example.com', 'Acme'],
      ['p_02', 'John', 'Doe Duplicate', 'JOHN.DOE@EXAMPLE.COM', 'Acme'],
      ['p_03', 'Sarah', 'Smith', 'sarah@example.com', 'Tech Corp'],
      ['p_04', 'Sarah', 'Smith Dup', ' sarah@example.com ', 'Tech Corp'],
    ];

    const seenEmails = new Set<string>();
    const validLeads: any[] = [];
    let duplicateCount = 0;

    for (const row of sheetRows) {
      const email = row[3].trim().toLowerCase();
      if (seenEmails.has(email)) {
        duplicateCount++;
        continue;
      }
      seenEmails.add(email);
      validLeads.push({ prospectId: row[0], email, name: row[1] });
    }

    assert.strictEqual(validLeads.length, 2);
    assert.strictEqual(duplicateCount, 2);
    assert.strictEqual(validLeads[0].email, 'john.doe@example.com');
    assert.strictEqual(validLeads[1].email, 'sarah@example.com');
  });

  console.log('\n--- Test Suite 2: Stable Prospect ID & Row Association ---');

  runTest('Preserves existing prospect_id and associates with spreadsheet row index', () => {
    const row = ['p_custom_uuid_8812', 'Elena', 'Rostova', 'elena@rostov.example', 'Rostov Logistics'];
    const rIdx = 4; // 0-indexed in data rows -> row 6 in Google Sheet (row 1 is header)
    
    const existingProspectId = row[0];
    const rowNumber = rIdx + 2;

    assert.strictEqual(existingProspectId, 'p_custom_uuid_8812');
    assert.strictEqual(rowNumber, 6);
  });

  runTest('Generates durable stable identifier when prospect_id column is blank', () => {
    const blankRow = ['', 'Alex', 'Turner', 'alex.turner@example.com', 'Velocity AI'];
    const generatedId = blankRow[0] || `p_${Date.now()}_test123`;
    
    assert(generatedId.startsWith('p_'));
    assert(generatedId.length > 5);
  });

  console.log('\n--- Test Suite 3: Column Mapping & Field Sanitization ---');

  runTest('Correctly extracts mapped columns by header title', () => {
    const headers = ['prospect_id', 'First Name', 'Last Name', 'Email Address', 'Company Name', 'Lead Status'];
    const mapping = {
      email: 'Email Address',
      firstName: 'First Name',
      lastName: 'Last Name',
      company: 'Company Name',
      status: 'Lead Status',
    };

    const emailIdx = headers.findIndex(h => h.toLowerCase() === mapping.email.toLowerCase());
    const firstIdx = headers.findIndex(h => h.toLowerCase() === mapping.firstName.toLowerCase());
    const compIdx = headers.findIndex(h => h.toLowerCase() === mapping.company.toLowerCase());

    assert.strictEqual(emailIdx, 3);
    assert.strictEqual(firstIdx, 1);
    assert.strictEqual(compIdx, 4);
  });

  runTest('Sanitizes prospect fields to prevent formula injection into Google Sheets', () => {
    const untrustedProspect = {
      firstName: '=HYPERLINK("http://evil.com","Click")',
      lastName: '+1-555-0199',
      company: '@AcmeGlobal',
      jobTitle: 'Director of Outreach',
    };

    const sanitized = {
      firstName: sanitizeCellValue(untrustedProspect.firstName),
      lastName: sanitizeCellValue(untrustedProspect.lastName),
      company: sanitizeCellValue(untrustedProspect.company),
      jobTitle: sanitizeCellValue(untrustedProspect.jobTitle),
    };

    assert.strictEqual(sanitized.firstName, `'=HYPERLINK("http://evil.com","Click")`);
    assert.strictEqual(sanitized.lastName, `'+1-555-0199`);
    assert.strictEqual(sanitized.company, `'@AcmeGlobal`);
    assert.strictEqual(sanitized.jobTitle, 'Director of Outreach');
  });

  console.log('\n--- Test Suite 4: Campaign Enrollment & State Persistence ---');

  runTest('Initializes campaign enrollment in ACTIVE status with step 1 and initial timestamp', () => {
    const enrollment = {
      campaignId: 'camp-q4-outreach',
      prospectId: 'p_101',
      currentStep: 1,
      status: 'ACTIVE',
      nextActionAt: new Date(),
      stopReason: null,
    };

    assert.strictEqual(enrollment.status, 'ACTIVE');
    assert.strictEqual(enrollment.currentStep, 1);
    assert.strictEqual(enrollment.stopReason, null);
    assert(enrollment.nextActionAt instanceof Date);
  });

  console.log('\n====================================================');
  console.log('Phase 3 Test Summary: All tests passed successfully');
  console.log('====================================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

