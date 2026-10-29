import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import bcrypt from 'bcryptjs';
import prisma from '../netlify/lib/prisma';
import { getAuthContext } from '../netlify/lib/auth';

// Handlers
import { handler as loginHandler } from '../netlify/functions/auth-login';
import { handler as logoutHandler } from '../netlify/functions/auth-logout';
import { handler as meHandler } from '../netlify/functions/auth-me';
import { handler as campaignsHandler } from '../netlify/functions/campaigns';
import { handler as emailAccountsHandler } from '../netlify/functions/email-accounts';
import { handler as templatesHandler } from '../netlify/functions/templates';
import { handler as inboxHandler } from '../netlify/functions/inbox';
import { handler as campaignSettingsHandler } from '../netlify/functions/campaigns-settings';
import { handler as campaignSequenceHandler } from '../netlify/functions/campaigns-sequence';
import { handler as campaignLeadsHandler } from '../netlify/functions/campaigns-leads';
import { handler as campaignAnalyticsHandler } from '../netlify/functions/campaigns-analytics';
import { handler as campaignStartHandler } from '../netlify/functions/campaigns-start';
import { handler as activityLogHandler } from '../netlify/functions/activity-log';
import { handler as analyticsDashboardHandler } from '../netlify/functions/analytics-dashboard';
import { handler as authGoogleUrlHandler } from '../netlify/functions/auth-google-url';
import { handler as deliverabilityHandler } from '../netlify/functions/deliverability-diagnose';

const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-key-change-in-production';

function makeEvent(options: {
  method?: string;
  cookieHeader?: string;
  body?: any;
  queryStringParameters?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.cookieHeader !== undefined) {
    headers['cookie'] = options.cookieHeader;
  }
  return {
    rawUrl: 'http://localhost/api',
    rawQuery: '',
    path: '/api',
    httpMethod: options.method || 'GET',
    headers,
    multiValueHeaders: {},
    queryStringParameters: options.queryStringParameters || null,
    multiValueQueryStringParameters: null,
    body: options.body !== undefined ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null,
    isBase64Encoded: false,
  } as any;
}

function createSessionCookie(userId: string, email: string, secret = SESSION_SECRET, expiresIn = '7d') {
  const token = jwt.sign({ userId, email }, secret, { expiresIn: expiresIn as any });
  return `session=${token}`;
}

async function runTests() {
  console.log('====================================================');
  console.log('ReachOps P0 Authentication Security Regression Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}`);
      console.error('       Error:', err.message || err);
      failed++;
    }
  }

  // --- Fixture Setup ---
  const TEST_USER_A_ID = 'test-user-a-uuid';
  const TEST_USER_B_ID = 'test-user-b-uuid';
  const TEST_USER_NO_WS_ID = 'test-user-no-ws-uuid';
  const TEST_WS_A_ID = 'test-workspace-a-uuid';
  const TEST_WS_B_ID = 'test-workspace-b-uuid';
  const TEST_CAMPAIGN_A_ID = 'test-campaign-a-uuid';
  const TEST_CAMPAIGN_B_ID = 'test-campaign-b-uuid';
  const TEST_TEMPLATE_A_ID = 'test-template-a-uuid';
  const TEST_TEMPLATE_B_ID = 'test-template-b-uuid';

  // Clean existing test fixtures if left over
  await prisma.template.deleteMany({ where: { id: { in: [TEST_TEMPLATE_A_ID, TEST_TEMPLATE_B_ID] } } });
  await prisma.campaign.deleteMany({ where: { id: { in: [TEST_CAMPAIGN_A_ID, TEST_CAMPAIGN_B_ID] } } });
  await prisma.workspaceMember.deleteMany({ where: { userId: { in: [TEST_USER_A_ID, TEST_USER_B_ID, TEST_USER_NO_WS_ID] } } });
  await prisma.workspace.deleteMany({ where: { id: { in: [TEST_WS_A_ID, TEST_WS_B_ID] } } });
  await prisma.user.deleteMany({ where: { id: { in: [TEST_USER_A_ID, TEST_USER_B_ID, TEST_USER_NO_WS_ID] } } });

  // Create isolated users and workspaces
  const testPasswordHash = await bcrypt.hash('CorrectPassword123!', 10);
  await prisma.user.create({
    data: {
      id: TEST_USER_A_ID,
      email: 'user_a@test.local',
      name: 'User A',
      passwordHash: testPasswordHash,
    },
  });
  await prisma.user.create({
    data: {
      id: TEST_USER_B_ID,
      email: 'user_b@test.local',
      name: 'User B',
      passwordHash: testPasswordHash,
    },
  });
  await prisma.user.create({
    data: {
      id: TEST_USER_NO_WS_ID,
      email: 'user_noworkspace@test.local',
      name: 'User No WS',
      passwordHash: testPasswordHash,
    },
  });

  await prisma.workspace.create({
    data: { id: TEST_WS_A_ID, name: 'Workspace A', ownerId: TEST_USER_A_ID },
  });
  await prisma.workspace.create({
    data: { id: TEST_WS_B_ID, name: 'Workspace B', ownerId: TEST_USER_B_ID },
  });

  await prisma.workspaceMember.create({
    data: { workspaceId: TEST_WS_A_ID, userId: TEST_USER_A_ID, role: 'OWNER' },
  });
  await prisma.workspaceMember.create({
    data: { workspaceId: TEST_WS_B_ID, userId: TEST_USER_B_ID, role: 'OWNER' },
  });

  await prisma.campaign.create({
    data: {
      id: TEST_CAMPAIGN_A_ID,
      workspaceId: TEST_WS_A_ID,
      name: 'Campaign Belonging to Workspace A',
      status: 'DRAFT',
    },
  });
  await prisma.campaign.create({
    data: {
      id: TEST_CAMPAIGN_B_ID,
      workspaceId: TEST_WS_B_ID,
      name: 'Campaign Belonging to Workspace B',
      status: 'DRAFT',
    },
  });

  await prisma.template.create({
    data: {
      id: TEST_TEMPLATE_A_ID,
      workspaceId: TEST_WS_A_ID,
      name: 'Template A',
      category: 'General',
      subject: 'Subject A',
      body: 'Body A',
    },
  });
  await prisma.template.create({
    data: {
      id: TEST_TEMPLATE_B_ID,
      workspaceId: TEST_WS_B_ID,
      name: 'Template B',
      category: 'General',
      subject: 'Subject B',
      body: 'Body B',
    },
  });

  try {
    // =========================================================================
    // TEST 1: Anonymous access to protected APIs is rejected (401 Unauthorized)
    // =========================================================================
    console.log('--- Test Suite 1: Anonymous Access Protection ---');
    const protectedHandlers = [
      { name: 'GET /api/auth/me', fn: meHandler, method: 'GET' },
      { name: 'GET /api/campaigns', fn: campaignsHandler, method: 'GET' },
      { name: 'GET /api/email-accounts', fn: emailAccountsHandler, method: 'GET' },
      { name: 'GET /api/templates', fn: templatesHandler, method: 'GET' },
      { name: 'GET /api/inbox', fn: inboxHandler, method: 'GET' },
      { name: 'GET /api/campaigns-settings', fn: campaignSettingsHandler, method: 'GET', query: { id: TEST_CAMPAIGN_A_ID } },
      { name: 'GET /api/campaigns-sequence', fn: campaignSequenceHandler, method: 'GET', query: { campaignId: TEST_CAMPAIGN_A_ID } },
      { name: 'GET /api/campaigns-leads', fn: campaignLeadsHandler, method: 'GET', query: { campaignId: TEST_CAMPAIGN_A_ID } },
      { name: 'GET /api/campaigns-analytics', fn: campaignAnalyticsHandler, method: 'GET', query: { id: TEST_CAMPAIGN_A_ID } },
      { name: 'POST /api/campaigns-start', fn: campaignStartHandler, method: 'POST', body: { campaignId: TEST_CAMPAIGN_A_ID } },
      { name: 'GET /api/activity-log', fn: activityLogHandler, method: 'GET' },
      { name: 'GET /api/analytics-dashboard', fn: analyticsDashboardHandler, method: 'GET' },
      { name: 'GET /api/auth-google-url', fn: authGoogleUrlHandler, method: 'GET' },
      { name: 'GET /api/deliverability-diagnose', fn: deliverabilityHandler, method: 'GET', query: { domain: 'reachops.com' } },
    ];

    for (const endpoint of protectedHandlers) {
      await test(`Anonymous request to ${endpoint.name} returns HTTP 401`, async () => {
        const event = makeEvent({
          method: endpoint.method,
          queryStringParameters: endpoint.query,
          body: endpoint.body,
        });
        const res: any = await endpoint.fn(event, {} as any);
        assert.equal(res.statusCode, 401, `Expected 401 but got ${res?.statusCode}`);
        const body = JSON.parse(res.body);
        assert.match(body.error, /Unauthorized/i);
      });
    }

    // =========================================================================
    // TEST 2: Invalid and expired sessions are rejected
    // =========================================================================
    console.log('\n--- Test Suite 2: Invalid & Expired Session Verification ---');

    await test('getAuthContext returns null when cookie header is missing', async () => {
      const event = makeEvent({});
      const ctx = await getAuthContext(event);
      assert.equal(ctx, null);
    });

    await test('getAuthContext returns null for malformed session token', async () => {
      const event = makeEvent({ cookieHeader: 'session=not-a-valid-jwt-token' });
      const ctx = await getAuthContext(event);
      assert.equal(ctx, null);
    });

    await test('getAuthContext returns null for token signed with wrong secret', async () => {
      const forgedCookie = createSessionCookie(TEST_USER_A_ID, 'user_a@test.local', 'wrong-secret-key');
      const event = makeEvent({ cookieHeader: forgedCookie });
      const ctx = await getAuthContext(event);
      assert.equal(ctx, null);
    });

    await test('getAuthContext returns null for expired token', async () => {
      const expiredCookie = createSessionCookie(TEST_USER_A_ID, 'user_a@test.local', SESSION_SECRET, '-10s');
      const event = makeEvent({ cookieHeader: expiredCookie });
      const ctx = await getAuthContext(event);
      assert.equal(ctx, null);
    });

    await test('getAuthContext returns null for token referencing non-existent user ID', async () => {
      const ghostCookie = createSessionCookie('ghost-user-uuid', 'ghost@test.local');
      const event = makeEvent({ cookieHeader: ghostCookie });
      const ctx = await getAuthContext(event);
      assert.equal(ctx, null);
    });

    await test('getAuthContext returns null for user with no workspace memberships', async () => {
      const noWsCookie = createSessionCookie(TEST_USER_NO_WS_ID, 'user_noworkspace@test.local');
      const event = makeEvent({ cookieHeader: noWsCookie });
      const ctx = await getAuthContext(event);
      assert.equal(ctx, null);
    });

    await test('Protected API returns 401 when called with expired session', async () => {
      const expiredCookie = createSessionCookie(TEST_USER_A_ID, 'user_a@test.local', SESSION_SECRET, '-10s');
      const event = makeEvent({ cookieHeader: expiredCookie });
      const res: any = await meHandler(event, {} as any);
      assert.equal(res.statusCode, 401);
    });

    // =========================================================================
    // TEST 3: Authenticated users can access authorized resources
    // =========================================================================
    console.log('\n--- Test Suite 3: Authorized Resource Access ---');

    const validUserACookie = createSessionCookie(TEST_USER_A_ID, 'user_a@test.local');

    await test('Valid session for User A allows GET /api/auth/me', async () => {
      const event = makeEvent({ cookieHeader: validUserACookie });
      const res: any = await meHandler(event, {} as any);
      assert.equal(res.statusCode, 200);
      const data = JSON.parse(res.body);
      assert.equal(data.id, TEST_USER_A_ID);
      assert.equal(data.email, 'user_a@test.local');
      assert.equal(data.workspaceMembers[0].workspace.id, TEST_WS_A_ID);
    });

    await test('Valid session for User A returns only User A workspace campaigns in GET /api/campaigns', async () => {
      const event = makeEvent({ cookieHeader: validUserACookie });
      const res: any = await campaignsHandler(event, {} as any);
      assert.equal(res.statusCode, 200);
      const campaigns = JSON.parse(res.body);
      assert.ok(Array.isArray(campaigns));
      const hasCampaignA = campaigns.some((c: any) => c.id === TEST_CAMPAIGN_A_ID);
      const hasCampaignB = campaigns.some((c: any) => c.id === TEST_CAMPAIGN_B_ID);
      assert.equal(hasCampaignA, true, 'User A should see Campaign A');
      assert.equal(hasCampaignB, false, 'User A should NOT see Campaign B');
    });

    await test('Valid session for User A can read Campaign A settings', async () => {
      const event = makeEvent({
        cookieHeader: validUserACookie,
        queryStringParameters: { id: TEST_CAMPAIGN_A_ID },
      });
      const res: any = await campaignSettingsHandler(event, {} as any);
      assert.equal(res.statusCode, 200);
      const campaign = JSON.parse(res.body);
      assert.equal(campaign.campaignId, TEST_CAMPAIGN_A_ID);
    });

    // =========================================================================
    // TEST 4: Cross-workspace access isolation
    // =========================================================================
    console.log('\n--- Test Suite 4: Multi-Tenant Workspace Isolation ---');

    await test('User A cannot read Campaign B settings in Workspace B (returns 404)', async () => {
      const event = makeEvent({
        cookieHeader: validUserACookie,
        queryStringParameters: { id: TEST_CAMPAIGN_B_ID },
      });
      const res: any = await campaignSettingsHandler(event, {} as any);
      assert.equal(res.statusCode, 404);
    });

    await test('User A cannot update Campaign B in Workspace B (returns 404)', async () => {
      const event = makeEvent({
        method: 'PATCH',
        cookieHeader: validUserACookie,
        queryStringParameters: { id: TEST_CAMPAIGN_B_ID },
        body: { name: 'Unauthorized Overwrite' },
      });
      const res: any = await campaignsHandler(event, {} as any);
      assert.equal(res.statusCode, 404);
      // Verify campaign B was NOT modified
      const campaignB = await prisma.campaign.findUnique({ where: { id: TEST_CAMPAIGN_B_ID } });
      assert.equal(campaignB?.name, 'Campaign Belonging to Workspace B');
    });

    await test('User A cannot delete Campaign B in Workspace B (returns 404)', async () => {
      const event = makeEvent({
        method: 'DELETE',
        cookieHeader: validUserACookie,
        queryStringParameters: { id: TEST_CAMPAIGN_B_ID },
      });
      const res: any = await campaignsHandler(event, {} as any);
      assert.equal(res.statusCode, 404);
      // Verify campaign B still exists in DB
      const campaignB = await prisma.campaign.findUnique({ where: { id: TEST_CAMPAIGN_B_ID } });
      assert.ok(campaignB);
    });

    await test('User A cannot delete Template B in Workspace B (returns 404)', async () => {
      const event = makeEvent({
        method: 'DELETE',
        cookieHeader: validUserACookie,
        queryStringParameters: { id: TEST_TEMPLATE_B_ID },
      });
      const res: any = await templatesHandler(event, {} as any);
      assert.equal(res.statusCode, 404);
      // Verify template B still exists
      const templateB = await prisma.template.findUnique({ where: { id: TEST_TEMPLATE_B_ID } });
      assert.ok(templateB);
    });

    await test('User A cannot fetch leads for Campaign B in Workspace B (returns 404)', async () => {
      const event = makeEvent({
        cookieHeader: validUserACookie,
        queryStringParameters: { campaignId: TEST_CAMPAIGN_B_ID },
      });
      const res: any = await campaignLeadsHandler(event, {} as any);
      assert.equal(res.statusCode, 404);
    });

    // =========================================================================
    // TEST 5: Admin session verification & No global admin fallback
    // =========================================================================
    console.log('\n--- Test Suite 5: Administrator Session Isolation ---');

    await test('User A session only authenticates as User A, never implicit admin', async () => {
      const event = makeEvent({ cookieHeader: validUserACookie });
      const res: any = await meHandler(event, {} as any);
      const data = JSON.parse(res.body);
      assert.equal(data.email, 'user_a@test.local');
      assert.notEqual(data.email, 'vamsipallela31@gmail.com');
    });

    await test('Missing session on auth-me NEVER falls back to first DB user or hardcoded admin', async () => {
      const event = makeEvent({});
      const res: any = await meHandler(event, {} as any);
      assert.equal(res.statusCode, 401);
      const body = JSON.parse(res.body);
      assert.equal(body.error, 'Unauthorized');
      assert.equal(body.user, undefined);
    });

    // =========================================================================
    // TEST 6: Hardcoded passwords no longer authenticate accounts
    // =========================================================================
    console.log('\n--- Test Suite 6: Login Backdoor Elimination ---');

    for (const pwd of ['vamsi', 'password123']) {
      await test(`Backdoor password "${pwd}" rejected for user_a@test.local (returns 401)`, async () => {
        const event = makeEvent({
          method: 'POST',
          body: { email: 'user_a@test.local', password: pwd },
          headers: { 'x-forwarded-for': `192.168.1.10${pwd.length}` },
        });
        const res: any = await loginHandler(event, {} as any);
        assert.equal(res.statusCode, 401);
        const data = JSON.parse(res.body);
        assert.equal(data.error, 'Invalid email or password');
      });
    }

    await test('Backdoor passwords rejected for arbitrary or admin email addresses', async () => {
      const event = makeEvent({
        method: 'POST',
        body: { email: 'vamsipallela31@gmail.com', password: 'vamsi' },
        headers: { 'x-forwarded-for': '192.168.1.150' },
      });
      const res: any = await loginHandler(event, {} as any);
      assert.equal(res.statusCode, 401);
      const data = JSON.parse(res.body);
      assert.equal(data.error, 'Invalid email or password');
    });

    // =========================================================================
    // TEST 7: Passwords and tokens do not appear in application logs
    // =========================================================================
    console.log('\n--- Test Suite 7: Sensitive Log Sanitization ---');

    await test('Application logs do not expose passwords or secrets during login', async () => {
      const capturedLogs: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleInfo = console.info;
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;

      const intercept = (...args: any[]) => {
        capturedLogs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      };

      console.log = intercept;
      console.info = intercept;
      console.warn = intercept;
      console.error = intercept;

      const secretAttempt = 'SuperSecretPlaintextPassword!999';

      try {
        // Attempt failed login
        await loginHandler(makeEvent({
          method: 'POST',
          body: { email: 'user_a@test.local', password: secretAttempt },
          headers: { 'x-forwarded-for': '192.168.100.1' },
        }), {} as any);

        // Attempt successful login
        await loginHandler(makeEvent({
          method: 'POST',
          body: { email: 'user_a@test.local', password: 'CorrectPassword123!' },
          headers: { 'x-forwarded-for': '192.168.100.2' },
        }), {} as any);
      } finally {
        console.log = originalConsoleLog;
        console.info = originalConsoleInfo;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
      }

      const allLogs = capturedLogs.join('\n');
      assert.equal(allLogs.includes(secretAttempt), false, 'Logs must NOT contain attempted passwords');
      assert.equal(allLogs.includes('CorrectPassword123!'), false, 'Logs must NOT contain correct password');
      assert.equal(allLogs.includes('[DEBUG] auth-login received body:'), false, 'Legacy debug body logging must be removed');
      
      // Check that logs emitted are structured JSON
      for (const line of capturedLogs) {
        assert.doesNotThrow(() => JSON.parse(line), `Log line should be valid JSON: "${line}"`);
      }
    });

    // =========================================================================
    // TEST 8: Existing legitimate login, logout, and rate limiting work
    // =========================================================================
    console.log('\n--- Test Suite 8: Legitimate Login & Rate Limiting ---');

    let sessionCookieFromLogin = '';

    await test('Legitimate login with correct bcrypt password succeeds (returns 200 & cookie)', async () => {
      const event = makeEvent({
        method: 'POST',
        body: { email: 'user_a@test.local', password: 'CorrectPassword123!' },
        headers: { 'x-forwarded-for': '192.168.200.10' },
      });
      const res: any = await loginHandler(event, {} as any);
      assert.equal(res.statusCode, 200);
      assert.ok(res.headers?.['Set-Cookie']);
      sessionCookieFromLogin = res.headers['Set-Cookie'];
      assert.match(sessionCookieFromLogin, /session=[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
      assert.match(sessionCookieFromLogin, /HttpOnly/i);
      const data = JSON.parse(res.body);
      assert.equal(data.user.email, 'user_a@test.local');
    });

    await test('Cookie from legitimate login successfully authorizes /api/auth/me', async () => {
      const parsed = cookie.parse(sessionCookieFromLogin);
      const event = makeEvent({ cookieHeader: `session=${parsed.session}` });
      const res: any = await meHandler(event, {} as any);
      assert.equal(res.statusCode, 200);
      const data = JSON.parse(res.body);
      assert.equal(data.id, TEST_USER_A_ID);
    });

    await test('Logout handler revokes cookie with expired Max-Age', async () => {
      const event = makeEvent({ method: 'POST' });
      const res: any = await logoutHandler(event, {} as any);
      assert.equal(res.statusCode, 200);
      const setCookie = res.headers?.['Set-Cookie'];
      assert.ok(setCookie);
      assert.match(setCookie, /Max-Age=-1/);
    });

    await test('Rate limiter blocks IP/email after 5 consecutive failed attempts (returns 429)', async () => {
      const testIp = '10.99.88.77';
      const testEmail = 'user_a@test.local';

      // 5 failed attempts
      for (let i = 1; i <= 5; i++) {
        const res: any = await loginHandler(makeEvent({
          method: 'POST',
          body: { email: testEmail, password: 'WrongPassword!' },
          headers: { 'x-forwarded-for': testIp },
        }), {} as any);
        assert.equal(res.statusCode, 401, `Attempt ${i} should return 401`);
      }

      // 6th attempt should trigger 429 Too Many Requests
      const rateLimitedRes: any = await loginHandler(makeEvent({
        method: 'POST',
        body: { email: testEmail, password: 'WrongPassword!' },
        headers: { 'x-forwarded-for': testIp },
      }), {} as any);

      assert.equal(rateLimitedRes.statusCode, 429, '6th attempt should be rate limited to 429');
      assert.ok(rateLimitedRes.headers?.['Retry-After']);
      const body = JSON.parse(rateLimitedRes.body);
      assert.match(body.error, /Too many failed login attempts/i);
    });

  } finally {
    // --- Teardown Test Fixtures ---
    await prisma.template.deleteMany({ where: { id: { in: [TEST_TEMPLATE_A_ID, TEST_TEMPLATE_B_ID] } } });
    await prisma.campaign.deleteMany({ where: { id: { in: [TEST_CAMPAIGN_A_ID, TEST_CAMPAIGN_B_ID] } } });
    await prisma.workspaceMember.deleteMany({ where: { userId: { in: [TEST_USER_A_ID, TEST_USER_B_ID, TEST_USER_NO_WS_ID] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [TEST_WS_A_ID, TEST_WS_B_ID] } } });
    await prisma.user.deleteMany({ where: { id: { in: [TEST_USER_A_ID, TEST_USER_B_ID, TEST_USER_NO_WS_ID] } } });
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`Regression Test Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running regression tests:', err);
  process.exit(1);
});
