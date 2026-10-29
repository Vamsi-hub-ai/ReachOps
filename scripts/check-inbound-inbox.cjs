const { handler: inboxHandler } = require('../netlify/functions/inbox');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'demo@reachops.com' } });
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.SESSION_SECRET || 'super-secret-key-change-in-production');
  const sessionCookie = cookie.serialize('session', token);

  const res = await inboxHandler({
    httpMethod: 'GET',
    path: '/api/campaigns/demo-camp-inbound-nurture/inbox',
    queryStringParameters: { campaignId: 'demo-camp-inbound-nurture' },
    headers: { cookie: sessionCookie }
  }, {}, () => {});

  console.log('Status:', res.statusCode);
  const data = JSON.parse(res.body);
  console.log('Campaign ID:', data.campaignId);
  console.log('Total threads:', data.total);
  console.log('Threads:', data.threads.map(t => ({ name: t.name, email: t.email, tag: t.tag, snippet: t.snippet })));
}

check().finally(() => prisma.$disconnect());

