import { PrismaClient } from "@prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// WINDOWS TLS FIX (local dev only)
// MongoDB Atlas uses Let's Encrypt certs. Windows Node.js doesn't include
// Let's Encrypt root CAs. This tells Node.js to skip TLS verification ONLY
// in local development. On Vercel (Linux) this block never runs.
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

const DB_URL =
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://adnankazi275_db_user:xPApn9ThZiQHtiSx@cluster0.ei0fs04.mongodb.net/nutratein-website?retryWrites=true&w=majority&appName=Cluster0"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: DB_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
