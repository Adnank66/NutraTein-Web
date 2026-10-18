/**
 * Database Initialization Script for NutraTein-Web
 * 
 * Connects to MongoDB via lib/mongodb.js using process.env.MONGODB_URI.
 * Creates all required collections and builds all indexes.
 * Seeds initial admin accounts and store catalog if empty.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const fs = require('fs');

const connectToDatabase = require('../lib/mongodb');
const {
  User,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  Address,
  Order,
  OrderItem,
} = require('../lib/models');

const models = [
  { name: 'User', model: User },
  { name: 'Category', model: Category },
  { name: 'Product', model: Product },
  { name: 'ProductImage', model: ProductImage },
  { name: 'ProductVariant', model: ProductVariant },
  { name: 'Address', model: Address },
  { name: 'Order', model: Order },
  { name: 'OrderItem', model: OrderItem },
];

async function initDB() {
  console.log('========================================================');
  console.log('🚀 NUTRATEIN DATABASE INITIALIZATION');
  console.log('========================================================');

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    console.log(`📡 Connected to Database: "${mongoose.connection.name}" on host: "${mongoose.connection.host}"\n`);

    // 1. Fetch existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name));

    const summary = [];

    // 2. Create collections and synchronize indexes
    for (const { name, model } of models) {
      let created = false;
      if (!existingNames.has(name)) {
        await db.createCollection(name);
        created = true;
      }

      // Synchronize schema indexes
      await model.syncIndexes();
      const indexes = await model.collection.indexes();

      summary.push({
        Collection: name,
        Status: created ? 'Created Now' : 'Already Existed',
        IndexCount: indexes.length,
      });
    }

    console.table(summary);

    // 3. Setup / Seed Admin Accounts
    console.log('\n🔐 Ensuring Admin and Super Admin Accounts exist...');

    // Super Admin: adnankazi275@gmail.com / Adnan@123
    const superAdminPasswordHash = await bcrypt.hash('Adnan@123', 12);
    const superAdminEmails = ['adnankazi275@gmail.com', 'adnankazi275@gmai.com'];
    for (const superEmail of superAdminEmails) {
      await User.findOneAndUpdate(
        { email: superEmail },
        {
          $set: {
            name: 'Adnan Kazi (Super Admin)',
            password: superAdminPasswordHash,
            role: 'SUPER_ADMIN',
            isActive: true,
            emailVerified: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log('✅ Super Admin account configured: adnankazi275@gmail.com (Role: SUPER_ADMIN)');

    // Admin: nutratein@gmail.com / Mynb@2808
    const adminPasswordHash = await bcrypt.hash('Mynb@2808', 12);
    await User.findOneAndUpdate(
      { email: 'nutratein@gmail.com' },
      {
        $set: {
          name: 'Nutratein Admin',
          password: adminPasswordHash,
          role: 'ADMIN',
          phone: '7030407080',
          isActive: true,
          emailVerified: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('✅ Current Admin account configured: nutratein@gmail.com (Role: ADMIN)');

    // 4. Seed Categories and Products if collections are empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('\n📦 Seeding initial catalog from products-catalog.json...');
      const catalogPath = path.join(__dirname, '..', 'src', 'data', 'products-catalog.json');
      if (fs.existsSync(catalogPath)) {
        const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        const productsList = catalogData.products || [];

        // Seed default category
        let defaultCategory = await Category.findOne({ slug: 'supplements' });
        if (!defaultCategory) {
          defaultCategory = await Category.create({
            name: 'Supplements',
            slug: 'supplements',
            type: 'PRODUCT',
            description: 'Premium Fitness & Sports Nutrition',
            sortOrder: 1,
          });
        }

        for (const p of productsList) {
          const productDoc = await Product.create({
            name: p.name,
            slug: p.slug,
            brand: p.brand || 'NUTRATEIN',
            description: p.description || p.name,
            shortDesc: p.tagline || null,
            categoryId: defaultCategory._id,
            basePrice: p.price || 999,
            mrp: p.mrp || p.originalPrice || 1499,
            discountPercent: p.discount || 0,
            rating: p.rating || 4.8,
            reviewCount: p.reviewCount || 12,
            isFeatured: true,
            isBestSeller: p.badge === 'BEST SELLER',
            isNew: p.badge === 'NEW',
            isActive: true,
            stockQuantity: p.stock || 50,
          });

          // Seed Primary Image
          const imgUrl = p.image || p.posterImage;
          if (imgUrl) {
            await ProductImage.create({
              productId: productDoc._id,
              url: imgUrl,
              alt: p.name,
              isPrimary: true,
              sortOrder: 0,
            });
          }

          // Seed Variants
          if (Array.isArray(p.variants) && p.variants.length > 0) {
            for (const v of p.variants) {
              await ProductVariant.create({
                productId: productDoc._id,
                flavor: v.flavor || null,
                size: v.size || v.weight || null,
                sku: v.sku || `${productDoc.slug}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                price: v.price || productDoc.basePrice,
                stock: v.stock || 50,
                isActive: true,
              });
            }
          } else {
            await ProductVariant.create({
              productId: productDoc._id,
              flavor: p.flavor || 'Default',
              size: p.weight || 'Standard',
              sku: `${productDoc.slug}-STD`,
              price: productDoc.basePrice,
              stock: 50,
              isActive: true,
            });
          }
        }
        console.log(`✅ Seeded ${productsList.length} products with images and variants.`);
      }
    } else {
      console.log(`ℹ️ Catalog already contains ${productCount} products.`);
    }

    console.log('\n🎉 Database initialization finished successfully!\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization error:', error.message);
    process.exit(1);
  }
}

initDB();
