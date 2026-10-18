import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const action = searchParams.get("action")
  const resource = searchParams.get("resource")
  const adminEmail = searchParams.get("adminEmail")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: any = {}
  if (action) where.action = { contains: action }
  if (resource) where.resource = { contains: resource }
  if (adminEmail) where.adminEmail = { contains: adminEmail }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }

  try {
    const [logs, total] = await Promise.all([
      (prisma as any).auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).auditLog.count({ where }),
    ])

    return NextResponse.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) })
  } catch (err: any) {
    return NextResponse.json({ success: true, logs: [], total: 0, page: 1, pages: 0, note: err.message })
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    const body = await req.json()
    const log = await (prisma as any).auditLog.create({
      data: {
        adminId: guard.user?.id || "admin",
        adminEmail: guard.user?.email || "nutratein@gmail.com",
        adminName: guard.user?.name || "Admin",
        action: body.action || "SYSTEM_AUDIT",
        resource: body.resource || "System",
        resourceId: body.resourceId || null,
        oldValue: body.oldValue ? String(body.oldValue) : null,
        newValue: body.newValue ? String(body.newValue) : null,
        reason: body.reason || "Manual audit event verification",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "Browser",
      },
    })
    return NextResponse.json({ success: true, log })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE() {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    await (prisma as any).auditLog.deleteMany({})
    return NextResponse.json({ success: true, message: "Audit logs cleared successfully" })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
