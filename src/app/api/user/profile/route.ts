import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, phone, image } = await req.json()
  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { name, phone, image }
  })
  return NextResponse.json({ success: true, user })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { name: true, phone: true, email: true, image: true } })
  return NextResponse.json({ success: true, user })
}
