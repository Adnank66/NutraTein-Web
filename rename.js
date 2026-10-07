const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.category.updateMany({ where: { slug: 'mass-goal' }, data: { name: 'BULK' }});
  console.log('Renamed MASS goal to BULK');
}
main().catch(console.error).finally(() => prisma.$disconnect());
