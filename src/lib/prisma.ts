import { PrismaClient } from "@prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// NUTRA TEIN — Prisma MongoDB Connection
//
// Root cause of local "unable to verify first certificate":
//   Windows Node.js does NOT include Let's Encrypt root CAs by default.
//   MongoDB Atlas uses Let's Encrypt. So local dev needs tlsInsecure=true.
//   On Vercel (Linux), this is NOT needed — certs verify fine.
//
// We detect local vs production using NODE_ENV and apply the right URL.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.DATABASE_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://adnankazi275_db_user:xPApn9ThZiQHtiSx@cluster0.ei0fs04.mongodb.net/nutratein-website?retryWrites=true&w=majority&appName=Cluster0"

// In local Windows dev, add tlsInsecure to bypass Windows CA chain issues.
// In production (Vercel Linux) use the clean URL — no bypass needed.
const DB_URL =
  process.env.NODE_ENV !== "production" && !BASE_URL.includes("tlsInsecure")
    ? BASE_URL + "&tlsInsecure=true"
    : BASE_URL

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
