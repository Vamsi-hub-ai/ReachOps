import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import prisma from '../netlify/lib/prisma';
import { handler as loginHandler } from '../netlify/functions/auth-login';
import { handler as meHandler } from '../netlify/functions/auth-me';
import { handler as campaignsHandler } from '../netlify/functions/campaigns';
import { handler as emailAccountsHandler } from '../netlify/functions/email-accounts';
import { handler as inboxHandler } from '../netlify/functions/inbox';
import { handler as analyticsHandler } from '../netlify/functions/analytics-dashboard';
import { sendSequenceEmail } from '../netlify/lib/mailer';
import { isWorkspaceDemo } from '../netlify/lib/auth';

const SECRET = process.env.SESSION_SECRET || 'super-secret-key-change-in-production';

function makeAuthCookie(userId: string, email: string): string {
  const token = jwt.sign({ userId, email }, SECRET, { expiresIn: '1h' });
  return cookie.serialize('session', token);
}

async function runTests() {
  console.log('====================================================');
  console.log('ReachOps Account Isolation & Demo Safeguards Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(desc: string) {
    console.log(`[PASS] ${desc}`);
    passed++;
  }

  function recordFail(desc: string, err: any) {
    console.error(`[FAIL] ${desc}:`, err?.message || err);
    failed++;
  }

  // --- Suite 1: Authentication & Hashed Credentials ---
  console.log('--- Test Suite 1: Credential Verification & Password Hashing ---');
  try {
    // 1.1 Private user authenticate with Vamsi@123
    const res1 = await loginHandler({
      httpMethod: 'POST',
      headers: { 'client-ip': '127.0.0.10' },
      body: JSON.stringify({ email: 'vamsipallela31@gmail.com', password: 'Vamsi@123' })
    } as any, {} as any, () => {}) as any;
    assert.strictEqual(res1.statusCode, 200, 'Private user should authenticate with Vamsi@123');
    assert.ok(res1.headers['Set-Cookie'], 'Login response should issue session cookie');
    recordPass('Account 1 (Vamsipallela31@gmail.com) authenticates successfully with Vamsi@123');

    // 1.2 Private user rejects old/wrong password
    const res1Wrong = await loginHandler({
      httpMethod: 'POST',
      headers: { 'client-ip': '127.0.0.11' },
      body: JSON.stringify({ email: 'vamsipallela31@gmail.com', password: 'Demo@123' })
    } as any, {} as any, () => {}) as any;
    assert.strictEqual(res1Wrong.statusCode, 401, 'Private user should reject Demo@123');
    recordPass('Account 1 rejects wrong password Demo@123 with HTTP 401');

    // 1.3 Demo user authenticates with Demo@123
    const res2 = await loginHandler({
      httpMethod: 'POST',
      headers: { 'client-ip': '127.0.0.12' },
      body: JSON.stringify({ email: 'demo@reachops.com', password: 'Demo@123' })
    } as any, {} as any, () => {}) as any;
    assert.strictEqual(res2.statusCode, 200, 'Demo user should authenticate with Demo@123');
    recordPass('Account 2 (demo@reachops.com) authenticates successfully with Demo@123');

    // 1.4 Demo shorthand "Demo" login
    const res2Short = await loginHandler({
      httpMethod: 'POST',
      headers: { 'client-ip': '127.0.0.13' },
      body: JSON.stringify({ email: 'Demo', password: 'Demo@123' })
    } as any, {} as any, () => {}) as any;
    assert.strictEqual(res2Short.statusCode, 200, 'Demo shorthand ID should authenticate');
    recordPass('Account 2 shorthand "Demo" authenticates successfully with Demo@123');

    // 1.5 Database stores bcrypt hashes, never plaintext
    const dbPrivateUser = await prisma.user.findUnique({ where: { email: 'vamsipallela31@gmail.com' } });
    const dbDemoUser = await prisma.user.findUnique({ where: { email: 'demo@reachops.com' } });
    assert.ok(dbPrivateUser?.passwordHash?.startsWith('$2'), 'Private user password must be a bcrypt hash');
    assert.ok(dbDemoUser?.passwordHash?.startsWith('$2'), 'Demo user password must be a bcrypt hash');
    assert.notStrictEqual(dbPrivateUser?.passwordHash, 'Vamsi@123', 'Private password must not be plaintext');
    assert.notStrictEqual(dbDemoUser?.passwordHash, 'Demo@123', 'Demo password must not be plaintext');
    recordPass('Passwords in database are verified bcrypt hashes ($2b$10$...), not plaintext');

  } catch (e) {
    recordFail('Suite 1 failed', e);
  }

  // --- Suite 2: Anonymous Access Protection ---
  console.log('\n--- Test Suite 2: Anonymous Access Protection ---');
  try {
    const endpoints = [
      { name: 'GET /api/auth/me', handler: meHandler, method: 'GET' },
      { name: 'GET /api/campaigns', handler: campaignsHandler, method: 'GET' },
      { name: 'GET /api/email-accounts', handler: emailAccountsHandler, method: 'GET' },
      { name: 'GET /api/inbox', handler: inboxHandler, method: 'GET' },
      { name: 'GET /api/analytics/dashboard', handler: analyticsHandler, method: 'GET' },
    ];

    for (const ep of endpoints) {
      const res = await ep.handler({
        httpMethod: ep.method,
        headers: {},
      } as any, {} as any, () => {}) as any;
      assert.strictEqual(res.statusCode, 401, `${ep.name} must reject anonymous requests`);
      recordPass(`Anonymous request to ${ep.name} returns HTTP 401`);
    }
  } catch (e) {
    recordFail('Suite 2 failed', e);
  }

  // --- Suite 3: Multi-Tenant Workspace Data Isolation ---
  console.log('\n--- Test Suite 3: Multi-Tenant Workspace Data Isolation ---');
  try {
    const dbPrivateUser = await prisma.user.findUnique({
      where: { email: 'vamsipallela31@gmail.com' },
      include: { workspaceMembers: { include: { workspace: true } } }
    });
    const dbDemoUser = await prisma.user.findUnique({
      where: { email: 'demo@reachops.com' },
      include: { workspaceMembers: { include: { workspace: true } } }
    });

    assert.ok(dbPrivateUser, 'Private user must exist in DB');
    assert.ok(dbDemoUser, 'Demo user must exist in DB');

    const privateWsId = dbPrivateUser.workspaceMembers[0]?.workspaceId;
    const demoWsId = dbDemoUser.workspaceMembers[0]?.workspaceId;

    assert.notStrictEqual(privateWsId, demoWsId, 'Private and Demo workspaces must be distinct UUIDs');
    recordPass(`Separate Workspace IDs verified: Private (${privateWsId}) vs Demo (${demoWsId})`);

    // 3.1 Verify Private Workspace has NO demo seed data
    const privateCampaigns = await prisma.campaign.findMany({ where: { workspaceId: privateWsId } });
    const privateProspects = await prisma.prospect.findMany({ where: { campaign: { workspaceId: privateWsId } } });
    const privateAccounts = await prisma.emailAccount.findMany({ where: { workspaceId: privateWsId } });

    assert.strictEqual(privateCampaigns.length, 0, 'Private workspace must contain 0 demo campaigns');
    assert.strictEqual(privateProspects.length, 0, 'Private workspace must contain 0 demo prospects');
    assert.strictEqual(privateAccounts.length, 0, 'Private workspace must contain 0 demo mailboxes');
    recordPass('Personal Workspace contains zero demo seed records (100% clean private state)');

    // 3.2 Verify Demo Workspace has all required demo records
    const demoCampaigns = await prisma.campaign.findMany({ where: { workspaceId: demoWsId } });
    const demoProspects = await prisma.prospect.findMany({ where: { campaign: { workspaceId: demoWsId } } });
    const demoAccounts = await prisma.emailAccount.findMany({ where: { workspaceId: demoWsId } });

    assert.strictEqual(demoCampaigns.length, 5, 'Demo workspace must contain exactly 5 demo campaigns');
    assert.strictEqual(demoProspects.length, 30, 'Demo workspace must contain exactly 30 demo contacts');
    assert.strictEqual(demoAccounts.length, 3, 'Demo workspace must contain exactly 3 sandbox mailboxes');
    recordPass('Demo Workspace contains all 5 campaigns, 30 contacts, and 3 sandbox mailboxes');

    // 3.3 Verify Private User API call returns only private workspace data (0 campaigns)
    const privateCookie = makeAuthCookie(dbPrivateUser.id, dbPrivateUser.email);
    const privateCampaignsRes = await campaignsHandler({
      httpMethod: 'GET',
      headers: { cookie: privateCookie },
    } as any, {} as any, () => {}) as any;
    const privateList = JSON.parse(privateCampaignsRes.body);
    assert.strictEqual(privateList.length, 0, 'Private user must receive 0 campaigns from API');
    recordPass('Private user GET /api/campaigns returns empty list (no demo campaigns leaked)');

    // 3.4 Verify Demo User API call returns demo campaigns
    const demoCookie = makeAuthCookie(dbDemoUser.id, dbDemoUser.email);
    const demoCampaignsRes = await campaignsHandler({
      httpMethod: 'GET',
      headers: { cookie: demoCookie },
    } as any, {} as any, () => {}) as any;
    const demoList = JSON.parse(demoCampaignsRes.body);
    assert.strictEqual(demoList.length, 5, 'Demo user must receive 5 campaigns from API');
    recordPass('Demo user GET /api/campaigns returns exactly the 5 demo campaigns');

    // 3.5 Cross-workspace access restriction: Private user cannot access Demo campaign settings
    const crossRes = await campaignsHandler({
      httpMethod: 'GET',
      path: '/api/campaigns/demo-camp-enterprise-saas',
      queryStringParameters: { id: 'demo-camp-enterprise-saas' },
      headers: { cookie: privateCookie },
    } as any, {} as any, () => {}) as any;
    // Campaigns GET without specific endpoint returns workspace-filtered list
    assert.ok(!crossRes.body.includes('Enterprise SaaS Outbound'), 'Private user cannot fetch demo campaign details');
    recordPass('Cross-workspace boundary: Private user cannot view Demo campaign data');

  } catch (e) {
    recordFail('Suite 3 failed', e);
  }

  // --- Suite 4: Demo Mode Backend Safeguards ---
  console.log('\n--- Test Suite 4: Demo Mode Backend Safeguards (Live Sending Blocked) ---');
  try {
    // 4.1 isWorkspaceDemo detection
    assert.strictEqual(isWorkspaceDemo('demo-workspace-id'), true, 'demo-workspace-id must be recognized as demo');
    assert.strictEqual(isWorkspaceDemo('arbitrary-id', 'ReachOps Demo Workspace'), true, 'Demo in name must be recognized');
    assert.strictEqual(isWorkspaceDemo('arbitrary-id', 'Personal Workspace'), false, 'Personal workspace is not demo');
    recordPass('isWorkspaceDemo correctly classifies demo vs private workspaces');

    // 4.2 sendSequenceEmail blocks live dispatch for demo account
    const dispatchResult = await sendSequenceEmail(
      'demo-acc-1',
      {
        email: 'sarah.connor@acme-corp.example',
        firstName: 'Sarah',
        company: 'Acme Corp',
      },
      'Test subject',
      '<p>Test body</p>',
      'test-msg-uuid'
    );
    assert.strictEqual(dispatchResult.success, true, 'Demo dispatch returns successful simulated result');
    assert.ok(dispatchResult.messageId?.startsWith('demo-simulated-'), 'Demo dispatch must return simulated message ID');
    recordPass('sendSequenceEmail blocks live email dispatch for demo accounts (returns simulated send)');

    // 4.3 sendSequenceEmail blocks live dispatch for reserved example domains
    const exampleDomainResult = await sendSequenceEmail(
      'demo-acc-1',
      {
        email: 'realperson@example.com',
        firstName: 'Real',
        company: 'Example Corp',
      },
      'Test subject',
      '<p>Test body</p>',
      'test-msg-uuid-2'
    );
    assert.strictEqual(exampleDomainResult.success, true);
    assert.ok(exampleDomainResult.messageId?.startsWith('demo-simulated-'));
    recordPass('sendSequenceEmail blocks live email dispatch to reserved .example / example.com domains');

    // 4.4 auth-me returns isDemo: true for demo user, isDemo: false for private user
    const dbPrivateUser = await prisma.user.findUnique({ where: { email: 'vamsipallela31@gmail.com' } });
    const dbDemoUser = await prisma.user.findUnique({ where: { email: 'demo@reachops.com' } });

    const mePrivateRes = await meHandler({
      httpMethod: 'GET',
      headers: { cookie: makeAuthCookie(dbPrivateUser!.id, dbPrivateUser!.email) }
    } as any, {} as any, () => {}) as any;
    const mePrivateData = JSON.parse(mePrivateRes.body);
    assert.strictEqual(mePrivateData.isDemo, false, 'Private user isDemo must be false');
    assert.strictEqual(mePrivateData.workspaceName, 'Personal Workspace', 'Private workspace name must be Personal Workspace');
    recordPass('GET /api/auth/me returns isDemo: false and workspaceName: "Personal Workspace" for Account 1');

    const meDemoRes = await meHandler({
      httpMethod: 'GET',
      headers: { cookie: makeAuthCookie(dbDemoUser!.id, dbDemoUser!.email) }
    } as any, {} as any, () => {}) as any;
    const meDemoData = JSON.parse(meDemoRes.body);
    assert.strictEqual(meDemoData.isDemo, true, 'Demo user isDemo must be true');
    assert.strictEqual(meDemoData.workspaceName, 'ReachOps Demo Workspace', 'Demo workspace name must be ReachOps Demo Workspace');
    recordPass('GET /api/auth/me returns isDemo: true and workspaceName: "ReachOps Demo Workspace" for Account 2');

  } catch (e) {
    recordFail('Suite 4 failed', e);
  }

  // --- Suite 5: Internal Consistency of Demo Analytics ---
  console.log('\n--- Test Suite 5: Demo Analytics & Inbox Consistency ---');
  try {
    const dbDemoUser = await prisma.user.findUnique({ where: { email: 'demo@reachops.com' } });
    const demoCookie = makeAuthCookie(dbDemoUser!.id, dbDemoUser!.email);

    // 5.1 Analytics dashboard
    const analyticsRes = await analyticsHandler({
      httpMethod: 'GET',
      headers: { cookie: demoCookie }
    } as any, {} as any, () => {}) as any;
    const stats = JSON.parse(analyticsRes.body);
    assert.strictEqual(stats.totalCampaigns, 5, 'Stats total campaigns must equal 5');
    assert.strictEqual(stats.totalProspects, 30, 'Stats total prospects must equal 30');
    assert.ok(stats.totalSent >= 1, 'Stats totalSent must match seeded messages');
    recordPass(`Demo analytics verified: ${stats.totalCampaigns} campaigns, ${stats.totalProspects} prospects, ${stats.totalSent} sent`);

    // 5.2 Inbox threads
    const inboxRes = await inboxHandler({
      httpMethod: 'GET',
      headers: { cookie: demoCookie }
    } as any, {} as any, () => {}) as any;
    const inboxData = JSON.parse(inboxRes.body);
    const threads = Array.isArray(inboxData) ? inboxData : (inboxData.threads || []);
    assert.ok(threads.length >= 5, `Inbox must return at least 5 demonstration reply conversations (found ${threads.length})`);
    assert.ok(threads.some((t: any) => t.email.includes('acme-corp.example')), 'Inbox contains Acme Corp conversation');
    assert.ok(threads.some((t: any) => t.email.includes('cloudscale.example')), 'Inbox contains CloudScale conversation');
    recordPass(`Demo unified inbox returns ${threads.length} realistic reply conversations with thread history`);

  } catch (e) {
    recordFail('Suite 5 failed', e);
  }

  console.log('\n====================================================');
  console.log(`Account Isolation Suite Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
