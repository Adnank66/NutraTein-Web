import { PrismaClient } from "@prisma/client"

const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/nutratein_build"

let dbUrl = rawDbUrl.trim().replace(/^["']|["']$/g, "")
if (!dbUrl.includes("tlsAllowInvalidCertificates")) {
  const separator = dbUrl.includes("?") ? "&" : "?"
  dbUrl = `${dbUrl}${separator}tlsAllowInvalidCertificates=true`
}

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
