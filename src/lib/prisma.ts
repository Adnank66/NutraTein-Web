import { PrismaClient } from "@prisma/client"

// Fallback connection string for production/Vercel serverless environments
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb+srv://adnankazi275_db_user:adnan123@cluster0.on7y9sy.mongodb.net/Proteinweb?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true"
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
