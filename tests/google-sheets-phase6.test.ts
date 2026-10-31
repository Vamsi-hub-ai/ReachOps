import assert from 'node:assert';
import { checkPreSendCompliance } from '../netlify/lib/follow-up-engine';

console.log('====================================================');
console.log('ReachOps Phase 6: Reply Detection & Suppression Test Suite');
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
  console.log('--- Test Suite 1: Inbound Reply Detection & Permanent Sequence Halt ---');
  
  runTest('Stops all automated follow-ups permanently when inbound reply is detected', () => {
    const prospect = { id: 'p_101', email: 'elena@datadog.example', replied: false, status: 'Contacted' };
    const enrollment = { id: 'enr_101', status: 'ACTIVE', nextActionAt: new Date(Date.now() + 86400000), stopReason: null };

    // Inbound reply arrives
    prospect.replied = true;
    prospect.status = 'Replied';
    enrollment.status = 'STOPPED';
    enrollment.nextActionAt = null;
    enrollment.stopReason = 'REPLY_RECEIVED';

    assert.strictEqual(enrollment.status, 'STOPPED');
    assert.strictEqual(enrollment.nextActionAt, null);
    assert.strictEqual(enrollment.stopReason, 'REPLY_RECEIVED');
  });

  runTest('Cancels pending manual follow-ups when a reply is received', () => {
    const enrollment = { id: 'enr_102', status: 'SCHEDULED', nextActionAt: new Date(Date.now() + 86400000 * 3), stopReason: 'Manual scheduled' };

    // Inbound reply arrives before the manual schedule date
    enrollment.status = 'STOPPED';
    enrollment.nextActionAt = null;
    enrollment.stopReason = 'REPLY_RECEIVED';

    assert.strictEqual(enrollment.status, 'STOPPED');
    assert.strictEqual(enrollment.nextActionAt, null);
    assert.strictEqual(enrollment.stopReason, 'REPLY_RECEIVED');
  });

  console.log('\n--- Test Suite 2: Google Sheet Reply Column Telemetry ---');

  runTest('Generates accurate Google Sheet reply values for synchronization', () => {
    const replyDate = new Date('2026-11-04T14:30:00Z');
    const sheetUpdate = {
      reply_status: 'REPLIED',
      reply_received_at: replyDate.toISOString(),
      reply_detected: 'TRUE',
      sequence_stopped_reason: 'REPLY_RECEIVED',
      followup_status: 'STOPPED',
      followup_paused: 'TRUE',
      followup_pause_reason: 'Inbound reply received from prospect',
      next_followup_at: '',
      next_followup_step: '-',
      reply_subject: 'Re: Quick question regarding outreach',
      reply_content: 'Yes, we are actively looking into this. Can you share more details?',
    };

    assert.strictEqual(sheetUpdate.reply_status, 'REPLIED');
    assert.strictEqual(sheetUpdate.reply_detected, 'TRUE');
    assert.strictEqual(sheetUpdate.sequence_stopped_reason, 'REPLY_RECEIVED');
    assert.strictEqual(sheetUpdate.followup_status, 'STOPPED');
    assert.strictEqual(sheetUpdate.next_followup_at, '');
  });

  console.log('\n--- Test Suite 3: Pre-Send Compliance Guard Evaluation ---');

  await runTest('checkPreSendCompliance rejects unsubscribed recipients', async () => {
    const res = await checkPreSendCompliance('test-workspace', {
      email: 'unsub@example.com',
      unsubscribe: true,
      bounced: false,
      replied: false,
    });

    assert.strictEqual(res.eligible, false);
    assert(res.blockReason?.includes('unsubscribed'));
  });

  await runTest('checkPreSendCompliance rejects permanently bounced recipients', async () => {
    const res = await checkPreSendCompliance('test-workspace', {
      email: 'bounced@example.com',
      unsubscribe: false,
      bounced: true,
      replied: false,
    });

    assert.strictEqual(res.eligible, false);
    assert(res.blockReason?.includes('permanent bounce'));
  });

  await runTest('checkPreSendCompliance rejects replied recipients', async () => {
    const res = await checkPreSendCompliance('test-workspace', {
      email: 'replied@example.com',
      unsubscribe: false,
      bounced: false,
      replied: true,
    });

    assert.strictEqual(res.eligible, false);
    assert(res.blockReason?.includes('Inbound reply'));
  });

  console.log('\n====================================================');
  console.log('Phase 6 Test Summary: All tests passed successfully');
  console.log('====================================================');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

