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
      let emailAccounts: any[] = [];
      try {
        emailAccounts = await prisma.emailAccount.findMany({
          where: { workspaceId: { in: workspaceIds } },
          orderBy: { createdAt: 'desc' },
        });
      } catch (dbErr: any) {
        console.warn('Prisma emailAccount lookup failed:', dbErr?.message);
      }

      if (emailAccounts.length === 0 && auth.isDemo) {
        emailAccounts = [
          {
            id: 'demo-acc-1',
            email: 'alex@reachops-demo.io',
            displayName: 'Alex Rivers (Founder)',
            provider: 'GMAIL',
            status: 'ACTIVE',
            dailyLimit: 50,
            sentToday: 14,
            warmupEnabled: true,
            warmupScore: 98,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-acc-2',
            email: 'growth@reachops-demo.io',
            displayName: 'ReachOps Growth Team',
            provider: 'OUTLOOK',
            status: 'ACTIVE',
            dailyLimit: 75,
            sentToday: 28,
            warmupEnabled: true,
            warmupScore: 95,
            createdAt: new Date().toISOString(),
          }
        ];
      }

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
