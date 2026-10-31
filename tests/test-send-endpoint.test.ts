import jwt from 'jsonwebtoken';
import { handler } from '../netlify/functions/campaigns-test-send';

console.log('====================================================');
console.log('ReachOps Email Thread & Test Dispatch Lab Test Suite');
console.log('====================================================');

const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-key-change-in-production';
const validToken = jwt.sign(
  { userId: 'demo-user-id', email: 'demo@reachops.com' },
  SESSION_SECRET,
  { expiresIn: '7d' }
);
const validCookie = `session=${validToken}`;

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string) {
  if (cond) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}`);
    failed++;
  }
}

async function run() {
  // Test 1: Anonymous request rejected with 401
  const anonRes = await (handler as any)({
    httpMethod: 'POST',
    headers: {},
    body: JSON.stringify({ sendTo: 'test@example.com' }),
  }, {} as any);
  assert(anonRes.statusCode === 401, 'Anonymous request returns HTTP 401');

  // Test 2: Authenticated GET health check
  const fakeAuthHeader = {
    cookie: validCookie,
  };

  const getRes = await (handler as any)({
    httpMethod: 'GET',
    headers: fakeAuthHeader,
  }, {} as any);
  assert(getRes.statusCode === 200, 'Authenticated GET returns HTTP 200 health status');
  const getBody = JSON.parse(getRes.body);
  assert(getBody.status === 'active', 'Health check reports active service');

  // Test 3: Missing recipient returns HTTP 400
  const noRecipRes = await (handler as any)({
    httpMethod: 'POST',
    headers: fakeAuthHeader,
    body: JSON.stringify({ subject: 'Hello' }),
  }, {} as any);
  assert(noRecipRes.statusCode === 400, 'Missing recipient email returns HTTP 400');

  // Test 4: Step 1 Initial Outreach Test Dispatch
  const step1Res = await (handler as any)({
    httpMethod: 'POST',
    headers: fakeAuthHeader,
    body: JSON.stringify({
      stepNumber: 1,
      sendTo: 'vamsipallela31@gmail.com',
      subject: 'Quick question regarding {{companyName}} pipeline, {{firstName}}',
      body: 'Hi {{firstName}},\n\nSaw what your team is building at {{companyName}}. Would you be open to a 10-minute chat this Thursday?\n\n{{accountSignature}}',
      variables: {
        firstName: 'Vamsi',
        companyName: 'ReachOps',
        senderName: 'Alex Rivera',
      },
      isThreaded: false,
    }),
  }, {} as any);

  assert(step1Res.statusCode === 200, 'Step 1 test dispatch returns HTTP 200');
  const step1Body = JSON.parse(step1Res.body);
  console.log('Actual Step 1 Response:', step1Body);
  assert(step1Body.success === true, 'Test dispatch reports success: true');
  assert(step1Body.recipient === 'vamsipallela31@gmail.com', 'Recipient matches target address');
  assert(step1Body.subject.includes('ReachOps') && step1Body.subject.includes('Vamsi'), 'Subject variables interpolated correctly');
  assert(step1Body.placement === 'PRIMARY_INBOX', 'Clean outreach copy predicts PRIMARY_INBOX landing');
  assert(step1Body.deliverability.score >= 90, 'Deliverability score is 90%+');
  assert(step1Body.deliverability.dnsCheck.spf === 'PASS', 'DNS SPF check returns PASS');

  // Test 5: Step 2 Follow-Up with Email Threading Simulation
  const step2Res = await (handler as any)({
    httpMethod: 'POST',
    headers: fakeAuthHeader,
    body: JSON.stringify({
      stepNumber: 2,
      sendTo: 'vamsipallela31@gmail.com',
      subject: '',
      threadSubject: 'Quick question regarding ReachOps pipeline, Vamsi',
      body: 'Hi {{firstName}},\n\nCircling back on my note below. Worth a brief look?\n\nBest,\n{{senderName}}',
      variables: {
        firstName: 'Vamsi',
        companyName: 'ReachOps',
        senderName: 'Alex Rivera',
      },
      isThreaded: true,
      previousSteps: [
        {
          stepNumber: 1,
          subject: 'Quick question regarding ReachOps pipeline, Vamsi',
          body: 'Saw what your team is building...',
          sentAt: 'Oct 28, 2026, at 10:14 AM',
        },
      ],
    }),
  }, {} as any);

  assert(step2Res.statusCode === 200, 'Step 2 threaded follow-up returns HTTP 200');
  const step2Body = JSON.parse(step2Res.body);
  assert(step2Body.isThreaded === true, 'Follow-up is marked as threaded');
  assert(step2Body.subject.startsWith('Re:'), 'Follow-up subject automatically prefixes "Re:"');
  assert(step2Body.placement === 'PRIMARY_INBOX', 'Threaded follow-up predicts PRIMARY_INBOX');

  // Test 6: Spam trigger copy gets penalized and flagged
  const spamRes = await (handler as any)({
    httpMethod: 'POST',
    headers: fakeAuthHeader,
    body: JSON.stringify({
      stepNumber: 1,
      sendTo: 'lead@example.com',
      subject: 'URGENT: 100% FREE GUARANTEED CASH ACT NOW $$$',
      body: 'CLICK HERE NOW to claim your pure profit miracle unlimited income wire transfer immediately!',
      variables: { firstName: 'Bob' },
    }),
  }, {} as any);

  assert(spamRes.statusCode === 200, 'Spam test dispatch returns HTTP 200 with audit');
  const spamBody = JSON.parse(spamRes.body);
  assert(spamBody.placement === 'SPAM_FOLDER', 'Spam copy correctly categorized as SPAM_FOLDER');
  assert(spamBody.deliverability.score < 70, 'Deliverability score penalized below 70');
  assert(spamBody.deliverability.flags.length > 0, 'Flags detected spam triggers and ALL CAPS');

  console.log('====================================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
