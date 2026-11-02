import jwt from 'jsonwebtoken';
import { 
  analyzeEmailDeliverability, 
  resolveSpintax, 
  getDomainHealth, 
  calculateSenderLimits 
} from '../netlify/lib/deliverability';
import { createMimeMessage } from '../netlify/lib/mailer';
import { handler as deliverabilityHandler } from '../netlify/functions/deliverability-diagnose';

console.log('====================================================');
console.log('ReachOps Full Email Deliverability & Anti-Spam Suite');
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
  // ==========================================
  // SECTION 1: Spam Trigger & Placement Engine
  // ==========================================
  console.log('\n--- Section 1: Spam Analysis & Inbox Placement ---');

  // Test 1: Clean, high-converting cold email should achieve 95-100 score (LOW risk)
  const cleanResult = analyzeEmailDeliverability(
    'Quick question for {{firstName}}',
    'Hi {{firstName}},\n\nSaw what your team is building at {{company}}. Reaching out because we help outbound sales teams eliminate spam folder landing and scale authentic outreach.\n\nAre you open to a brief 10-minute chat this Thursday?\n\nBest,\nAlex'
  );
  assert(cleanResult.score >= 90, `Clean email score is optimal: ${cleanResult.score}`);
  assert(cleanResult.riskLevel === 'LOW', `Clean email risk level is LOW: ${cleanResult.riskLevel}`);
  assert(cleanResult.hasPersonalization === true, 'Personalization detected via {{firstName}}');
  assert(cleanResult.linkCount === 0, 'Zero links detected');
  assert(cleanResult.wordCount < 60, `Concise word count: ${cleanResult.wordCount} words`);

  // Test 2: Spam trigger phrase penalties
  const spammyResult = analyzeEmailDeliverability(
    'URGENT: Act now for guaranteed cash!',
    'Hello, congratulations! You have been selected for 100% free wire transfer. Click here now to make money fast: https://link1.com https://link2.com https://link3.com'
  );
  assert(spammyResult.score < 50, `Spammy email penalized heavily: ${spammyResult.score}`);
  assert(spammyResult.riskLevel === 'HIGH', `Spammy email risk level is HIGH: ${spammyResult.riskLevel}`);
  assert(spammyResult.flags.some(f => f.type === 'keyword'), 'Flags spam trigger phrases');
  assert(spammyResult.flags.some(f => f.type === 'links'), 'Flags excessive links (>2 links)');

  // Test 3: Subject line ALL CAPS penalty
  const capsResult = analyzeEmailDeliverability(
    'SPECIAL OFFER FOR YOU TODAY',
    'Hi {{firstName}}, check out our platform at {{company}}.'
  );
  assert(capsResult.flags.some(f => f.message.includes('ALL CAPS')), 'Flags ALL CAPS subject line');

  // Test 4: Subject line excessive punctuation
  const punctResult = analyzeEmailDeliverability(
    'Quick question??? Must read now!!',
    'Hi {{firstName}}, check this out.'
  );
  assert(punctResult.flags.some(f => f.message.includes('excessive punctuation')), 'Flags excessive punctuation in subject');

  // Test 5: Excessive word count (>150 words)
  const longBody = Array(160).fill('word').join(' ');
  const longResult = analyzeEmailDeliverability('Catch up {{firstName}}', `Hi {{firstName}},\n\n${longBody}`);
  assert(longResult.flags.some(f => f.message.includes('Too long')), 'Flags long email (>150 words)');

  // ==========================================
  // SECTION 2: Spintax Variation Resolution
  // ==========================================
  console.log('\n--- Section 2: Spintax Engine ---');

  // Test 6: Spintax resolves dynamically
  const pureSpintax = '{Hi|Hello|Hey} Sarah, {hope you are well|quick question for you}.';
  const resolved1 = resolveSpintax(pureSpintax);
  assert(!resolved1.includes('{') && !resolved1.includes('}'), 'All spintax brackets removed from pure spintax template');
  assert(['Hi', 'Hello', 'Hey'].some(greeting => resolved1.startsWith(greeting)), 'Valid spintax greeting chosen');

  // Test 6b: Personalization variables {{firstName}} are safely preserved when resolving spintax
  const mixedTemplate = '{Hi|Hey} {{firstName}}, {circling back|following up}.';
  const mixedResolved = resolveSpintax(mixedTemplate);
  assert(mixedResolved.includes('{{firstName}}'), 'Personalization tag {{firstName}} preserved by spintax engine');
  assert(!mixedResolved.includes('{Hi|Hey}') && !mixedResolved.includes('{circling back|following up}'), 'All pipe spintax resolved in mixed template');

  // Test 7: Spintax detection in analyzeEmailDeliverability adds bonus
  const spintaxAnalysis = analyzeEmailDeliverability(
    '{Quick question|Brief thought} for {{firstName}}',
    '{Hi|Hey} {{firstName}},\n\nHope this finds you well at {{company}}.'
  );
  assert(spintaxAnalysis.hasSpintax === true, 'Spintax detected in analyzeEmailDeliverability');

  // ==========================================
  // SECTION 3: Domain Health & DNS Verification
  // ==========================================
  console.log('\n--- Section 3: Domain Health & DNS Protocol ---');

  // Test 8: Domain health report verification
  const domainReport = getDomainHealth('reachops.io');
  assert(domainReport.overallScore >= 95, `Domain overall score is high: ${domainReport.overallScore}`);
  assert(domainReport.status === 'EXCELLENT', 'Domain status is EXCELLENT');
  assert(domainReport.spf.status === 'PASS', 'SPF record verified');
  assert(domainReport.dkim.status === 'PASS', 'DKIM 2048-bit record verified');
  assert(domainReport.dmarc.status === 'PASS', 'DMARC quarantine policy verified');
  assert(domainReport.mx.status === 'PASS', 'MX records configured');
  assert(domainReport.customTrackingDomain.configured === true, 'Isolated custom tracking domain active');
  assert(domainReport.blacklistStatus.listed === false, 'Sender IP not on any blacklists');

  // Test 9: Safe sending limits calculation
  const limits = calculateSenderLimits(3);
  assert(limits.activeMailboxCount === 3, 'Calculates for 3 mailboxes');
  assert(limits.safeDailyPerInbox === 40, 'Safe limit is 40 emails per inbox per day');
  assert(limits.totalSafeCapacity === 120, 'Total safe capacity is 120/day across 3 mailboxes');
  assert(limits.jitterRangeSec.includes('180s - 480s'), 'Enforces 3-8 minute human-like jitter');

  // ==========================================
  // SECTION 4: RFC 5322 MIME Generation
  // ==========================================
  console.log('\n--- Section 4: RFC 5322 MIME & Inbox Headers ---');

  // Test 10: Initial cold email MIME structure
  const mimeInitial = createMimeMessage(
    'prospect@acmecorp.com',
    '"Alex Rivera" <alex@reachops.io>',
    'Quick question regarding Acme Corp pipeline',
    'Hi Sarah,\n\nSaw your team expanding.\n\nBest,\nAlex',
    'msg-101'
  );

  assert(mimeInitial.rawMime.includes('To: prospect@acmecorp.com'), 'MIME contains valid To header');
  assert(mimeInitial.rawMime.includes('From: "Alex Rivera" <alex@reachops.io>'), 'MIME contains valid From header');
  assert(mimeInitial.rawMime.includes('Reply-To: alex@reachops.io'), 'MIME contains aligned Reply-To header');
  assert(mimeInitial.rawMime.includes('Message-ID: <msg-101.'), 'MIME contains clean domain Message-ID');
  assert(!mimeInitial.rawMime.includes('List-Unsubscribe'), 'MIME does NOT contain List-Unsubscribe header (prevents Promotions routing)');
  assert(!mimeInitial.rawMime.includes('X-Mailer:'), 'MIME does NOT contain X-Mailer header (prevents automated bot fingerprinting)');
  assert(mimeInitial.rawMime.includes('Content-Type: text/plain; charset="UTF-8"'), 'Contains text/plain alternative');
  assert(mimeInitial.rawMime.includes('Content-Type: text/html; charset="UTF-8"'), 'Contains text/html alternative');
  assert(mimeInitial.rawMime.includes('<br/>'), 'Plain newlines formatted to <br/> for HTML part');

  // Test 11: Threaded follow-up email MIME with In-Reply-To & References
  const mimeThreaded = createMimeMessage(
    'prospect@acmecorp.com',
    '"Alex Rivera" <alex@reachops.io>',
    'Re: Quick question regarding Acme Corp pipeline',
    'Hi Sarah,\n\nFollowing up on my previous note.',
    'msg-102',
    {
      inReplyTo: '<msg-101.abcd@reachops.io>',
      references: '<msg-101.abcd@reachops.io>'
    }
  );

  assert(mimeThreaded.rawMime.includes('In-Reply-To: <msg-101.abcd@reachops.io>'), 'Threaded email has In-Reply-To header');
  assert(mimeThreaded.rawMime.includes('References: <msg-101.abcd@reachops.io>'), 'Threaded email has References header');

  // ==========================================
  // SECTION 5: Netlify Deliverability API Endpoints
  // ==========================================
  console.log('\n--- Section 5: API Deliverability Diagnosis ---');

  // Test 12: GET deliverability-diagnose returns 200 with domain health & warmup stats
  const diagGetRes = await (deliverabilityHandler as any)({
    httpMethod: 'GET',
    headers: { cookie: validCookie },
  }, {} as any);

  assert(diagGetRes.statusCode === 200, 'GET /api/deliverability-diagnose returns HTTP 200');
  const diagGetBody = JSON.parse(diagGetRes.body);
  assert(diagGetBody.success === true, 'Diagnostic check reports success: true');
  assert(diagGetBody.domainHealth.spf.status === 'PASS', 'Domain health SPF status PASS');
  assert(diagGetBody.warmupNetwork.status === 'ACTIVE', 'Warmup network status is ACTIVE');
  assert(diagGetBody.warmupNetwork.inboxPlacementRate >= 95, `Warmup placement rate: ${diagGetBody.warmupNetwork.inboxPlacementRate}%`);

  // Test 13: POST deliverability-diagnose with custom subject and body
  const diagPostRes = await (deliverabilityHandler as any)({
    httpMethod: 'POST',
    headers: { cookie: validCookie },
    body: JSON.stringify({
      subject: 'Quick question for {{firstName}}',
      body: 'Hi {{firstName}},\n\nWould you be open to connecting this week?\n\nBest,\nAlex'
    })
  }, {} as any);

  assert(diagPostRes.statusCode === 200, 'POST /api/deliverability-diagnose returns HTTP 200');
  const diagPostBody = JSON.parse(diagPostRes.body);
  assert(diagPostBody.spamAnalysis.score >= 90, `Custom email spam analysis score: ${diagPostBody.spamAnalysis.score}`);
  assert(diagPostBody.spamAnalysis.riskLevel === 'LOW', 'Custom email risk level: LOW');

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n====================================================');
  console.log(`Deliverability Test Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error running deliverability test suite:', err);
  process.exit(1);
});
