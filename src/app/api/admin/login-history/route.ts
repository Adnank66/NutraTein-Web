import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const HISTORY_FILE = path.join(process.cwd(), "data", "login-history.json")

function getFileLogs() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"))
      if (Array.isArray(data)) return data
    }
  } catch {}
  return []
}

function saveFileLogs(logs: any[]) {
  try {
    const dir = path.dirname(HISTORY_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(logs, null, 2), "utf-8")
  } catch (e) {
    console.error("Failed to save login history file:", e)
  }
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    const fileLogs = getFileLogs()

    // Also fetch users for total counters
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      history: fileLogs,
      users,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch login history" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const logs = getFileLogs()
    const newEntry = {
      id: "log-" + Date.now(),
      email: body.email || "unknown",
      name: body.name || "User",
      role: body.role || "CUSTOMER",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Browser",
      status: body.status || "SUCCESS",
      timestamp: new Date().toISOString(),
    }
    logs.unshift(newEntry)
    saveFileLogs(logs.slice(0, 200))
    return NextResponse.json({ success: true, entry: newEntry })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE() {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    saveFileLogs([])

    try {
      await (prisma as any).auditLog.deleteMany({
        where: { action: "ADMIN_LOGIN" },
      })
    } catch {}

    return NextResponse.json({ success: true, message: "Login history cleared successfully" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to clear login history" }, { status: 500 })
  }
}
