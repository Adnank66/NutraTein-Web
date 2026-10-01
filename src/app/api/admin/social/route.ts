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
    const links = await prisma.socialLink.findMany()
    return NextResponse.json({ links })
  } catch (err: any) {
    return NextResponse.json({ links: [], error: err.message })
  }
}

export async function POST(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const body = await req.json()
    const { platform, url, isActive } = body
    if (!platform?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Platform and URL are required" }, { status: 400 })
    }
    const link = await prisma.socialLink.create({
      data: {
        platform: platform.trim(),
        url: url.trim(),
        isActive: isActive ?? true,
      },
    })
    return NextResponse.json({ link })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const { id, platform, url, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    const link = await prisma.socialLink.update({
      where: { id },
      data: {
        ...(platform !== undefined && { platform }),
        ...(url !== undefined && { url }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ link })
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
    await prisma.socialLink.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
