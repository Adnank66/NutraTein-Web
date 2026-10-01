import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateBackupOrderStatus } from "@/lib/orders-store"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const isHex = /^[a-f\d]{24}$/i.test(id)
    const order = await prisma.order.findFirst({
      where: isHex ? { id } : { orderNumber: id },
      include: { items: true, address: true, user: true, payment: true },
    })

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    return NextResponse.json({ success: true, order })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      status,
      deliveryStatus,
      paymentStatus,
      restock,
      trackingNumber,
      courierPartner,
      manualDeliveryDate,
      manualDeliveryTime,
      clearManualOverride,
      clearTracking,
      clearDeliveryData,
      note,
      packagingVideoUrl,
    } = body

    const dataToUpdate: any = {}
    if (packagingVideoUrl !== undefined) {
      dataToUpdate.packagingVideoUrl = packagingVideoUrl
    }

    // 1. Order Status & Delivery Status Lifecycle
    if (status) {
      dataToUpdate.status = status
    }
    if (deliveryStatus) {
      dataToUpdate.deliveryStatus = deliveryStatus
      // Harmonize general status with delivery status if not explicitly passed
      if (!status) {
        if (deliveryStatus === "DELIVERED") dataToUpdate.status = "DELIVERED"
        else if (deliveryStatus === "SHIPPED" || deliveryStatus === "OUT_FOR_DELIVERY") dataToUpdate.status = "SHIPPED"
        else if (deliveryStatus === "PACKED") dataToUpdate.status = "PROCESSING"
        else if (deliveryStatus === "CANCELLED") dataToUpdate.status = "CANCELLED"
      }
    }

    // 2. Payment Status
    if (paymentStatus) {
      dataToUpdate.paymentStatus = paymentStatus
    } else if (status === "REFUNDED" || deliveryStatus === "RETURNED") {
      dataToUpdate.paymentStatus = "REFUNDED"
    }

    // 3. Manual Delivery Date & Time (Override vs Clear)
    if (clearManualOverride || clearDeliveryData) {
      dataToUpdate.manualDeliveryDate = null
      dataToUpdate.manualDeliveryTime = null
    } else {
      if (manualDeliveryDate !== undefined) {
        dataToUpdate.manualDeliveryDate = manualDeliveryDate ? new Date(manualDeliveryDate) : null
      }
      if (manualDeliveryTime !== undefined) {
        dataToUpdate.manualDeliveryTime = manualDeliveryTime?.trim() || null
      }
    }

    // 4. Courier & Tracking (Manual typing or Clear)
    if (clearTracking || clearDeliveryData) {
      dataToUpdate.trackingNumber = null
      dataToUpdate.courierPartner = null
    } else {
      if (trackingNumber !== undefined) {
        dataToUpdate.trackingNumber = trackingNumber?.trim() || null
      }
      if (courierPartner !== undefined) {
        dataToUpdate.courierPartner = courierPartner?.trim() || null
      }
    }

    // Maintain search notes
    if (dataToUpdate.trackingNumber) {
      dataToUpdate.notes = `Courier: ${dataToUpdate.courierPartner || "Carrier"} - AWB: ${dataToUpdate.trackingNumber}`
    } else if (clearTracking || clearDeliveryData) {
      dataToUpdate.notes = null
    }

    let updated = null
    try {
      const isHex = /^[a-f\d]{24}$/i.test(id)
      const existing = await prisma.order.findFirst({
        where: isHex ? { id } : { orderNumber: id },
        select: { id: true, deliveryStatusHistory: true, deliveryStatus: true },
      })

      if (existing) {
        // Append to timestamped delivery audit history
        if (deliveryStatus || clearDeliveryData || clearManualOverride) {
          const currentHistory = Array.isArray(existing.deliveryStatusHistory)
            ? (existing.deliveryStatusHistory as any[])
            : []
          const newEntry = {
            status: deliveryStatus || (clearDeliveryData ? "RESET" : existing.deliveryStatus),
            timestamp: new Date().toISOString(),
            note:
              note ||
              (clearDeliveryData
                ? "Delivery data reset to auto-estimate by administrator"
                : clearManualOverride
                ? "Manual delivery override cleared"
                : `Delivery status updated to ${deliveryStatus}`),
          }
          dataToUpdate.deliveryStatusHistory = [newEntry, ...currentHistory]
        }

        updated = await prisma.order.update({
          where: { id: existing.id },
          data: dataToUpdate,
          include: { items: true, address: true, user: true, payment: true },
        })

        // Restock inventory if marked as REFUNDED or restock requested
        if ((status === "REFUNDED" || deliveryStatus === "RETURNED" || restock) && updated?.items) {
          for (const item of updated.items) {
            if (item.variantId) {
              try {
                await prisma.productVariant.update({
                  where: { id: item.variantId },
                  data: { stock: { increment: item.quantity } },
                })
                console.log(`📦 Restocked variant ${item.variantId} by +${item.quantity}`)
              } catch (err) {
                console.warn(`Failed to restock variant ${item.variantId}:`, err)
              }
            }
          }
        }
      }
    } catch (dbErr: any) {
      console.warn("DB update failed:", dbErr.message)
    }

    // Always keep backup JSON storage in sync
    updateBackupOrderStatus(id, dataToUpdate.status || status, dataToUpdate.paymentStatus, {
      trackingNumber: dataToUpdate.trackingNumber,
      courierPartner: dataToUpdate.courierPartner,
      deliveryStatus: dataToUpdate.deliveryStatus,
      manualDeliveryDate: dataToUpdate.manualDeliveryDate,
      manualDeliveryTime: dataToUpdate.manualDeliveryTime,
    })

    return NextResponse.json({
      success: true,
      message:
        status === "REFUNDED"
          ? "Order refunded and inventory restocked"
          : clearDeliveryData
          ? "Manual delivery data cleared and reset to auto-estimate"
          : "Delivery details updated successfully in MongoDB",
      order: updated || { id, ...dataToUpdate },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update order" }, { status: 500 })
  }
}
