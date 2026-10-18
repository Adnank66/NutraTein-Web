require("dotenv").config()
const { PrismaClient } = require("@prisma/client")

async function seedAuditLog() {
  let rawUrl = (process.env.MONGODB_URI || process.env.DATABASE_URL).trim().replace(/^["']|["']$/g, "")
  if (!rawUrl.includes("tlsAllowInvalidCertificates")) {
    const separator = rawUrl.includes("?") ? "&" : "?"
    rawUrl = `${rawUrl}${separator}tlsAllowInvalidCertificates=true`
  }
  const prisma = new PrismaClient({ datasourceUrl: rawUrl })

  try {
    const count = await prisma.auditLog.count()
    if (count === 0) {
      console.log("Seeding initial audit log records...")
      await prisma.auditLog.createMany({
        data: [
          {
            adminEmail: "nutratein@gmail.com",
            adminName: "Nutratein Super Admin",
            action: "SECURITY_INITIALIZED",
            resource: "System",
            resourceId: "SYS-INIT",
            reason: "Initial system security audit and governance check",
            newValue: JSON.stringify({ status: "ACTIVE", domain: "nutratein.in", tls: "VERIFIED" }),
            ipAddress: "127.0.0.1",
            userAgent: "Nutratein Security Kernel",
          },
          {
            adminEmail: "adnankazi275@gmail.com",
            adminName: "Adnan Kazi",
            action: "ADMIN_LOGIN",
            resource: "Authentication",
            resourceId: "AUTH-001",
            reason: "Admin dashboard authenticated session",
            newValue: JSON.stringify({ role: "SUPER_ADMIN", sessionStrategy: "JWT" }),
            ipAddress: "127.0.0.1",
            userAgent: "Mozilla/5.0 Admin Console",
          },
        ],
      })
      console.log("✅ Initial audit logs seeded successfully!")
    } else {
      console.log(`AuditLog collection already contains ${count} records.`)
    }
  } catch (err) {
    console.error("Error seeding audit log:", err)
  } finally {
    await prisma.$disconnect()
  }
}

seedAuditLog()
