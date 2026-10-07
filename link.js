const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.category.updateMany({ where: { slug: 'muscle' }, data: { linkedCategorySlug: 'whey' }});
  await prisma.category.updateMany({ where: { slug: 'mass-goal' }, data: { linkedCategorySlug: 'whey' }}); // User asked "add WHEY PROTEIN for the MASS"
  await prisma.category.updateMany({ where: { slug: 'strength' }, data: { linkedCategorySlug: 'mass' }}); // "add the MASS GAINER for the STRENGTH"
  await prisma.category.updateMany({ where: { slug: 'energy' }, data: { linkedCategorySlug: 'creatine' }}); // "add the CREATINE for the ENERGY"
  await prisma.category.updateMany({ where: { slug: 'recovery' }, data: { linkedCategorySlug: 'pre-workout-prod' }}); // "add the PRE-WORKOUT for the RECOVERY"
  await prisma.category.updateMany({ where: { slug: 'lean' }, data: { linkedCategorySlug: 'burn' }});
  await prisma.category.updateMany({ where: { slug: 'endurance' }, data: { linkedCategorySlug: 'pre-workout-prod' }});
  console.log('Linked categories updated.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
