import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}


export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
    })
    return NextResponse.json({ reviews })
  } catch (e) {
    return NextResponse.json({ reviews: [] })
  }
}

export async function PATCH(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const { id, status, title, body } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
      },
    })
    return NextResponse.json({ review })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await prisma.review.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
