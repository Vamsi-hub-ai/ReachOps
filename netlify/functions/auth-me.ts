import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;

    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string, email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        workspaceMembers: {
          include: {
            workspace: true,
          }
        }
      }
    });

    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'User not found' }) };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    };
  } catch (error: any) {
    console.error('Auth-Me Error:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }
};
