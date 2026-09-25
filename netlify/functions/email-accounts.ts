import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };

    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string, email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });

    if (!user || user.workspaceMembers.length === 0) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const workspaceId = user.workspaceMembers[0].workspaceId;

    if (event.httpMethod === 'GET') {
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { workspaceId }
      });
      return {
        statusCode: 200,
        body: JSON.stringify(emailAccounts)
      };
    } else if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body || '{}');
      if (!id) return { statusCode: 400, body: 'Missing account ID' };
      
      const account = await prisma.emailAccount.findFirst({
        where: { id, workspaceId }
      });
      if (!account) return { statusCode: 404, body: 'Account not found' };
      
      await prisma.emailAccount.delete({ where: { id } });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }
  } catch (error: any) {
    console.error('Email Accounts Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
