import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/security"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.email) return guard.errorResponse!

    const user = await prisma.user.findUnique({
      where: { email: guard.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }],
    })

    return NextResponse.json({ success: true, addresses })
  } catch (error: any) {
    console.error("[user-addresses] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.email) return guard.errorResponse!

    const user = await prisma.user.findUnique({
      where: { email: guard.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const {
      name,
      phone,
      houseFlat,
      street,
      area = "",
      city,
      state,
      pincode,
      country = "India",
      isDefault = false,
    } = body

    if (!name?.trim() || !phone?.trim() || !houseFlat?.trim() || !street?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { error: "Please fill in all required address fields." },
        { status: 400 }
      )
    }

    // Check existing addresses count
    const existingCount = await prisma.address.count({
      where: { userId: user.id },
    })

    // If this is the user's first address, make it default automatically
    const shouldBeDefault = Boolean(isDefault || existingCount === 0)

    if (shouldBeDefault && existingCount > 0) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      })
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        name: name.trim(),
        phone: phone.trim().replace(/\D/g, "").slice(0, 15),
        houseFlat: houseFlat.trim(),
        street: street.trim(),
        area: area ? area.trim() : null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim().replace(/\D/g, "").slice(0, 10),
        country: country.trim() || "India",
        isDefault: shouldBeDefault,
      },
    })

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 })
  } catch (error: any) {
    console.error("[user-addresses] POST error:", error)
    return NextResponse.json({ error: error.message || "Failed to save address" }, { status: 500 })
  }
}
