require("dotenv").config()
const { PrismaClient } = require("@prisma/client")

async function createFakeOrder() {
  let rawUrl = (process.env.MONGODB_URI || process.env.DATABASE_URL).trim().replace(/^["']|["']$/g, "")
  if (!rawUrl.includes("tlsAllowInvalidCertificates")) {
    const separator = rawUrl.includes("?") ? "&" : "?"
    rawUrl = `${rawUrl}${separator}tlsAllowInvalidCertificates=true`
  }
  const prisma = new PrismaClient({ datasourceUrl: rawUrl })
  try {
    console.log("Connecting to MongoDB Atlas...")

    // 1. Find user or admin
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "nutratein@gmail.com" },
          { email: "testcustomer@nutratein.in" },
          { email: "adnankazi275@gmail.com" },
        ],
      },
    })

    if (!user) {
      console.log("Creating user for order...")
      user = await prisma.user.create({
        data: {
          email: "nutratein@gmail.com",
          name: "Nutratein Store Admin",
          role: "ADMIN",
        },
      })
    }
    console.log(`Using User: ${user.name} (${user.email}) [ID: ${user.id}]`)

    // 2. Find product
    let product = await prisma.product.findFirst({
      include: { variants: true },
    })

    if (!product) {
      console.log("No product found in DB, creating product...")
      let category = await prisma.category.findFirst()
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: "Pre-Workout",
            slug: "pre-workout",
            type: "PRODUCT",
          },
        })
      }

      product = await prisma.product.create({
        data: {
          name: "Titan Loaded Pre-Workout (Pump & Focus)",
          slug: "ignition-pre-workout",
          brand: "NUTRATEIN",
          description: "Clinical dose engineered for intense vascular pumps and laser focus.",
          categoryId: category.id,
          basePrice: 2999,
          mrp: 3699,
          stockQuantity: 50,
          isActive: true,
        },
        include: { variants: true },
      })
    }
    console.log(`Using Product: ${product.name} [ID: ${product.id}]`)

    // 3. Create or find address
    let address = await prisma.address.findFirst({
      where: { userId: user.id },
    })

    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: user.id,
          name: "Nutratein Store Quality Check",
          phone: "8779060033",
          houseFlat: "Office 101, Nutratein HQ",
          street: "FC Road, Deccan",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411004",
          country: "India",
          isDefault: true,
        },
      })
    }

    // 4. Create Fake Order in MongoDB
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `PX-MOCK-${randomSuffix}`

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: address.id,
        status: "CONFIRMED",
        paymentMethod: "COD",
        paymentStatus: "PAID",
        subtotal: 2999,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: 2999,
        customerEmail: user.email,
        customerPhone: "8779060033",
        notes: "Live MongoDB Atlas Storage Verification Order",
        deliveryStatus: "ORDER_PLACED",
        items: {
          create: [
            {
              productId: product.id,
              variantId: product.variants?.[0]?.id || null,
              productName: product.name,
              price: 2999,
              quantity: 1,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    })

    console.log("==================================================")
    console.log("SUCCESSFULLY STORED FAKE ORDER IN MONGODB ATLAS!")
    console.log(`Order ID:      ${newOrder.id}`)
    console.log(`Order Number:  #${newOrder.orderNumber}`)
    console.log(`Customer:      ${newOrder.customerEmail} (${newOrder.customerPhone})`)
    console.log(`Status:        ${newOrder.status}`)
    console.log(`Total Amount:  ₹${newOrder.totalAmount}`)
    console.log(`Items count:   ${newOrder.items.length}`)
    console.log(`Created At:    ${newOrder.createdAt.toISOString()}`)
    console.log("==================================================")
  } catch (error) {
    console.error("FAILED TO CREATE ORDER IN MONGODB:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createFakeOrder()
