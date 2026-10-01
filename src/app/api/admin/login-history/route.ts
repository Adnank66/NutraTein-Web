import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get last 100 user records with login info — admin only endpoint guarded by middleware
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
    return NextResponse.json({ users })
  } catch (e) {
    return NextResponse.json({ users: [] })
  }
}
