// scripts/seed-authentic-products.js
// Seeds the 7 authentic products with exact poster prices and images into MongoDB Atlas

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: 'backend/.env' });

const catalog = require('../src/data/products-catalog.json');
const prisma = new PrismaClient();

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function seed() {
  console.log('🔄 Seeding authentic products to MongoDB Atlas ("Proteinweb")...');

  for (const item of catalog.products) {
    const categorySlug = slugify(item.category);
    
    // 1. Upsert Category
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: item.category },
      create: {
        name: item.category,
        slug: categorySlug,
        description: `Authentic ${item.category} nutrition formulas`,
        sortOrder: 1,
      },
    });

    // 2. Upsert Product
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        brand: item.brand || 'NUTRATEIN',
        description: item.description,
        shortDesc: item.tagline,
        categoryId: category.id,
        basePrice: item.price,
        mrp: item.mrp || item.originalPrice,
        discountPercent: item.discount || 0,
        rating: item.rating || 4.9,
        reviewCount: item.reviewCount || 100,
        isBestSeller: Boolean(item.badge && item.badge.includes('BEST')),
        isNew: Boolean(item.badge && item.badge.includes('NEW')),
        isActive: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        brand: item.brand || 'NUTRATEIN',
        description: item.description,
        shortDesc: item.tagline,
        categoryId: category.id,
        basePrice: item.price,
        mrp: item.mrp || item.originalPrice,
        discountPercent: item.discount || 0,
        rating: item.rating || 4.9,
        reviewCount: item.reviewCount || 100,
        isBestSeller: Boolean(item.badge && item.badge.includes('BEST')),
        isNew: Boolean(item.badge && item.badge.includes('NEW')),
        isActive: true,
      },
    });

    // 3. Upsert primary image
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true },
    });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: item.image || item.posterImage,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    } else {
      await prisma.productImage.update({
        where: { id: existingImg.id },
        data: { url: item.image || item.posterImage },
      });
    }

    // 4. Upsert variants
    if (item.variants && item.variants.length > 0) {
      for (const v of item.variants) {
        const sku = v.sku || `${item.slug}-${slugify(v.size || v.weight || 'std')}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {
            price: v.price,
            stock: v.stock || 50,
            flavor: v.flavor || item.flavor,
            size: v.size || v.weight,
          },
          create: {
            productId: product.id,
            sku,
            price: v.price,
            stock: v.stock || 50,
            flavor: v.flavor || item.flavor,
            size: v.size || v.weight,
            isActive: true,
          },
        });
      }
    }

    console.log(`✅ Seeded: ${product.name} (ID: ${product.id}) - ₹${product.basePrice}`);
  }

  console.log('\n🎉 ALL 7 AUTHENTIC PRODUCTS SUCCESSFULLY SEEDED TO MONGODB ATLAS!\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
