import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    let bodyText = event.body || '{}';
    if (event.isBase64Encoded) {
      bodyText = Buffer.from(bodyText, 'base64').toString('utf8');
    }
    const { name, email, password } = JSON.parse(bodyText);
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name, email and password are required' }),
      };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email already exists' }),
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user and a default workspace
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        workspaceMembers: {
          create: {
            role: 'OWNER',
            workspace: {
              create: {
                name: `${name}'s Workspace`,
                ownerId: 'temp', // We will update this immediately after
              },
            },
          },
        },
      },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    // Update workspace ownerId to match user Id
    const defaultWorkspace = user.workspaceMembers[0].workspace;
    await prisma.workspace.update({
      where: { id: defaultWorkspace.id },
      data: { ownerId: user.id },
    });

    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
      expiresIn: '7d',
    });

    const sessionCookie = cookie.serialize('session', token, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': sessionCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      }),
    };
  } catch (error: any) {
    console.error('Signup Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
