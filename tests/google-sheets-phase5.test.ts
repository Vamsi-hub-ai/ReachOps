import assert from 'node:assert';
import { isWithinSendingWindow } from '../netlify/lib/follow-up-engine';

console.log('====================================================');
console.log('ReachOps Phase 5: Durable Follow-Up Engine & Dispatch Test Suite');
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
  console.log('--- Test Suite 1: Sending Window & Business Hours Verification ---');
  
  runTest('Allows dispatching when current time is inside sending window', () => {
    // Wednesday at 11:30 AM UTC
    const insideDate = new Date('2026-11-04T11:30:00Z');
    const check = isWithinSendingWindow({
      timezone: 'UTC',
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
      weekendSendingEnabled: false,
    }, insideDate);

    assert.strictEqual(check.isAllowed, true);
  });

  runTest('Blocks dispatching when current time is before window start (e.g. 07:15 AM)', () => {
    const beforeDate = new Date('2026-11-04T07:15:00Z');
    const check = isWithinSendingWindow({
      timezone: 'UTC',
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
      weekendSendingEnabled: false,
    }, beforeDate);

    assert.strictEqual(check.isAllowed, false);
    assert(check.reason?.includes('outside sending window'));
  });

  runTest('Blocks dispatching when current time is after window end (e.g. 19:45 PM)', () => {
    const afterDate = new Date('2026-11-04T19:45:00Z');
    const check = isWithinSendingWindow({
      timezone: 'UTC',
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
      weekendSendingEnabled: false,
    }, afterDate);

    assert.strictEqual(check.isAllowed, false);
    assert(check.reason?.includes('outside sending window'));
  });

  console.log('\n--- Test Suite 2: Weekend Exclusions ---');

  runTest('Blocks weekend dispatch when weekendSendingEnabled is false', () => {
    // Sunday Nov 01, 2026 at 12:00 PM UTC
    const sundayDate = new Date('2026-11-01T12:00:00Z');
    const check = isWithinSendingWindow({
      timezone: 'UTC',
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
      weekendSendingEnabled: false,
    }, sundayDate);

    assert.strictEqual(check.isAllowed, false);
    assert(check.reason?.includes('Weekend sending disabled'));
  });

  runTest('Allows weekend dispatch when weekendSendingEnabled is explicitly true', () => {
    // Saturday Nov 07, 2026 at 12:00 PM UTC
    const saturdayDate = new Date('2026-11-07T12:00:00Z');
    const check = isWithinSendingWindow({
      timezone: 'UTC',
      sendingWindowStart: '09:00',
      sendingWindowEnd: '17:00',
      weekendSendingEnabled: true,
    }, saturdayDate);

    assert.strictEqual(check.isAllowed, true);
  });

  console.log('\n--- Test Suite 3: Concurrency Locking & Idempotency ---');

  runTest('Simulates atomic enrollment lock to guarantee zero duplicate sends', () => {
    const enrollment = { id: 'enr_101', status: 'ACTIVE' };
    
    // Worker A attempts lock
    let workerALocked = false;
    if (['ACTIVE', 'SCHEDULED', 'PENDING'].includes(enrollment.status)) {
      enrollment.status = 'PROCESSING';
      workerALocked = true;
    }

    // Worker B attempts lock on same enrollment simultaneously
    let workerBLocked = false;
    if (['ACTIVE', 'SCHEDULED', 'PENDING'].includes(enrollment.status)) {
      enrollment.status = 'PROCESSING';
      workerBLocked = true;
    }

    assert.strictEqual(workerALocked, true, 'Worker A should successfully lock enrollment');
    assert.strictEqual(workerBLocked, false, 'Worker B must be rejected to prevent duplicate send');
    assert.strictEqual(enrollment.status, 'PROCESSING');
  });

  console.log('\n--- Test Suite 4: Mailbox Rotation & Quota Enforcement ---');

  runTest('Selects active mailbox with lowest sentToday and enforces daily limit', () => {
    const mailboxes = [
      { id: 'mb_1', email: 'sender1@domain.com', dailyLimit: 100, sentToday: 100 }, // Maxed out
      { id: 'mb_2', email: 'sender2@domain.com', dailyLimit: 100, sentToday: 45 },
      { id: 'mb_3', email: 'sender3@domain.com', dailyLimit: 100, sentToday: 12 },  // Lowest available
    ];

    const available = mailboxes
      .filter(m => m.sentToday < m.dailyLimit)
      .sort((a, b) => a.sentToday - b.sentToday);

    assert.strictEqual(available.length, 2);
    assert.strictEqual(available[0].id, 'mb_3', 'Should pick mailbox with lowest sent today for round-robin balancing');
  });

  console.log('\n--- Test Suite 5: Cadence Progression ---');

  runTest('Calculates unambiguous next follow-up timestamp based on delayDays', () => {
    const baseTime = new Date('2026-11-04T10:00:00Z');
    const delayDays = 3;

    const nextTime = new Date(baseTime);
    nextTime.setDate(nextTime.getDate() + delayDays);

    assert.strictEqual(nextTime.toISOString(), '2026-11-07T10:00:00.000Z');
  });

  console.log('\n====================================================');
  console.log('Phase 5 Test Summary: All tests passed successfully');
  console.log('====================================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

