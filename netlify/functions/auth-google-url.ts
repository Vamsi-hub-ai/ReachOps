import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Authenticate user
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    
    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string, email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });
    if (!user) return { statusCode: 401, body: 'Unauthorized' };

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    // Pass the user's workspace ID in state so we know where to save it
    const workspaceId = user.workspaceMembers[0].workspaceId;
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request a refresh token
      prompt: 'consent', // Force consent to guarantee a refresh token is returned
      scope: scopes,
      state: workspaceId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url }),
      headers: {
        'Content-Type': 'application/json',
      }
    };
  } catch (error: any) {
    console.error('Google Auth URL Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
