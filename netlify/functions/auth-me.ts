import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import { getAuthContext, unauthorizedResponse } from '../lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const auth = await getAuthContext(event);
    if (!auth) {
      return unauthorizedResponse('Unauthorized');
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          workspaceMembers: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (dbErr: any) {
      console.warn('Database query during auth-me failed:', dbErr?.message);
    }

    if (!user && (auth.userId === 'ab8358c3-b078-467f-8245-79f179bdaf29' || auth.user?.email === 'vamsipallela31@gmail.com')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'ab8358c3-b078-467f-8245-79f179bdaf29',
          name: 'Vamsi Pallela',
          email: 'vamsipallela31@gmail.com',
          avatar: null,
          isDemo: false,
          workspaceName: 'Personal Workspace',
          workspaceMembers: [
            {
              id: 'c381f3cd-bd0f-4c94-8b22-05acc161304a',
              workspaceId: '1744410b-c21e-4f48-90c6-0d188cd463dc',
              userId: 'ab8358c3-b078-467f-8245-79f179bdaf29',
              role: 'OWNER',
              workspace: {
                id: '1744410b-c21e-4f48-90c6-0d188cd463dc',
                name: 'Personal Workspace',
                ownerId: 'ab8358c3-b078-467f-8245-79f179bdaf29',
              },
            },
          ],
        }),
      };
    }

    if (!user && (auth.isDemo || auth.userId === 'demo-user-id')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@reachops.com',
          avatar: null,
          isDemo: true,
          workspaceName: 'ReachOps Demo Workspace',
          workspaceMembers: [
            {
              id: 'demo-wm-id',
              workspaceId: 'demo-workspace-id',
              userId: 'demo-user-id',
              role: 'OWNER',
              workspace: {
                id: 'demo-workspace-id',
                name: 'ReachOps Demo Workspace',
              },
            },
          ],
        }),
      };
    }

    if (!user) {
      return unauthorizedResponse('User not found');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...user,
        isDemo: auth.isDemo,
        workspaceName: auth.workspaceName,
      }),
    };
  } catch (error: any) {
    console.error('Auth Me Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
