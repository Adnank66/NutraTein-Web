import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/security"

export const dynamic = "force-dynamic"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.email) return guard.errorResponse!

    const user = await prisma.user.findUnique({
      where: { email: guard.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const body = await req.json()
    const {
      name,
      phone,
      houseFlat,
      street,
      area,
      city,
      state,
      pincode,
      country = "India",
      isDefault,
    } = body

    if (!name?.trim() || !phone?.trim() || !houseFlat?.trim() || !street?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { error: "Please fill in all required address fields." },
        { status: 400 }
      )
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone.trim().replace(/\D/g, "").slice(0, 15),
        houseFlat: houseFlat.trim(),
        street: street.trim(),
        area: area ? area.trim() : null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim().replace(/\D/g, "").slice(0, 10),
        country: country.trim() || "India",
        ...(typeof isDefault === "boolean" ? { isDefault } : {}),
      },
    })

    return NextResponse.json({ success: true, address: updated })
  } catch (error: any) {
    console.error("[user-addresses-id] PUT error:", error)
    return NextResponse.json({ error: error.message || "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.email) return guard.errorResponse!

    const user = await prisma.user.findUnique({
      where: { email: guard.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    await prisma.address.delete({
      where: { id },
    })

    // If deleted address was default, promote another address to default if one exists
    if (existing.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { id: "desc" },
      })
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        })
      }
    }

    return NextResponse.json({ success: true, message: "Address deleted successfully" })
  } catch (error: any) {
    console.error("[user-addresses-id] DELETE error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete address" }, { status: 500 })
  }
}
