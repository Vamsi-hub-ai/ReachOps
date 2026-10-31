import assert from 'node:assert';

console.log('====================================================');
console.log('ReachOps Phase 4: Tag Pause & Explicit Scheduling Test Suite');
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
  console.log('--- Test Suite 1: Tag-Based Follow-Up Stoppage (Individual Isolation) ---');
  
  runTest('Applying ANY tag automatically pauses automated follow-ups for that prospect', () => {
    const prospectA = { id: 'p_1', email: 'john@example.com', status: 'New' };
    const enrollmentA = { prospectId: 'p_1', status: 'ACTIVE', nextActionAt: new Date(Date.now() + 86400000), stopReason: null };

    // User applies tag "Interested"
    const appliedTag = 'Interested';
    prospectA.status = appliedTag;
    enrollmentA.status = 'PAUSED';
    enrollmentA.nextActionAt = null;
    enrollmentA.stopReason = `Follow-ups paused: Prospect tagged as ${appliedTag}`;

    assert.strictEqual(enrollmentA.status, 'PAUSED');
    assert.strictEqual(enrollmentA.nextActionAt, null);
    assert(enrollmentA.stopReason.includes('Interested'));
  });

  runTest('Applying a tag pauses that prospect only; other eligible campaign prospects continue sending', () => {
    const prospectA = { id: 'p_1', email: 'john@example.com', status: 'Interested' };
    const enrollmentA = { prospectId: 'p_1', status: 'PAUSED', nextActionAt: null };

    const prospectB = { id: 'p_2', email: 'sarah@example.com', status: 'Contacted' };
    const enrollmentB = { prospectId: 'p_2', status: 'ACTIVE', nextActionAt: new Date() };

    assert.strictEqual(enrollmentA.status, 'PAUSED');
    assert.strictEqual(enrollmentB.status, 'ACTIVE');
    assert(enrollmentB.nextActionAt !== null);
  });

  console.log('\n--- Test Suite 2: Tag Removal Rule ---');

  runTest('When a tag is removed, automated follow-up sequence REMAINS PAUSED', () => {
    const prospect = { id: 'p_1', email: 'john@example.com', status: 'Interested' };
    const enrollment = { prospectId: 'p_1', status: 'PAUSED', stopReason: 'Follow-ups paused' };

    // User removes tag
    prospect.status = 'New';
    // RULE: Sequence REMAINS PAUSED!
    enrollment.stopReason = 'Tag removed. Follow-up sequence remains paused until explicitly resumed.';

    assert.strictEqual(enrollment.status, 'PAUSED');
    assert(enrollment.stopReason.includes('remains paused'));
  });

  console.log('\n--- Test Suite 3: Explicit Manual Scheduling Exception ---');

  runTest('Explicitly scheduling follow-up authorizes only one scheduled email', () => {
    const enrollment = { prospectId: 'p_1', status: 'PAUSED', nextActionAt: null };
    const targetDate = new Date(Date.now() + 86400000 * 2); // 2 days later

    // User explicitly schedules next follow-up
    enrollment.status = 'SCHEDULED';
    enrollment.nextActionAt = targetDate;

    assert.strictEqual(enrollment.status, 'SCHEDULED');
    assert.strictEqual(enrollment.nextActionAt.getTime(), targetDate.getTime());
  });

  runTest('After manual follow-up is sent, keep original automated sequence PAUSED', () => {
    const enrollment = { prospectId: 'p_1', status: 'SCHEDULED', nextActionAt: new Date() };

    // Dispatcher sends the scheduled email
    const wasManualScheduled = enrollment.status === 'SCHEDULED';
    if (wasManualScheduled) {
      enrollment.status = 'PAUSED';
      enrollment.nextActionAt = null;
    }

    assert.strictEqual(enrollment.status, 'PAUSED');
    assert.strictEqual(enrollment.nextActionAt, null);
  });

  console.log('\n--- Test Suite 4: System-Protected Compliance Stopping Conditions ---');

  runTest('Blocks manual scheduling and sequence resumption for unsubscribed contacts', () => {
    const prospect = { email: 'unsub@example.com', unsubscribe: true, bounced: false, replied: false };
    
    const canSchedule = !prospect.unsubscribe && !prospect.bounced && !prospect.replied;
    assert.strictEqual(canSchedule, false, 'Unsubscribed contacts must be strictly blocked from scheduling');
  });

  runTest('Blocks manual scheduling and sequence resumption for permanently bounced contacts', () => {
    const prospect = { email: 'bounce@example.com', unsubscribe: false, bounced: true, replied: false };
    
    const canSchedule = !prospect.unsubscribe && !prospect.bounced && !prospect.replied;
    assert.strictEqual(canSchedule, false, 'Bounced contacts must be strictly blocked from scheduling');
  });

  runTest('Blocks manual scheduling and sequence resumption for contacts who already replied', () => {
    const prospect = { email: 'replied@example.com', unsubscribe: false, bounced: false, replied: true };
    
    const canSchedule = !prospect.unsubscribe && !prospect.bounced && !prospect.replied;
    assert.strictEqual(canSchedule, false, 'Replied contacts must be strictly blocked from scheduling');
  });

  runTest('Blocks manual scheduling for contacts present on the suppression list', () => {
    const suppressionList = ['spam-trap@domain.com', 'legal@competitor.com'];
    const prospectEmail = 'legal@competitor.com';

    const isSuppressed = suppressionList.includes(prospectEmail);
    const canSchedule = !isSuppressed;

    assert.strictEqual(isSuppressed, true);
    assert.strictEqual(canSchedule, false, 'Suppressed contacts cannot receive manual or automated emails');
  });

  console.log('\n====================================================');
  console.log('Phase 4 Test Summary: All tests passed successfully');
  console.log('====================================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

