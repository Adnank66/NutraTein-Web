import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const notifications = await prisma.siteNotification.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    return NextResponse.json({ notifications: [] })
  }
}
