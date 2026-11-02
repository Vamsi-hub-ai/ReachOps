import tls from 'tls';
import net from 'net';

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  timeoutMs?: number;
}

export interface SmtpMail {
  from: string;
  to: string;
  rawMime: string;
}

/**
 * Clean sender email extraction from formats like 'Name <email@domain.com>' or 'email@domain.com'
 */
function extractEmail(str: string): string {
  const match = str.match(/<([^>]+)>/);
  return (match ? match[1] : str).trim();
}

/**
 * Native, zero-dependency, high-deliverability SMTP client for Node.js.
 * Handles both Port 465 (Implicit TLS - Gmail/Yahoo) and Port 587 (STARTTLS - Outlook/Office 365/SES/Mailgun).
 */
export async function sendSmtpEmail(
  config: SmtpConfig,
  mail: SmtpMail
): Promise<{ success: boolean; messageId?: string; response?: string }> {
  const timeoutMs = config.timeoutMs || 20000;
  const isImplicitTls = config.port === 465 || config.secure === true;
  const cleanFrom = extractEmail(mail.from);
  const cleanTo = extractEmail(mail.to);
  const cleanPass = (config.auth.pass || '').replace(/\s+/g, '');

  return new Promise((resolve, reject) => {
    let socket: net.Socket | tls.TLSSocket;
    let timer: NodeJS.Timeout;
    let step = 0;
    let buffer = '';

    const cleanup = () => {
      clearTimeout(timer);
      if (socket && !socket.destroyed) {
        socket.destroy();
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`SMTP connection timed out after ${timeoutMs}ms to ${config.host}:${config.port}`));
    }, timeoutMs);

    const onDataHandler = (data: Buffer) => {
      buffer += data.toString('utf8');

      // SMTP multi-line responses continue with code- (e.g. 250-), final line is code<space> (e.g. 250 )
      const lines = buffer.split('\r\n');
      if (lines.length < 2) return; // Wait for complete line

      const lastCompleteLine = lines[lines.length - 2];
      const match = lastCompleteLine.match(/^(\d{3})([ -])(.*)$/);
      if (!match) return;

      const code = parseInt(match[1], 10);
      const isIntermediate = match[2] === '-';
      if (isIntermediate) return; // Multi-line continuation, wait for final line

      const currentResponse = buffer;
      buffer = ''; // Reset buffer for next command

      try {
        // Step 0: Server 220 greeting
        if (step === 0) {
          if (code !== 220) throw new Error(`Unexpected SMTP greeting: ${currentResponse.trim()}`);
          step = 1;
          socket.write('EHLO reachops.io\r\n');
          return;
        }

        // Step 1: EHLO response
        if (step === 1) {
          if (code !== 250) throw new Error(`EHLO rejected: ${currentResponse.trim()}`);
          
          if (!isImplicitTls && config.port === 587) {
            // Need STARTTLS upgrade
            step = 10; // STARTTLS step
            socket.write('STARTTLS\r\n');
            return;
          }

          // Direct AUTH LOGIN
          step = 2;
          socket.write('AUTH LOGIN\r\n');
          return;
        }

        // Step 10: STARTTLS response
        if (step === 10) {
          if (code !== 220) throw new Error(`STARTTLS rejected: ${currentResponse.trim()}`);
          
          // Upgrade plain socket to TLS
          const plainSocket = socket;
          plainSocket.removeAllListeners('data');
          plainSocket.removeAllListeners('error');

          const tlsSocket = tls.connect({
            socket: plainSocket,
            host: config.host,
            rejectUnauthorized: false,
          });

          socket = tlsSocket;
          socket.on('data', onDataHandler);
          socket.on('error', (err) => {
            cleanup();
            reject(err);
          });

          step = 11; // Re-issue EHLO over TLS
          tlsSocket.write('EHLO reachops.io\r\n');
          return;
        }

        // Step 11: EHLO after STARTTLS
        if (step === 11) {
          if (code !== 250) throw new Error(`Post-TLS EHLO rejected: ${currentResponse.trim()}`);
          step = 2;
          socket.write('AUTH LOGIN\r\n');
          return;
        }

        // Step 2: Server asks for username (334)
        if (step === 2) {
          if (code !== 334) throw new Error(`AUTH LOGIN rejected: ${currentResponse.trim()}`);
          step = 3;
          socket.write(Buffer.from(config.auth.user).toString('base64') + '\r\n');
          return;
        }

        // Step 3: Server asks for password (334)
        if (step === 3) {
          if (code !== 334) throw new Error(`Username rejected: ${currentResponse.trim()}`);
          step = 4;
          socket.write(Buffer.from(cleanPass).toString('base64') + '\r\n');
          return;
        }

        // Step 4: Authentication successful (235)
        if (step === 4) {
          if (code !== 235) throw new Error(`Invalid mailbox credentials (password or App Password rejected): ${currentResponse.trim()}`);
          step = 5;
          socket.write(`MAIL FROM:<${cleanFrom}>\r\n`);
          return;
        }

        // Step 5: MAIL FROM accepted (250)
        if (step === 5) {
          if (code !== 250) throw new Error(`MAIL FROM rejected for <${cleanFrom}>: ${currentResponse.trim()}`);
          step = 6;
          socket.write(`RCPT TO:<${cleanTo}>\r\n`);
          return;
        }

        // Step 6: RCPT TO accepted (250)
        if (step === 6) {
          if (code !== 250) throw new Error(`Recipient <${cleanTo}> rejected by mail server: ${currentResponse.trim()}`);
          step = 7;
          socket.write('DATA\r\n');
          return;
        }

        // Step 7: Ready for DATA (354)
        if (step === 7) {
          if (code !== 354) throw new Error(`DATA command rejected: ${currentResponse.trim()}`);
          step = 8;
          // Ensure MIME body ends with \r\n.\r\n
          const payload = mail.rawMime.endsWith('\r\n') ? `${mail.rawMime}.\r\n` : `${mail.rawMime}\r\n.\r\n`;
          socket.write(payload);
          return;
        }

        // Step 8: Email accepted for delivery (250)
        if (step === 8) {
          if (code !== 250) throw new Error(`Message data delivery rejected: ${currentResponse.trim()}`);
          
          // Successfully accepted by SMTP server!
          const deliveryResponse = currentResponse.trim();
          try {
            socket.write('QUIT\r\n');
          } catch (_) {}
          
          cleanup();
          resolve({
            success: true,
            response: deliveryResponse,
            messageId: deliveryResponse.split(' ')[2] || `smtp-${Date.now()}`,
          });
          return;
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    if (isImplicitTls) {
      // Port 465 (Implicit TLS)
      socket = tls.connect({
        host: config.host,
        port: config.port,
        rejectUnauthorized: false,
      });
    } else {
      // Port 587 or 25 (Plain text initial, upgraded with STARTTLS)
      socket = net.connect({
        host: config.host,
        port: config.port,
      });
    }

    socket.on('data', onDataHandler);
    socket.on('error', (err) => {
      cleanup();
      reject(err);
    });
  });
}

