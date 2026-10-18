import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security"

const DEFAULT_SOCIAL_LINKS = [
  { platform: "YouTube", url: "https://www.youtube.com/@nutratein", isActive: true },
  { platform: "Facebook", url: "https://www.facebook.com/nutratein", isActive: true },
  { platform: "Videos", url: "https://www.youtube.com/@nutratein/videos", isActive: true },
  { platform: "Instagram", url: "https://www.instagram.com/nutratein?stkn=MXd0ODBqMWs0ZmRvMA==", isActive: true },
]

export async function GET() {
  try {
    let links = await prisma.socialLink.findMany({
      orderBy: { platform: "asc" },
    })
    if (links.length === 0) {
      // Auto-populate default active brand channels into database
      await prisma.socialLink.createMany({
        data: DEFAULT_SOCIAL_LINKS,
      })
      links = await prisma.socialLink.findMany({
        orderBy: { platform: "asc" },
      })
    }
    return NextResponse.json({ links })
  } catch (err: any) {
    return NextResponse.json({ links: DEFAULT_SOCIAL_LINKS, error: err.message })
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!
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
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!
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
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await prisma.socialLink.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
