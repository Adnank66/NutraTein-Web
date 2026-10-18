import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
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
    return NextResponse.json({ success: true, users })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch login history" }, { status: 500 })
  }
}
