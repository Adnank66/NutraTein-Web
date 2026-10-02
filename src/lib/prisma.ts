import { PrismaClient } from "@prisma/client"

// Full production-ready connection string with directConnection disabled for Atlas SRV
// Hardcoded fallback ensures Vercel works even if DATABASE_URL env var is not set
const fallbackDbUrl =
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://adnankazi275_db_user:xPApn9ThZiQHtiSx@cluster0.ei0fs04.mongodb.net/nutratein-website?retryWrites=true&w=majority&appName=Cluster0"

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
