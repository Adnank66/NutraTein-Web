import { PrismaClient } from "@prisma/client"

// WINDOWS TLS FIX (local development only)
// MongoDB Atlas uses Let's Encrypt certificates. On Windows environments, Node.js may lack
// specific intermediate CAs. This is scoped strictly to local development.
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI

if (!rawDbUrl) {
  throw new Error(
    "Missing MongoDB database connection string. Ensure DATABASE_URL or MONGODB_URI is configured in your environment."
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasourceUrl: rawDbUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
