const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
    if (!cat) cat = await prisma.category.create({ data: c });
    createdGoalCats[c.name] = cat;
  }

  const createdProdCats = {};
  for (const c of prodCats) {
    let cat = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (!cat) cat = await prisma.category.create({ data: c });
    createdProdCats[c.name] = cat;
  }

  // Explicit mappings to guarantee they exist
  const products = await prisma.product.findMany();
  for (const p of products) {
    let goalNames = [];
    const pName = p.name.toLowerCase();
    
    if (pName.includes('whey') || pName.includes('plant')) goalNames.push('MUSCLE', 'RECOVERY');
    if (pName.includes('mass') || pName.includes('gainer')) goalNames.push('MASS', 'MUSCLE');
    if (pName.includes('creatine')) goalNames.push('STRENGTH', 'ENERGY', 'MUSCLE');
    if (pName.includes('pre-workout')) goalNames.push('ENERGY', 'ENDURANCE', 'RECOVERY');
    if (pName.includes('amino') || pName.includes('bcaa')) goalNames.push('RECOVERY', 'ENDURANCE');
    if (pName.includes('fat burner') || pName.includes('carnitine')) goalNames.push('LEAN');
    if (pName.includes('vitamin')) goalNames.push('WELLNESS');

    // Make unique
    goalNames = [...new Set(goalNames)];

    if (goalNames.length > 0) {
      const goalIds = goalNames.map(n => createdGoalCats[n].id);
      await prisma.product.update({
        where: { id: p.id },
        data: { goalCategoryIds: goalIds }
      });
    }
  }
  console.log("Restored categories and verified mappings.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
