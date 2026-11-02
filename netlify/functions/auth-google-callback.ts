import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import prisma from '../lib/prisma';
import { encrypt } from '../lib/encryption';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { code, state, error } = event.queryStringParameters || {};

    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const baseUrl = host ? `${proto}://${host}` : (process.env.APP_URL || 'https://reachops.netlify.app');
    const defaultRedirectUri = host ? `${proto}://${host}/api/auth/google/callback` : 'https://reachops.netlify.app/api/auth/google/callback';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || defaultRedirectUri;

    if (error) {
      console.error('Google OAuth error from query:', error);
      return {
        statusCode: 302,
        headers: { Location: `${baseUrl}/email-accounts?error=${error}` },
      };
    }

    if (!code || !state) {
      return {
        statusCode: 400,
        body: 'Missing code or state',
      };
    }

    const workspaceId = state;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info to store the email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    if (!userInfo.data.email) {
      throw new Error('Could not get email from Google');
    }

    const email = userInfo.data.email;
    const displayName = userInfo.data.name || email;
    const providerAccountId = userInfo.data.id || email;

    const encryptedAccessToken = encrypt(tokens.access_token || '');
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Find first and update or create email account for this workspace
    const existing = await prisma.emailAccount.findFirst({
      where: { workspaceId, email, provider: 'GMAIL' }
    });
    
    if (existing) {
      await prisma.emailAccount.update({
        where: { id: existing.id },
        data: {
          accessTokenEncrypted: encryptedAccessToken,
          ...(encryptedRefreshToken && { refreshTokenEncrypted: encryptedRefreshToken }),
          tokenExpiresAt: expiresAt,
          displayName: displayName || existing.displayName,
          status: 'ACTIVE',
        }
      });
    } else {
      await prisma.emailAccount.create({
        data: {
          workspaceId,
          provider: 'GMAIL',
          email,
          displayName,
          providerAccountId,
          accessTokenEncrypted: encryptedAccessToken,
          refreshTokenEncrypted: encryptedRefreshToken,
          tokenExpiresAt: expiresAt,
          status: 'ACTIVE',
        }
      });
    }

    return {
      statusCode: 302,
      headers: {
        Location: `${baseUrl}/email-accounts?success=true`,
      },
    };
  } catch (error: any) {
    console.error('Google OAuth Callback Error:', error);
    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const fallbackBaseUrl = host ? `${proto}://${host}` : (process.env.APP_URL || 'https://reachops.netlify.app');
    return {
      statusCode: 302,
      headers: {
        Location: `${fallbackBaseUrl}/email-accounts?error=integration_failed`,
      },
    };
  }
};
