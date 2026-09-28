const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function test() {
  const email = 'test_vamsi_auth@example.com';
  const password = 'password123';
  
  // 1. Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('hashed:', passwordHash);
  
  // 2. Create user
  try {
    const user = await prisma.user.create({
      data: {
        name: 'Vamsi',
        email,
        passwordHash,
      }
    });
    console.log('Created user:', user.email, user.passwordHash);
  } catch(e) {
    console.log('Error creating user', e.message);
  }

  // 3. Find user
  const foundUser = await prisma.user.findUnique({ where: { email } });
  console.log('Found user:', foundUser.email, foundUser.passwordHash);

  // 4. Compare
  const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
  console.log('Password match:', isMatch);

  await prisma.user.delete({ where: { email } });
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
