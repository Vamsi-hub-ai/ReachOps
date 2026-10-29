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
      const templates = await prisma.template.findMany({
        where: { workspaceId: { in: workspaceIds } },
        orderBy: { updatedAt: 'desc' },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const template = await prisma.template.create({
        data: {
          workspaceId,
          name: body.name || 'Untitled Template',
          category: body.category || 'General',
          subject: body.subject || '',
          body: body.body || '',
        },
      });
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const templateId = event.path.split('/').pop() || body.id;
      if (!templateId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing template ID' }) };
      }

      // Verify template belongs to user's workspace
      const existing = await prisma.template.findFirst({
        where: { id: templateId, workspaceId: { in: workspaceIds } },
      });

      if (!existing) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Template not found' }),
        };
      }

      const template = await prisma.template.update({
        where: { id: templateId },
        data: {
          name: body.name,
          category: body.category,
          subject: body.subject,
          body: body.body,
        },
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      };
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const templateId = body.id || event.queryStringParameters?.id || event.path.split('/').pop();
      if (!templateId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing template ID' }) };
      }

      // Verify template belongs to user's workspace
      const existing = await prisma.template.findFirst({
        where: { id: templateId, workspaceId: { in: workspaceIds } },
      });

      if (!existing) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Template not found' }),
        };
      }

      await prisma.template.delete({
        where: { id: templateId },
      });
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Templates API Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Server error' }),
    };
  }
};
