import { google } from 'googleapis';
import prisma from './prisma';
import { decrypt, encrypt } from './encryption';

export async function getGoogleClient(emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId }
  });

  if (!account || account.provider !== 'GMAIL') {
    throw new Error('Invalid or missing Google account');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const accessToken = decrypt(account.accessTokenEncrypted);
  const refreshToken = account.refreshTokenEncrypted ? decrypt(account.refreshTokenEncrypted) : undefined;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: account.tokenExpiresAt ? account.tokenExpiresAt.getTime() : undefined,
  });

  // Automatically handle token refresh and save to DB
  oauth2Client.on('tokens', async (tokens) => {
    const updateData: any = {};
    if (tokens.access_token) {
      updateData.accessTokenEncrypted = encrypt(tokens.access_token);
    }
    if (tokens.refresh_token) {
      updateData.refreshTokenEncrypted = encrypt(tokens.refresh_token);
    }
    if (tokens.expiry_date) {
      updateData.tokenExpiresAt = new Date(tokens.expiry_date);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: updateData
      });
    }
  });

  return oauth2Client;
}
