import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireUser()
  if (!guard.authorized || !guard.user?.email) return guard.errorResponse!

  const user = await prisma.user.findUnique({
    where: { email: guard.user.email },
    select: { id: true, name: true, phone: true, email: true, image: true, role: true }
  })
  return NextResponse.json({ success: true, user })
}

export async function PATCH(req: Request) {
  const guard = await requireUser()
  if (!guard.authorized || !guard.user?.email) return guard.errorResponse!

  try {
    const body = await req.json()
    const { name, phone, image } = body

    const updateData: any = {}
    if (typeof name === 'string') updateData.name = name.trim().slice(0, 100)
    if (typeof phone === 'string') updateData.phone = phone.trim().slice(0, 20)
    if (typeof image === 'string') updateData.image = image.trim().slice(0, 500)

    const user = await prisma.user.update({
      where: { email: guard.user.email },
      data: updateData,
      select: { id: true, name: true, phone: true, email: true, image: true, role: true }
    })
    return NextResponse.json({ success: true, user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 })
  }
}
