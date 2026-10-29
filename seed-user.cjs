const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const email = 'vamsipallela31@gmail.com';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const hash = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        name: 'Vamsi',
        email,
        passwordHash: hash,
        workspaceMembers: {
          create: {
            role: 'OWNER',
            workspace: {
              create: {
                name: "Vamsi's Workspace",
                ownerId: 'temp',
              },
            },
          },
        },
      },
      include: {
        workspaceMembers: {
          include: { workspace: true },
        },
      },
    });
    await prisma.workspace.update({
      where: { id: user.workspaceMembers[0].workspace.id },
      data: { ownerId: user.id },
    });
    console.log('Successfully created user & workspace for:', email);
  } else {
    console.log('User already exists:', user.email);
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
