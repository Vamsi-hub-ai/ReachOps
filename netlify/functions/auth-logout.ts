import { Handler } from '@netlify/functions';
import cookie from 'cookie';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sessionCookie = cookie.serialize('session', '', {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: -1, // Expire immediately
    expires: new Date(0),
  });

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': sessionCookie,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
    body: JSON.stringify({ success: true }),
  };
};
