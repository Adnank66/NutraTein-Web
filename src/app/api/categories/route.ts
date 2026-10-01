import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ success: true, categories, data: categories })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch categories", categories: [], data: [] }, { status: 500 })
  }
}