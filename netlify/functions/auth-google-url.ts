import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import crypto from 'crypto';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

const DEFAULT_CLIENT_ID = '670662356018-b553tq79s516rfj4ebt9m63ifvpkkav5.apps.googleusercontent.com';

export const handler: Handler = async (event) => {
  // Allow GET and OPTIONS (for preflight if needed)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    // 1. Resolve Auth Context
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized: Please sign in to connect Google OAuth');
    }
    const workspaceId = auth.workspaceId;

    // 2. Resolve Client ID & Secret
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // 3. Resolve Redirect URI with priority:
    // Process env GOOGLE_REDIRECT_URI > Host header derived > Netlify Production fallback
    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const proto = event.headers['x-forwarded-proto'] || (host && host.includes('localhost') ? 'http' : 'https');
    const computedRedirectUri = host 
      ? `${proto}://${host}/api/auth/google/callback` 
      : 'https://reachops.netlify.app/api/auth/google/callback';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || computedRedirectUri;

    // 4. Validate Google OAuth credentials presence
    if (!clientId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'GOOGLE_CLIENT_ID_MISSING',
          message: 'Google OAuth Client ID is not configured. Please set GOOGLE_CLIENT_ID in your Netlify Environment Variables.',
        }),
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // 5. Scopes: Request minimum necessary scopes for ReachOps Gmail sending and identity
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    // 6. Cryptographically secure state parameter (CSRF protection + workspace tracking)
    const statePayload = {
      workspaceId,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    // 7. Generate authorization URL with offline access to ensure refresh_token is returned
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Always force consent prompt so Google returns a refresh_token
      scope: scopes,
      state,
      include_granted_scopes: true,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
      body: JSON.stringify({ 
        url,
        clientId,
        redirectUri,
        scopes,
      }),
    };
  } catch (error: any) {
    console.error('Google Auth URL Generation Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'GOOGLE_AUTH_URL_ERROR', 
        message: error?.message || 'Failed to initialize Google OAuth connection.' 
      }),
    };
  }
};
