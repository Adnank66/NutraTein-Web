const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'nutratein@gmail.com';
  const password = await hash('Mynb@2808', 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'ADMIN', phone: '8779060033' },
    create: { email, name: 'Adnan Kazi', password, role: 'ADMIN', phone: '8779060033' }
  });
  console.log('User updated:', user.email, user.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
