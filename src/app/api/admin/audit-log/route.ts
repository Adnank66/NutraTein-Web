import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const action = searchParams.get("action")
  const resource = searchParams.get("resource")
  const adminEmail = searchParams.get("adminEmail")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: any = {}
  if (action) where.action = { contains: action, mode: "insensitive" }
  if (resource) where.resource = resource
  if (adminEmail) where.adminEmail = adminEmail
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
    // If model doesn't exist yet
    return NextResponse.json({ success: true, logs: [], total: 0, page: 1, pages: 0, note: err.message })
  }
}
