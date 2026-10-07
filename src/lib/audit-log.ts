import { prisma } from "@/lib/prisma"

export interface AuditLogParams {
  adminId?: string
  adminEmail?: string
  adminName?: string
  action: string // PRODUCT_CREATED | PRODUCT_UPDATED | ORDER_STATUS_CHANGED | etc.
  resource: string // Product | Order | Coupon | Banner | FAQ | Customer | Settings | LoyaltyPoints
  resourceId?: string
  oldValue?: any
  newValue?: any
  reason?: string
  ipAddress?: string
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await (prisma as any).auditLog.create({
      data: {
        adminId: params.adminId || null,
        adminEmail: params.adminEmail || null,
        adminName: params.adminName || null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId || null,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        reason: params.reason || null,
        ipAddress: params.ipAddress || null,
      },
    })
  } catch (err) {
    // Never let audit log failures break main operations
    console.error("Audit log error:", err)
  }
}
