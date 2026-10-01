// scripts/test-order.js
// Temporary test script to verify that orders appear live in MongoDB Compass

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: 'backend/.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Connecting to MongoDB Atlas via Prisma...');
  
  const rawUrl = process.env.DATABASE_URL || '';
  // Extract database name from URL
  let dbName = 'default';
  try {
    const cleanUrl = rawUrl.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://');
    const parsed = new URL(cleanUrl);
    dbName = parsed.pathname.replace(/^\//, '') || 'test';
  } catch {
    dbName = 'protein_store';
  }

  // 1. Ensure test user exists
  const testEmail = 'compass_test@proteinx.in';
  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Compass Verification Tester',
        email: testEmail,
        phone: '+91 93215 98094',
        role: 'USER',
      },
    });
    console.log('✅ Created test user:', user.email, `(${user.id})`);
  } else {
    console.log('✅ Found existing test user:', user.email, `(${user.id})`);
  }

  // 2. Ensure test address exists
  let address = await prisma.address.findFirst({ where: { userId: user.id } });
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        name: user.name || 'Compass Tester',
        phone: '+91 93215 98094',
        houseFlat: 'Flat 402, Elite Heights',
        street: 'MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
    });
    console.log('✅ Created test address:', address.id);
  }

  // 3. Create dummy order
  const orderNumber = 'ORD-TEST-' + Math.floor(100000 + Math.random() * 900000);
  const testOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      addressId: address.id,
      status: 'CONFIRMED',
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      subtotal: 549,
      shippingAmount: 0,
      totalAmount: 549,
      items: {
        create: [
          {
            productId: '507f1f77bcf86cd799439011', // valid ObjectId format
            productName: 'CreaCore Creatine Monohydrate',
            quantity: 1,
            price: 549,
            flavor: 'Unflavoured',
            size: '100g',
          },
        ],
      },
    },
    include: {
      items: true,
      address: true,
      user: true,
    },
  });

  console.log('\n======================================================');
  console.log('🎉 TEST ORDER CREATED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('Order ID:       ', testOrder.id);
  console.log('Order Number:   ', testOrder.orderNumber);
  console.log('Customer:       ', testOrder.user.name, `(${testOrder.user.email})`);
  console.log('Total Amount:   ', '₹' + testOrder.totalAmount);
  console.log('Status:         ', testOrder.status);
  console.log('Date:           ', testOrder.createdAt.toISOString());
  console.log('------------------------------------------------------');
  console.log('📍 IN MONGODB COMPASS, CHECK:');
  console.log('   Database:    ', dbName);
  console.log('   Collection:  ', 'Order');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error creating test order:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
