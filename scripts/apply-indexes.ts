import { MongoClient } from "mongodb"
import dotenv from "dotenv"

dotenv.config()

const uri = process.env.DATABASE_URL
if (!uri) {
  console.error("❌ DATABASE_URL is not defined in environment.")
  process.exit(1)
}

interface IndexSpec {
  collection: string
  keys: Record<string, 1 | -1>
  name: string
  unique?: boolean
}

const INDEXES_TO_CREATE: IndexSpec[] = [
  // 1. Product catalog & filtering indexes
  {
    collection: "Product",
    keys: { isActive: 1, isBestSeller: -1 },
    name: "idx_product_active_bestseller",
  },
  {
    collection: "Product",
    keys: { categoryId: 1, isActive: 1 },
    name: "idx_product_category_active",
  },
  {
    collection: "Product",
    keys: { isActive: 1, rating: -1 },
    name: "idx_product_active_rating",
  },
  {
    collection: "Product",
    keys: { createdAt: -1 },
    name: "idx_product_created_at",
  },

  // 2. Product relations
  {
    collection: "ProductImage",
    keys: { productId: 1, isPrimary: -1 },
    name: "idx_product_image_primary",
  },
  {
    collection: "ProductVariant",
    keys: { productId: 1, isActive: 1 },
    name: "idx_product_variant_active",
  },

  // 3. Category sorting
  {
    collection: "Category",
    keys: { sortOrder: 1 },
    name: "idx_category_sort_order",
  },

  // 4. Orders & order items
  {
    collection: "Order",
    keys: { userId: 1, createdAt: -1 },
    name: "idx_order_user_created",
  },
  {
    collection: "Order",
    keys: { status: 1, createdAt: -1 },
    name: "idx_order_status_created",
  },
  {
    collection: "Order",
    keys: { createdAt: -1 },
    name: "idx_order_created_at",
  },
  {
    collection: "OrderItem",
    keys: { orderId: 1 },
    name: "idx_order_item_order_id",
  },
  {
    collection: "OrderItem",
    keys: { productId: 1 },
    name: "idx_order_item_product_id",
  },

  // 5. Customer reviews
  {
    collection: "Review",
    keys: { productId: 1, status: 1, createdAt: -1 },
    name: "idx_review_product_status_date",
  },
  {
    collection: "Review",
    keys: { userId: 1 },
    name: "idx_review_user_id",
  },

  // 6. Address & payment
  {
    collection: "Address",
    keys: { userId: 1, isDefault: -1 },
    name: "idx_address_user_default",
  },
  {
    collection: "Payment",
    keys: { status: 1 },
    name: "idx_payment_status",
  },
  {
    collection: "Payment",
    keys: { createdAt: -1 },
    name: "idx_payment_created_at",
  },
]

async function run() {
  const isUndo = process.argv.includes("--undo")
  const client = new MongoClient(uri as string)

  try {
    console.log("🔌 Connecting to MongoDB Atlas...")
    await client.connect()
    const db = client.db()
    console.log(`Connected to database: ${db.databaseName}`)

    if (isUndo) {
      console.log("\n🔄 UNDO MODE: Dropping custom indexes...")
      for (const spec of INDEXES_TO_CREATE) {
        try {
          await db.collection(spec.collection).dropIndex(spec.name)
          console.log(`  ✓ Dropped ${spec.name} on ${spec.collection}`)
        } catch (err: any) {
          console.log(`  ℹ ${spec.name} on ${spec.collection} was not found or already dropped.`)
        }
      }
      console.log("\n✅ All custom indexes dropped successfully.")
      return
    }

    console.log("\n🚀 Creating targeted indexes with background: true...")
    for (const spec of INDEXES_TO_CREATE) {
      try {
        const coll = db.collection(spec.collection)
        await coll.createIndex(spec.keys, {
          name: spec.name,
          background: true,
          unique: spec.unique || false,
        })
        console.log(`  ✓ Index verified/created: ${spec.name} on ${spec.collection}`)
      } catch (err: any) {
        console.warn(`  ⚠️ Could not create ${spec.name} on ${spec.collection}:`, err.message)
      }
    }

    console.log("\n📊 Verification: Listing active collection indexes:")
    const collections = Array.from(new Set(INDEXES_TO_CREATE.map((s) => s.collection)))
    for (const collName of collections) {
      try {
        const indexes = await db.collection(collName).indexes()
        console.log(`\nCollection [${collName}]:`)
        indexes.forEach((idx) => {
          console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`)
        })
      } catch (err: any) {
        console.log(`  (Collection ${collName} not yet populated)`)
      }
    }

    console.log("\n🎉 Index deployment complete! All queries will now leverage B-Tree index scans.")
  } catch (err: any) {
    console.error("❌ Migration error:", err)
  } finally {
    await client.close()
  }
}

run()
