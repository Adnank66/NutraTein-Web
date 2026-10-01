import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

function toDate(val: any): Date {
  if (!val) return new Date()
  if (typeof val === "number") return new Date(val)
  return new Date(val)
}

function toBool(val: any): boolean {
  return Boolean(val)
}

async function migrate() {
  console.log("\n========================================================")
  console.log("🚀 PROTEINX: Migrating Data from SQLite to MongoDB Atlas")
  console.log("========================================================\n")

  const dumpPath = path.join(__dirname, "sqlite_dump.json")
  if (!fs.existsSync(dumpPath)) {
    console.error("❌ Dump file not found:", dumpPath)
    process.exit(1)
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"))

  console.log("1. Connecting to MongoDB Atlas...")
  await prisma.$connect()
  console.log("✅ Connected successfully to MongoDB Atlas!\n")

  console.log("2. Cleaning target MongoDB database collections...")
  await prisma.payment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.address.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.user.deleteMany()
  console.log("✅ Cleaned existing collections.\n")

  const idMap: Record<string, string> = {}

  // 1. USERS
  console.log(`3. Migrating Users (${dump.User.length} records)...`)
  for (const u of dump.User) {
    const created = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified ? toDate(u.emailVerified) : null,
        image: u.image,
        password: u.password,
        phone: u.phone,
        role: u.role || "USER",
        createdAt: toDate(u.createdAt),
        updatedAt: toDate(u.updatedAt),
      },
    })
    idMap[u.id] = created.id
  }
  console.log(`✅ Migrated ${dump.User.length} Users.`)

  // 2. CATEGORIES
  console.log(`4. Migrating Categories (${dump.Category.length} records)...`)
  for (const c of dump.Category) {
    const created = await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        icon: c.icon,
        sortOrder: c.sortOrder || 0,
        createdAt: toDate(c.createdAt),
      },
    })
    idMap[c.id] = created.id
  }
  console.log(`✅ Migrated ${dump.Category.length} Categories.`)

  // 3. PRODUCTS
  console.log(`5. Migrating Products (${dump.Product.length} records)...`)
  for (const p of dump.Product) {
    const newCatId = idMap[p.categoryId]
    if (!newCatId) {
      console.warn(`Warning: Category ${p.categoryId} not found for product ${p.name}`)
      continue
    }
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description,
        shortDesc: p.shortDesc,
        categoryId: newCatId,
        basePrice: Number(p.basePrice),
        mrp: Number(p.mrp),
        discountPercent: Number(p.discountPercent) || 0,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviewCount) || 0,
        isFeatured: toBool(p.isFeatured),
        isBestSeller: toBool(p.isBestSeller),
        isNew: toBool(p.isNew),
        isActive: toBool(p.isActive),
        howToUse: p.howToUse,
        ingredients: p.ingredients,
        benefits: p.benefits,
        nutritionInfo: p.nutritionInfo,
        tags: p.tags,
        createdAt: toDate(p.createdAt),
        updatedAt: toDate(p.updatedAt),
      },
    })
    idMap[p.id] = created.id
  }
  console.log(`✅ Migrated ${dump.Product.length} Products.`)

  // 4. PRODUCT IMAGES
  console.log(`6. Migrating Product Images (${dump.ProductImage.length} records)...`)
  for (const img of dump.ProductImage) {
    const newProdId = idMap[img.productId]
    if (!newProdId) continue
    await prisma.productImage.create({
      data: {
        productId: newProdId,
        url: img.url,
        alt: img.alt,
        isPrimary: toBool(img.isPrimary),
        sortOrder: Number(img.sortOrder) || 0,
      },
    })
  }
  console.log(`✅ Migrated ${dump.ProductImage.length} Product Images.`)

  // 5. PRODUCT VARIANTS
  console.log(`7. Migrating Product Variants (${dump.ProductVariant.length} records)...`)
  for (const v of dump.ProductVariant) {
    const newProdId = idMap[v.productId]
    if (!newProdId) continue
    const created = await prisma.productVariant.create({
      data: {
        productId: newProdId,
        flavor: v.flavor,
        size: v.size,
        sku: v.sku,
        price: Number(v.price),
        stock: Number(v.stock) || 0,
        isActive: toBool(v.isActive),
      },
    })
    idMap[v.id] = created.id
  }
  console.log(`✅ Migrated ${dump.ProductVariant.length} Product Variants.`)

  // 6. ADDRESSES
  console.log(`8. Migrating Addresses (${dump.Address.length} records)...`)
  for (const a of dump.Address) {
    const newUserId = idMap[a.userId]
    if (!newUserId) continue
    const created = await prisma.address.create({
      data: {
        userId: newUserId,
        name: a.name,
        phone: a.phone,
        houseFlat: a.houseFlat,
        street: a.street,
        area: a.area,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        country: a.country || "India",
        isDefault: toBool(a.isDefault),
      },
    })
    idMap[a.id] = created.id
  }
  console.log(`✅ Migrated ${dump.Address.length} Addresses.`)

  // 7. ORDERS
  console.log(`9. Migrating Orders (${dump.Order.length} records)...`)
  for (const o of dump.Order) {
    const newUserId = idMap[o.userId]
    if (!newUserId) continue
    const newAddrId = o.addressId ? idMap[o.addressId] : null
    const created = await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        userId: newUserId,
        addressId: newAddrId,
        status: o.status || "PLACED",
        paymentMethod: o.paymentMethod || "COD",
        paymentStatus: o.paymentStatus || "PENDING",
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount) || 0,
        shippingAmount: Number(o.shippingAmount) || 0,
        taxAmount: Number(o.taxAmount) || 0,
        totalAmount: Number(o.totalAmount),
        couponCode: o.couponCode,
        notes: o.notes,
        estimatedDelivery: o.estimatedDelivery ? toDate(o.estimatedDelivery) : null,
        createdAt: toDate(o.createdAt),
        updatedAt: toDate(o.updatedAt),
      },
    })
    idMap[o.id] = created.id
  }
  console.log(`✅ Migrated ${dump.Order.length} Orders.`)

  // 8. ORDER ITEMS
  console.log(`10. Migrating Order Items (${dump.OrderItem.length} records)...`)
  for (const oi of dump.OrderItem) {
    const newOrderId = idMap[oi.orderId]
    const newProdId = idMap[oi.productId]
    if (!newOrderId || !newProdId) continue
    const newVarId = oi.variantId ? idMap[oi.variantId] : null
    await prisma.orderItem.create({
      data: {
        orderId: newOrderId,
        productId: newProdId,
        variantId: newVarId,
        quantity: Number(oi.quantity),
        price: Number(oi.price),
        productName: oi.productName,
        flavor: oi.flavor,
        size: oi.size,
      },
    })
  }
  console.log(`✅ Migrated ${dump.OrderItem.length} Order Items.`)

  // 9. REVIEWS
  console.log(`11. Migrating Reviews (${dump.Review.length} records)...`)
  for (const r of dump.Review) {
    const newProdId = idMap[r.productId]
    const newUserId = idMap[r.userId]
    if (!newProdId || !newUserId) continue
    await prisma.review.create({
      data: {
        productId: newProdId,
        userId: newUserId,
        rating: Number(r.rating),
        title: r.title,
        body: r.body,
        isVerified: toBool(r.isVerified),
        createdAt: toDate(r.createdAt),
      },
    })
  }
  console.log(`✅ Migrated ${dump.Review.length} Reviews.`)

  // 10. COUPONS
  console.log(`12. Migrating Coupons (${dump.Coupon.length} records)...`)
  for (const c of dump.Coupon) {
    await prisma.coupon.create({
      data: {
        code: c.code,
        description: c.description,
        discountType: c.discountType || "PERCENT",
        discountValue: Number(c.discountValue),
        minOrderValue: Number(c.minOrderValue) || 0,
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
        usageLimit: c.usageLimit ? Number(c.usageLimit) : null,
        usedCount: Number(c.usedCount) || 0,
        isActive: toBool(c.isActive),
        expiresAt: c.expiresAt ? toDate(c.expiresAt) : null,
        createdAt: toDate(c.createdAt),
      },
    })
  }
  console.log(`✅ Migrated ${dump.Coupon.length} Coupons.`)

  // 11. PAYMENTS
  console.log(`13. Migrating Payments (${dump.Payment.length} records)...`)
  for (const p of dump.Payment) {
    const newOrderId = idMap[p.orderId]
    if (!newOrderId) continue
    await prisma.payment.create({
      data: {
        orderId: newOrderId,
        amount: Number(p.amount),
        currency: p.currency || "INR",
        status: p.status || "PENDING",
        method: p.method,
        transactionId: p.transactionId,
        gatewayResponse: p.gatewayResponse,
        createdAt: toDate(p.createdAt),
      },
    })
  }
  console.log(`✅ Migrated ${dump.Payment.length} Payments.`)

  // VERIFICATION
  console.log("\n========================================================")
  console.log("📊 MIGRATION VERIFICATION AUDIT")
  console.log("========================================================")

  const [uCount, cCount, pCount, piCount, pvCount, aCount, oCount, oiCount, rCount, cpCount, payCount] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.productVariant.count(),
    prisma.address.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.review.count(),
    prisma.coupon.count(),
    prisma.payment.count(),
  ])

  console.log(`Users           : ${uCount} / ${dump.User.length}`)
  console.log(`Categories      : ${cCount} / ${dump.Category.length}`)
  console.log(`Products        : ${pCount} / ${dump.Product.length}`)
  console.log(`ProductImages   : ${piCount} / ${dump.ProductImage.length}`)
  console.log(`ProductVariants : ${pvCount} / ${dump.ProductVariant.length}`)
  console.log(`Addresses       : ${aCount} / ${dump.Address.length}`)
  console.log(`Orders          : ${oCount} / ${dump.Order.length}`)
  console.log(`OrderItems      : ${oiCount} / ${dump.OrderItem.length}`)
  console.log(`Reviews         : ${rCount} / ${dump.Review.length}`)
  console.log(`Coupons         : ${cpCount} / ${dump.Coupon.length}`)
  console.log(`Payments        : ${payCount} / ${dump.Payment.length}`)

  const totalMigrated = uCount + cCount + pCount + piCount + pvCount + aCount + oCount + oiCount + rCount + cpCount + payCount
  console.log(`\n🎉 TOTAL RECORDS IN MONGODB ATLAS: ${totalMigrated}`)
  console.log("========================================================\n")
}

migrate()
  .catch((e) => {
    console.error("❌ Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
