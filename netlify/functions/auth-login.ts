import { Handler, HandlerResponse } from '@netlify/functions';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// In-memory rate limiting per function container
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}
const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) return { allowed: true };
  if (now > entry.resetAt) {
    loginAttempts.delete(key);
    return { allowed: true };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { attempts: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.attempts += 1;
  }
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const clientIp = ((event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown') as string)
    .split(',')[0].trim();

  try {
    let bodyText = event.body || '{}';
    if (event.isBase64Encoded) {
      bodyText = Buffer.from(bodyText, 'base64').toString('utf8');
    }

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON request body' }),
      };
    }

    const password = typeof parsedBody.password === 'string' ? parsedBody.password : '';
    let email = typeof parsedBody.email === 'string' ? parsedBody.email.toLowerCase().trim() : '';

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    // UX convenience: allow "demo" shorthand to map to demo@reachops.com
    if (email === 'demo') {
      email = 'demo@reachops.com';
    }

    const rateLimitKey = `${clientIp}:${email}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      console.warn(JSON.stringify({
        event: 'auth_login_rate_limited',
        ip: clientIp,
        timestamp: new Date().toISOString(),
      }));
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfterSec || 60),
        },
        body: JSON.stringify({ error: 'Too many failed login attempts. Please try again later.' }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const isMatch = user && user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !isMatch) {
      recordFailedAttempt(rateLimitKey);
      console.warn(JSON.stringify({
        event: 'auth_login_failed',
        reason: 'invalid_credentials',
        ip: clientIp,
        timestamp: new Date().toISOString(),
      }));
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    clearRateLimit(rateLimitKey);

    const secret = process.env.SESSION_SECRET || 'fallback-secret-key';
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
      expiresIn: '7d',
    });

    const sessionCookie = cookie.serialize('session', token, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    console.info(JSON.stringify({
      event: 'auth_login_success',
      userId: user.id,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    }));

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
    console.error(JSON.stringify({
      event: 'auth_login_error',
      message: error?.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    }));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
