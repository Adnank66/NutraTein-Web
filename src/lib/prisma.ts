import { PrismaClient } from "@prisma/client"

const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI

if (!rawDbUrl) {
  throw new Error(
    "Missing MongoDB database connection string. Ensure DATABASE_URL or MONGODB_URI is configured in your environment."
  )
}

const dbUrl = rawDbUrl.trim().replace(/^["']|["']$/g, "")

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasourceUrl: dbUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
