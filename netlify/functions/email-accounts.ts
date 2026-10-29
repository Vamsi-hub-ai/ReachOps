import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    const { workspaceId, workspaceIds } = auth;

    if (event.httpMethod === 'GET') {
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { workspaceId: { in: workspaceIds } },
        orderBy: { createdAt: 'desc' },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailAccounts),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { email, displayName, provider, dailyLimit } = body;

      if (!email) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
      }

      const account = await prisma.emailAccount.create({
        data: {
          workspaceId,
          email,
          displayName: displayName || email.split('@')[0],
          provider: provider || 'GMAIL',
          dailyLimit: dailyLimit || 100,
          providerAccountId: 'manual-' + Date.now(),
          accessTokenEncrypted: 'manual-encrypted-token',
          status: 'ACTIVE',
        },
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      };
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const id = body.id || event.queryStringParameters?.id;
      if (!id) return { statusCode: 400, body: 'Missing account ID' };

      const deleted = await prisma.emailAccount.deleteMany({
        where: { id, workspaceId: { in: workspaceIds } },
      });

      if (deleted.count === 0) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Account not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Email Accounts Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
