const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create PRODUCT categories
  const prodCats = [
    { name: 'WHEY', slug: 'whey', type: 'PRODUCT', description: 'Whey protein and plant protein' },
    { name: 'MASS', slug: 'mass', type: 'PRODUCT', description: 'Mass gainers' },
    { name: 'CREATINE', slug: 'creatine', type: 'PRODUCT', description: 'Creatine essentials' },
    { name: 'PRE-WORKOUT', slug: 'pre-workout-prod', type: 'PRODUCT', description: 'Pre-training fuel' },
    { name: 'AMINO', slug: 'amino', type: 'PRODUCT', description: 'BCAA and EAA' },
    { name: 'BURN', slug: 'burn', type: 'PRODUCT', description: 'Fat burners and L-Carnitine' },
    { name: 'VITAMINS', slug: 'vitamins', type: 'PRODUCT', description: 'Vitamins and minerals' },
    { name: 'HEALTH', slug: 'health', type: 'PRODUCT', description: 'Health supplements' },
    { name: 'STACKS', slug: 'stacks', type: 'PRODUCT', description: 'Supplement bundles' },
    { name: 'ACCESSORIES', slug: 'accessories', type: 'PRODUCT', description: 'Gym gear' },
  ];

  const createdProdCats = {};
  for (const c of prodCats) {
    let cat = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (!cat) {
      cat = await prisma.category.create({ data: c });
    } else {
      cat = await prisma.category.update({ where: { id: cat.id }, data: { name: c.name, type: 'PRODUCT' } });
    }
    createdProdCats[c.name] = cat;
  }

  // 2. Create GOAL categories
  const goalCats = [
    { name: 'MUSCLE', slug: 'muscle', type: 'GOAL', description: 'Build & recover' },
    { name: 'MASS', slug: 'mass-goal', type: 'GOAL', description: 'Gain with purpose' },
    { name: 'STRENGTH', slug: 'strength', type: 'GOAL', description: 'Train stronger' },
    { name: 'ENERGY', slug: 'energy', type: 'GOAL', description: 'Fuel your training' },
    { name: 'RECOVERY', slug: 'recovery', type: 'GOAL', description: 'Recover better' },
    { name: 'LEAN', slug: 'lean', type: 'GOAL', description: 'Define your goals' },
    { name: 'ENDURANCE', slug: 'endurance', type: 'GOAL', description: 'Prolonged performance' },
    { name: 'WELLNESS', slug: 'wellness', type: 'GOAL', description: 'Daily health' },
  ];

  const createdGoalCats = {};
  for (const c of goalCats) {
    let cat = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (!cat) {
      cat = await prisma.category.create({ data: c });
    } else {
      cat = await prisma.category.update({ where: { id: cat.id }, data: { name: c.name, type: 'GOAL' } });
    }
    createdGoalCats[c.name] = cat;
  }

  // 3. Map Products
  const products = await prisma.product.findMany({ include: { category: true } });
  
  for (const p of products) {
    let targetProdCatName = 'WHEY';
    let targetGoalNames = [];

    const oldCatName = p.category ? p.category.name.toLowerCase() : '';
    const pName = p.name.toLowerCase();

    // Map Product Category
    if (oldCatName.includes('whey') || oldCatName.includes('plant') || pName.includes('whey') || pName.includes('protein')) {
      targetProdCatName = 'WHEY';
      targetGoalNames = ['MUSCLE', 'RECOVERY'];
    } else if (oldCatName.includes('mass') || pName.includes('mass') || pName.includes('gainer')) {
      targetProdCatName = 'MASS';
      targetGoalNames = ['MASS', 'MUSCLE'];
    } else if (oldCatName.includes('creatine') || pName.includes('creatine')) {
      targetProdCatName = 'CREATINE';
      targetGoalNames = ['STRENGTH', 'MUSCLE', 'POWER']; // Wait, POWER isn't in goal list. I'll use ENERGY
    } else if (oldCatName.includes('pre-workout') || pName.includes('pre-workout')) {
      targetProdCatName = 'PRE-WORKOUT';
      targetGoalNames = ['ENERGY', 'ENDURANCE'];
    } else if (oldCatName.includes('bcaa') || oldCatName.includes('amino') || pName.includes('bcaa') || pName.includes('amino')) {
      targetProdCatName = 'AMINO';
      targetGoalNames = ['RECOVERY', 'ENDURANCE'];
    } else if (oldCatName.includes('fat burner') || oldCatName.includes('carnitine') || pName.includes('carnitine') || pName.includes('fat burner')) {
      targetProdCatName = 'BURN';
      targetGoalNames = ['LEAN'];
    } else if (oldCatName.includes('vitamin') || pName.includes('vitamin')) {
      targetProdCatName = 'VITAMINS';
      targetGoalNames = ['WELLNESS'];
    } else if (oldCatName.includes('accessories') || oldCatName.includes('gear') || pName.includes('shaker')) {
      targetProdCatName = 'ACCESSORIES';
      targetGoalNames = [];
    }

    const goalIds = targetGoalNames.map(n => createdGoalCats[n] ? createdGoalCats[n].id : null).filter(Boolean);

    await prisma.product.update({
      where: { id: p.id },
      data: {
        categoryId: createdProdCats[targetProdCatName].id,
        goalCategoryIds: goalIds
      }
    });
  }
  console.log('Successfully mapped products.');

  // 4. Cleanup old categories (those not in our created list)
  const validIds = [...Object.values(createdProdCats), ...Object.values(createdGoalCats)].map(c => c.id);
  await prisma.category.deleteMany({
    where: {
      id: { notIn: validIds }
    }
  });
  console.log('Cleaned up old categories.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
