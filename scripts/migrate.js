/**
 * NUTRATEIN DATA MIGRATION SCRIPT: MongoDB Atlas -> Supabase PostgreSQL
 * 
 * Safely copies all existing collections and records from MongoDB Atlas
 * to the corresponding Supabase PostgreSQL tables without modifying or deleting MongoDB.
 */

// Bypass local Windows Node.js CA cert issues if present
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Helper to convert camelCase to snake_case for PostgreSQL column names
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function mapDoc(doc, customMapping = {}) {
  const result = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === '__v') continue;
    if (key === '_id') {
      result.id = value.toString();
      continue;
    }
    const targetKey = customMapping[key] || toSnakeCase(key);
    // Convert ObjectId instances to strings
    if (value && typeof value === 'object' && value._bsontype === 'ObjectID') {
      result[targetKey] = value.toString();
    } else {
      result[targetKey] = value;
    }
  }
  return result;
}

async function runMigration() {
  console.log("==================================================");
  console.log("🚀 NUTRATEIN MIGRATION: MongoDB -> Supabase");
  console.log("==================================================");

  const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!mongoUri) {
    console.error("❌ DATABASE_URL (MongoDB) is missing in .env");
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase URL or Key is missing in .env");
    process.exit(1);
  }

  console.log(`📡 Connecting to MongoDB Atlas...`);
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db();
  console.log(`✅ MongoDB Connected.`);

  console.log(`📡 Connecting to Supabase (${supabaseUrl})...`);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Verify test connection first
  console.log(`🔍 Verifying test_connection table...`);
  const { data: testData, error: testErr } = await supabase.from('test_connection').select('*').limit(1);
  if (testErr) {
    console.warn(`⚠️ test_connection check notice: ${testErr.message} (code: ${testErr.code})`);
  } else {
    console.log(`✅ Supabase connection verified!`, testData);
  }

  // Ordered list of migrations respecting foreign key constraints
  const migrationPlan = [
    { mongoCol: 'User', pgTable: 'users' },
    { mongoCol: 'Category', pgTable: 'categories' },
    { mongoCol: 'Product', pgTable: 'products' },
    { mongoCol: 'ProductImage', pgTable: 'product_images' },
    { mongoCol: 'ProductVariant', pgTable: 'product_variants' },
    { mongoCol: 'Address', pgTable: 'addresses' },
    { mongoCol: 'Order', pgTable: 'orders' },
    { mongoCol: 'OrderItem', pgTable: 'order_items' },
    { mongoCol: 'Payment', pgTable: 'payments' },
    { mongoCol: 'Review', pgTable: 'reviews' },
    { mongoCol: 'FAQ', pgTable: 'faqs' },
    { mongoCol: 'Coupon', pgTable: 'coupons' },
    { mongoCol: 'SocialLink', pgTable: 'social_links' },
    { mongoCol: 'SiteNotification', pgTable: 'site_notifications' },
    { mongoCol: 'LoyaltyAccount', pgTable: 'loyalty_accounts' },
    { mongoCol: 'LoyaltyTransaction', pgTable: 'loyalty_transactions' },
    { mongoCol: 'Subscription', pgTable: 'subscriptions' },
    { mongoCol: 'Bundle', pgTable: 'bundles' },
    { mongoCol: 'LegalPage', pgTable: 'legal_pages' },
    { mongoCol: 'AuditLog', pgTable: 'audit_logs' },
    { mongoCol: 'NotificationLog', pgTable: 'notification_logs' },
  ];

  for (const { mongoCol, pgTable } of migrationPlan) {
    try {
      const collection = db.collection(mongoCol);
      const docs = await collection.find({}).toArray();

      if (docs.length === 0) {
        console.log(`⚪ ${mongoCol} -> ${pgTable}: 0 records (skipped)`);
        continue;
      }

      console.log(`📦 Migrating ${docs.length} records from ${mongoCol} -> ${pgTable}...`);

      const cleaned = docs.map(d => mapDoc(d));

      // Upsert in batches of 50
      const batchSize = 50;
      let inserted = 0;
      for (let i = 0; i < cleaned.length; i += batchSize) {
        const batch = cleaned.slice(i, i + batchSize);
        const { error } = await supabase.from(pgTable).upsert(batch, { onConflict: 'id' });

        if (error) {
          console.error(`❌ Error migrating ${mongoCol} -> ${pgTable}:`, error.message);
          break;
        } else {
          inserted += batch.length;
        }
      }

      console.log(`✅ ${mongoCol} -> ${pgTable}: ${inserted}/${docs.length} records migrated.`);
    } catch (err) {
      console.error(`⚠️ Exception while migrating ${mongoCol}:`, err.message);
    }
  }

  console.log("==================================================");
  console.log("🎉 Migration process finished. MongoDB is UNTOUCHED.");
  console.log("==================================================");

  await mongoClient.close();
}

runMigration().catch(err => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
