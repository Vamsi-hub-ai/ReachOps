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

    if (error) {
      console.error('Google OAuth error from query:', error);
      return {
        statusCode: 302,
        headers: { Location: `${process.env.APP_URL}/email-accounts?error=${error}` },
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
      process.env.GOOGLE_REDIRECT_URI
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

    // Upsert the email account
    await prisma.emailAccount.upsert({
      where: { 
        id: 'mock-uuid-to-force-create', // prisma upsert needs a unique key, but workspaceId+email isn't marked unique in schema
      },
      create: {
        workspaceId,
        provider: 'GMAIL',
        email,
        displayName,
        providerAccountId,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken || '', // Schema expects string? Wait schema says String? Yes, optional
        tokenExpiresAt: expiresAt,
        status: 'ACTIVE',
      },
      update: {
        accessTokenEncrypted: encryptedAccessToken,
        ...(encryptedRefreshToken && { refreshTokenEncrypted: encryptedRefreshToken }),
        tokenExpiresAt: expiresAt,
        status: 'ACTIVE',
      }
    }).catch(async (err) => {
       // Since we don't have a unique constraint on email+workspaceId in the schema to use for upsert,
       // we will find first and update, or create.
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
    });

    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.APP_URL}/email-accounts?success=true`,
      },
    };
  } catch (error: any) {
    console.error('Google OAuth Callback Error:', error);
    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.APP_URL}/email-accounts?error=integration_failed`,
      },
    };
  }
};
