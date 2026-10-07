const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  const products = await prisma.product.findMany();

  for (const c of cats) {
    let hasProduct = false;
    if (c.type === 'GOAL') {
      hasProduct = products.some(p => p.goalCategoryIds.includes(c.id));
    } else {
      hasProduct = products.some(p => p.categoryId === c.id);
    }

    if (!hasProduct) {
      console.log('Deleting empty category:', c.name);
      await prisma.category.delete({ where: { id: c.id } });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
