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
    maxAge: -1, // Expire immediately
  });

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': sessionCookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true }),
  };
};
