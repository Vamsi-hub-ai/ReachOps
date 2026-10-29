import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

export function netlifyFunctionsDevPlugin(): Plugin {
  return {
    name: 'netlify-functions-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const pathname = urlObj.pathname;

          // Route mapping
          let funcName: string | null = null;
          
          if (pathname === '/api/auth/google/callback') {
            funcName = 'auth-google-callback';
          } else if (pathname === '/api/auth/google/url' || pathname === '/api/auth/google-url') {
            funcName = 'auth-google-url';
          } else if (pathname === '/api/auth/login') {
            funcName = 'auth-login';
          } else if (pathname === '/api/auth/signup') {
            funcName = 'auth-signup';
          } else if (pathname === '/api/auth/me') {
            funcName = 'auth-me';
          } else if (pathname === '/api/auth/logout') {
            funcName = 'auth-logout';
          } else if (pathname === '/api/email-accounts') {
            funcName = 'email-accounts';
          } else if (pathname === '/api/deliverability-diagnose') {
            funcName = 'deliverability-diagnose';
          } else if (pathname === '/api/campaigns' || pathname === '/api/campaigns/') {
            funcName = 'campaigns';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+\/analytics$/)) {
            funcName = 'campaigns-analytics';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+\/sequence$/)) {
            funcName = 'campaigns-sequence';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+\/settings$/)) {
            funcName = 'campaigns-settings';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+\/start$/)) {
            funcName = 'campaigns-start';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+\/sync-sheet$/)) {
            funcName = 'campaigns-sync-sheet';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+\/leads$/)) {
            funcName = 'campaigns-leads';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+\/inbox$/)) {
            funcName = 'inbox';
          } else if (pathname === '/api/inbox' || pathname === '/api/inbox/') {
            funcName = 'inbox';
          } else if (pathname.match(/^\/api\/campaigns\/[^/]+$/)) {
            funcName = 'campaigns';
          } else if (pathname === '/api/analytics/dashboard' || pathname === '/api/analytics-dashboard') {
            funcName = 'analytics-dashboard';
          } else if (pathname === '/api/activity-log') {
            funcName = 'activity-log';
          } else if (pathname === '/api/templates') {
            funcName = 'templates';
          } else if (pathname === '/api/sheets/list') {
            funcName = 'sheets-list';
          } else if (pathname === '/api/sheets/columns') {
            funcName = 'sheets-columns';
          } else if (pathname === '/api/sheets/worksheets') {
            funcName = 'sheets-worksheets';
          } else if (pathname === '/api/track/open' || pathname === '/api/track-open') {
            funcName = 'track-open';
          } else {
            const clean = pathname.replace(/^\/api\//, '').replace(/\//g, '-');
            funcName = clean;
          }

          const funcFile = path.resolve(process.cwd(), 'netlify', 'functions', `${funcName}.ts`);
          if (!fs.existsSync(funcFile)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: `Function ${funcName} not found` }));
          }

          // Read request body
          const chunks: any[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const rawBody = Buffer.concat(chunks).toString('utf8');

          // Query parameters map
          const queryParams: Record<string, string> = {};
          urlObj.searchParams.forEach((val, key) => {
            queryParams[key] = val;
          });

          // Extract campaign ID if present in path
          const campaignMatch = pathname.match(/\/campaigns\/([^/]+)/);
          if (campaignMatch && !queryParams.campaignId) {
            queryParams.campaignId = campaignMatch[1];
          }

          // Header map
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) {
            if (v) headers[k] = Array.isArray(v) ? v.join(', ') : v;
          }

          // Netlify event
          const event = {
            rawUrl: req.url,
            rawQuery: urlObj.search.replace(/^\?/, ''),
            path: pathname,
            httpMethod: req.method || 'GET',
            headers,
            multiValueHeaders: {},
            queryStringParameters: queryParams,
            multiValueQueryStringParameters: null,
            body: rawBody,
            isBase64Encoded: false,
          };

          // Load function module using Vite's ssrLoadModule
          const mod = await server.ssrLoadModule(funcFile);
          const result = await mod.handler(event, {});

          res.statusCode = result?.statusCode || 200;

          if (result?.headers) {
            for (const [hk, hv] of Object.entries(result.headers)) {
              res.setHeader(hk, hv as string);
            }
          }

          if (result?.multiValueHeaders) {
            for (const [hk, hv] of Object.entries(result.multiValueHeaders)) {
              res.setHeader(hk, hv as string[]);
            }
          }

          res.end(result?.body || '');
        } catch (err: any) {
          console.error('[API Dev Server Error]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      });
    }
  };
}
