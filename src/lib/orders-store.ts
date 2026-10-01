import fs from "fs"
import path from "path"

const BACKUP_FILE = path.join(process.cwd(), "src/data/orders-backup.json")

export function getBackupOrders(): any[] {
  try {
    if (!fs.existsSync(BACKUP_FILE)) return []
    const content = fs.readFileSync(BACKUP_FILE, "utf8")
    return JSON.parse(content) || []
  } catch (err) {
    console.error("Error reading backup orders:", err)
    return []
  }
}

export function saveBackupOrder(order: any) {
  try {
    const list = getBackupOrders()
    list.unshift(order)
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(list, null, 2), "utf8")
    console.log(`💾 Order ${order.orderNumber} saved to backup storage (orders-backup.json)`)
  } catch (err) {
    console.error("Error saving backup order:", err)
  }
}

export function updateBackupOrderStatus(
  idOrNumber: string,
  status?: string,
  paymentStatus?: string,
  extraFields?: {
    trackingNumber?: string | null
    courierPartner?: string | null
    deliveryStatus?: string | null
    manualDeliveryDate?: Date | string | null
    manualDeliveryTime?: string | null
  }
) {
  try {
    const list = getBackupOrders()
    let found = false
    const updated = list.map((order) => {
      if (order.id === idOrNumber || order.orderNumber === idOrNumber) {
        found = true
        return {
          ...order,
          ...(status ? { status } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
          ...(extraFields?.trackingNumber !== undefined ? { trackingNumber: extraFields.trackingNumber } : {}),
          ...(extraFields?.courierPartner !== undefined ? { courierPartner: extraFields.courierPartner } : {}),
          ...(extraFields?.deliveryStatus !== undefined ? { deliveryStatus: extraFields.deliveryStatus } : {}),
          ...(extraFields?.manualDeliveryDate !== undefined ? { manualDeliveryDate: extraFields.manualDeliveryDate } : {}),
          ...(extraFields?.manualDeliveryTime !== undefined ? { manualDeliveryTime: extraFields.manualDeliveryTime } : {}),
          updatedAt: new Date().toISOString(),
        }
      }
      return order
    })
    if (found) {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(updated, null, 2), "utf8")
      console.log(`💾 Order ${idOrNumber} updated in backup storage`)
    }
  } catch (err) {
    console.error("Error updating backup order:", err)
  }
}

export function clearBackupOrders() {
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify([], null, 2), "utf8")
    console.log("💾 Backup orders storage cleared")
  } catch (err) {
    console.error("Error clearing backup orders:", err)
  }
}
