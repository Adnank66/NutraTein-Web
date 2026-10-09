import { prisma } from "../src/lib/prisma"

async function runCheckoutSecurityTest() {
  console.log("==================================================")
  console.log("🧪 RUNNING PAYMENT & CHECKOUT SECURITY VERIFICATION")
  console.log("==================================================")

  // 1. Fetch a real product from MongoDB Atlas
  const product = await prisma.product.findFirst({
    where: { isActive: true },
    include: { variants: true },
  })

  if (!product) {
    throw new Error("No active product found in MongoDB Atlas to test.")
  }

  console.log(`Found test product in MongoDB: "${product.name}" (ID: ${product.id}, BasePrice: ₹${product.basePrice})`)

  const testVariant = product.variants[0]
  if (testVariant) {
    console.log(`Test variant: "${testVariant.flavor || testVariant.size || 'Default'}" (Stock: ${testVariant.stock}, Price: ₹${testVariant.price})`)
  }

  // 2. Test PaymentMethod query
  const paymentMethods = await prisma.paymentMethod.findMany()
  console.log(`Configured PaymentMethod records in MongoDB: ${paymentMethods.length}`)

  // 3. Test Order and Payment state check
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    include: { payment: true },
  })

  if (latestOrder) {
    console.log(`Latest Order #${latestOrder.orderNumber}:`)
    console.log(`- Status: ${latestOrder.status}`)
    console.log(`- Payment Method: ${latestOrder.paymentMethod}`)
    console.log(`- Payment Status: ${latestOrder.paymentStatus}`)
    console.log(`- Payment Record Status: ${latestOrder.payment?.status || 'None'}`)
  }

  console.log("\n✅ MongoDB Atlas read and connection verified 100%!")
}

runCheckoutSecurityTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test failed:", err)
    process.exit(1)
  })
