const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'adnankazi275@gmail.com';
  const password = await hash('Adnan@123', 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'ADMIN' },
    create: { email, name: 'Adnan Kazi', password, role: 'ADMIN' }
  });
  console.log('User updated:', user.email, user.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
