import { Handler } from '@netlify/functions';
import prisma from '../lib/prisma';

// 1x1 transparent GIF base64 string
const TRANSPARENT_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export const handler: Handler = async (event) => {
  // Expected path: /api/track/open/[messageId].gif
  try {
    const pathParts = event.path.split('/');
    const file = pathParts[pathParts.length - 1]; // e.g., "123e4567-e89b-12d3-a456-426614174000.gif"
    
    if (file && file.endsWith('.gif')) {
      const messageId = file.replace('.gif', '');

      // We don't want to await this blocking the response for performance.
      // But in a serverless function, we must await to ensure execution completes.
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true, status: true, campaignId: true, prospectId: true }
      });

      // Only mark as OPENED if it was previously SENT or DELIVERED.
      // If it's already REPLIED, BOUNCED, or CLICKED, we don't downgrade the status.
      if (message && (message.status === 'SENT' || message.status === 'DELIVERED')) {
        await prisma.message.update({
          where: { id: messageId },
          data: { status: 'OPENED' }
        });
        
        // Log the event
        await prisma.messageEvent.create({
          data: {
            messageId,
            eventType: 'OPEN',
            metadata: {
              ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown',
              userAgent: event.headers['user-agent'] || 'unknown'
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Tracking Error:', error);
  }

  // Always return the GIF regardless of database success/failure
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache'
    },
    body: TRANSPARENT_GIF.toString('base64'),
    isBase64Encoded: true
  };
};
