import { Handler } from '@netlify/functions';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const handler: Handler = async (event) => {
  try {
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.session;
    if (!token) return { statusCode: 401, body: 'Unauthorized' };
    
    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { workspaceMembers: true }
    });
    
    if (!user || user.workspaceMembers.length === 0) {
       return { statusCode: 403, body: 'No workspace' };
    }
    const workspaceId = user.workspaceMembers[0].workspaceId; // For simplicity, pick first

    if (event.httpMethod === 'GET') {
      const templates = await prisma.template.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: 'desc' }
      });
      return { statusCode: 200, body: JSON.stringify(templates) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const template = await prisma.template.create({
        data: {
          workspaceId,
          name: body.name,
          category: body.category,
          subject: body.subject,
          body: body.body,
        }
      });
      return { statusCode: 201, body: JSON.stringify(template) };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const templateId = event.path.split('/').pop();
      if (!templateId) return { statusCode: 400, body: 'Missing ID' };

      const template = await prisma.template.update({
        where: { id: templateId, workspaceId }, // ensure it belongs to workspace
        data: {
          name: body.name,
          category: body.category,
          subject: body.subject,
          body: body.body,
        }
      });
      return { statusCode: 200, body: JSON.stringify(template) };
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      if (!body.id) return { statusCode: 400, body: 'Missing ID' };

      await prisma.template.delete({
        where: { id: body.id, workspaceId }
      });
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Templates API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Server error' }),
    };
  }
};
