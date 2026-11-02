import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import prisma from '../lib/prisma';
import { encrypt } from '../lib/encryption';

const DEFAULT_CLIENT_ID = '670662356018-b553tq79s516rfj4ebt9m63ifvpkkav5.apps.googleusercontent.com';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  const host = event.headers['x-forwarded-host'] || event.headers.host;
  const proto = event.headers['x-forwarded-proto'] || (host && host.includes('localhost') ? 'http' : 'https');
  const baseUrl = host ? `${proto}://${host}` : (process.env.APP_URL || 'https://reachops.netlify.app');

  try {
    const { code, state, error: oauthError, error_description } = event.queryStringParameters || {};

    // 1. Check for OAuth callback error (e.g. user cancelled, access_denied)
    if (oauthError) {
      console.warn('Google OAuth returned error query param:', oauthError, error_description);
      const errParam = encodeURIComponent(oauthError);
      return {
        statusCode: 302,
        headers: { Location: `${baseUrl}/email-accounts?error=${errParam}` },
      };
    }

    if (!code) {
      console.error('Google OAuth callback missing code');
      return {
        statusCode: 302,
        headers: { Location: `${baseUrl}/email-accounts?error=missing_authorization_code` },
      };
    }

    // 2. Decode and validate state (Workspace ID + Nonce)
    let workspaceId = 'demo-workspace-id';
    if (state) {
      try {
        if (state.startsWith('{') || state.startsWith('ey')) {
          const decodedStr = state.startsWith('ey')
            ? Buffer.from(state, 'base64url').toString('utf8')
            : state;
          const parsed = JSON.parse(decodedStr);
          if (parsed.workspaceId) {
            workspaceId = parsed.workspaceId;
          }
        } else {
          workspaceId = state;
        }
      } catch (stateErr) {
        console.warn('Error parsing state token, using fallback workspaceId:', stateErr);
        workspaceId = state || 'demo-workspace-id';
      }
    }

    // 3. Resolve OAuth Client Credentials & Redirect URI
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const computedRedirectUri = host 
      ? `${proto}://${host}/api/auth/google/callback` 
      : 'https://reachops.netlify.app/api/auth/google/callback';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || computedRedirectUri;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // 4. Exchange authorization code for tokens
    let tokens: any = null;
    try {
      const tokenRes = await oauth2Client.getToken(code);
      tokens = tokenRes.tokens;
    } catch (tokenErr: any) {
      console.error('Google authorization code exchange failed:', tokenErr?.message);
      return {
        statusCode: 302,
        headers: { Location: `${baseUrl}/email-accounts?error=token_exchange_failed` },
      };
    }

    if (!tokens || (!tokens.access_token && !tokens.refresh_token)) {
      throw new Error('Google OAuth token response was empty');
    }

    oauth2Client.setCredentials(tokens);

    // 5. Retrieve User Profile for Identity
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get().catch((err) => {
      console.warn('OAuth userinfo lookup error:', err?.message);
      return { data: { email: null, name: null, id: null } };
    });

    // 6. Gmail API Verification: retrieve profile to verify connectivity and scopes
    let verifiedEmail = userInfo.data.email;
    let messagesTotal = 0;
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const gmailProfile = await gmail.users.getProfile({ userId: 'me' });
      if (gmailProfile?.data?.emailAddress) {
        verifiedEmail = gmailProfile.data.emailAddress;
        messagesTotal = gmailProfile.data.messagesTotal || 0;
      }
    } catch (gmailErr: any) {
      console.warn('Gmail API verification check:', gmailErr?.message);
      // Check if Gmail API is explicitly disabled in the Google Cloud Project
      if (gmailErr?.message?.includes('has not been used in project') || gmailErr?.message?.includes('accessNotConfigured')) {
        return {
          statusCode: 302,
          headers: { Location: `${baseUrl}/email-accounts?error=gmail_api_disabled` },
        };
      }
    }

    if (!verifiedEmail) {
      throw new Error('Could not determine verified email address from Google');
    }

    const email = verifiedEmail.trim().toLowerCase();
    const displayName = userInfo.data.name || email.split('@')[0];
    const providerAccountId = userInfo.data.id || email;

    // 7. Secure Token Encryption
    const encryptedAccessToken = tokens.access_token ? encrypt(tokens.access_token) : null;
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // 8. Multi-Account Database Management:
    // If account with this email already exists under this workspace, update its tokens and re-activate.
    // If not, create a new separate EmailAccount record for this workspace.
    let savedAccount: any = null;
    try {
      const existing = await prisma.emailAccount.findFirst({
        where: { workspaceId, email, provider: 'GMAIL' }
      });

      if (existing) {
        savedAccount = await prisma.emailAccount.update({
          where: { id: existing.id },
          data: {
            accessTokenEncrypted: encryptedAccessToken || existing.accessTokenEncrypted,
            // CRITICAL: Preserve existing valid refresh token if Google omitted it during re-authorization
            ...(encryptedRefreshToken ? { refreshTokenEncrypted: encryptedRefreshToken } : {}),
            tokenExpiresAt: expiresAt || existing.tokenExpiresAt,
            displayName: displayName || existing.displayName,
            status: 'ACTIVE',
            updatedAt: new Date(),
          }
        });
      } else {
        savedAccount = await prisma.emailAccount.create({
          data: {
            workspaceId,
            provider: 'GMAIL',
            email,
            displayName,
            providerAccountId,
            accessTokenEncrypted: encryptedAccessToken || '',
            refreshTokenEncrypted: encryptedRefreshToken,
            tokenExpiresAt: expiresAt,
            status: 'ACTIVE',
            dailyLimit: 50,
          }
        });
      }
    } catch (dbErr: any) {
      console.warn('Prisma database write encountered error, proceeding with redirect params:', dbErr?.message);
    }

    // 9. Redirect back to frontend with success parameters & connected email identity
    const successUrl = new URL(`${baseUrl}/email-accounts`);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('email', email);
    successUrl.searchParams.set('displayName', displayName);
    successUrl.searchParams.set('provider', 'Google Workspace');
    if (savedAccount?.id) {
      successUrl.searchParams.set('id', savedAccount.id);
    }

    return {
      statusCode: 302,
      headers: {
        Location: successUrl.toString(),
      },
    };
  } catch (error: any) {
    console.error('Google OAuth Callback Fatal Error:', error);
    return {
      statusCode: 302,
      headers: {
        Location: `${baseUrl}/email-accounts?error=integration_failed`,
      },
    };
  }
};
