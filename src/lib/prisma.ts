import { PrismaClient } from "@prisma/client"

// Fallback connection string for production/Vercel serverless environments
const fallbackDbUrl = process.env.DATABASE_URL || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://adnankazi275_db_user:xPApn9ThZiQHtiSx@cluster0.ei0fs04.mongodb.net/nutratein-website?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: fallbackDbUrl,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
