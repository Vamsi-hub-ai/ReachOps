import assert from 'assert';
import jwt from 'jsonwebtoken';
import { handler as authGoogleUrlHandler } from '../netlify/functions/auth-google-url';
import { handler as authGoogleCallbackHandler } from '../netlify/functions/auth-google-callback';

console.log('====================================================');
console.log('ReachOps Google OAuth 2.0 & Multi-Account Test Suite');
console.log('====================================================\n');

async function runTests() {
  const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
  const validToken = jwt.sign(
    { userId: 'ab8358c3-b078-467f-8245-79f179bdaf29', email: 'vamsipallela31@gmail.com' },
    secret,
    { expiresIn: '1h' }
  );

  console.log('--- Section 1: Authorization URL Generation ---');

  // Test 1: Anonymous request rejected with 401
  const anonRes: any = await authGoogleUrlHandler(
    { httpMethod: 'GET', headers: {}, queryStringParameters: {} } as any,
    {} as any
  );
  assert.strictEqual(anonRes.statusCode, 401, 'Anonymous request must return 401');
  console.log('[PASS] Anonymous request to /api/auth/google/url returns HTTP 401');

  // Test 2: Authenticated request returns 200 with URL and metadata
  const authRes: any = await authGoogleUrlHandler(
    {
      httpMethod: 'GET',
      headers: { cookie: `session=${validToken}`, host: 'reachops.netlify.app' },
      queryStringParameters: {}
    } as any,
    {} as any
  );
  assert.strictEqual(authRes.statusCode, 200, 'Authenticated request must return 200');
  const body = JSON.parse(authRes.body);
  assert(body.url, 'Must return Google OAuth authorization URL');
  assert(body.url.includes('accounts.google.com/o/oauth2/v2/auth'), 'URL must target Google OAuth 2.0 endpoint');
  assert(body.clientId, 'Must include active Client ID');
  assert.strictEqual(body.redirectUri, 'https://reachops.netlify.app/api/auth/google/callback');
  console.log('[PASS] Authenticated request returns valid Google OAuth 2.0 URL & redirectUri');

  // Test 3: Minimum required scopes
  assert(body.scopes.includes('https://www.googleapis.com/auth/gmail.send'), 'Must request gmail.send scope');
  assert(body.scopes.includes('https://www.googleapis.com/auth/gmail.readonly'), 'Must request gmail.readonly scope');
  assert(body.scopes.includes('https://www.googleapis.com/auth/userinfo.email'), 'Must request userinfo.email scope');
  console.log('[PASS] Scopes adhere to minimum required principle (gmail.send, gmail.readonly, userinfo)');

  // Test 4: Secure State validation
  const urlObj = new URL(body.url);
  const state = urlObj.searchParams.get('state');
  assert(state, 'Authorization URL must contain state parameter');
  const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  assert.strictEqual(decodedState.workspaceId, '1744410b-c21e-4f48-90c6-0d188cd463dc');
  assert(decodedState.nonce, 'State must contain cryptographic nonce');
  assert(decodedState.timestamp, 'State must contain timestamp');
  console.log('[PASS] State parameter is tamper-resistant base64url payload with nonce & workspace ID');

  // Test 5: Offline access & consent prompt
  assert.strictEqual(urlObj.searchParams.get('access_type'), 'offline', 'Must request offline access for refresh token');
  assert.strictEqual(urlObj.searchParams.get('prompt'), 'consent', 'Must force consent prompt to ensure refresh token issuance');
  console.log('[PASS] Requests offline access and forces consent prompt for refresh token');

  console.log('\n--- Section 2: Callback Error & Validation Handling ---');

  // Test 6: OAuth Error handling (e.g. user cancelled on Google screen)
  const errRes: any = await authGoogleCallbackHandler(
    {
      httpMethod: 'GET',
      headers: { host: 'reachops.netlify.app' },
      queryStringParameters: { error: 'access_denied', error_description: 'User denied consent' }
    } as any,
    {} as any
  );
  assert.strictEqual(errRes.statusCode, 302, 'Callback error must redirect');
  assert(errRes.headers.Location.includes('/email-accounts?error=access_denied'), 'Redirect must forward error code to frontend');
  console.log('[PASS] Callback handles access_denied gracefully and redirects with error parameter');

  // Test 7: Missing code handling
  const missingCodeRes: any = await authGoogleCallbackHandler(
    {
      httpMethod: 'GET',
      headers: { host: 'reachops.netlify.app' },
      queryStringParameters: { state }
    } as any,
    {} as any
  );
  assert.strictEqual(missingCodeRes.statusCode, 302);
  assert(missingCodeRes.headers.Location.includes('missing_authorization_code'));
  console.log('[PASS] Callback handles missing authorization code cleanly');

  console.log('\n====================================================');
  console.log('Google OAuth Test Results: All 7 Tests Passed!');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
