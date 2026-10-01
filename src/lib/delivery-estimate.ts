/**
 * Pincode Zone-Based Delivery Estimation Engine
 * 
 * Determines delivery zones based on Indian postal pincodes (6 digits):
 * - Metro (2-3 business days): Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Pune
 * - Regional / State (3-5 business days): Rest of major states and Tier-2 cities
 * - Remote / Special (6-8 business days): J&K, North-East, Andaman & Nicobar, Lakshadweep, Remote rural
 */

export interface DeliveryEstimateResult {
  estimatedDeliveryDate: Date
  zone: "METRO" | "REGIONAL" | "REMOTE"
  zoneName: string
  days: number
  formattedDate: string
}

export function calculateDeliveryEstimate(
  pincode?: string | null,
  orderDateInput?: Date | string
): DeliveryEstimateResult {
  const baseDate = orderDateInput ? new Date(orderDateInput) : new Date()
  const cleanPin = String(pincode || "").replace(/\D/g, "").slice(0, 6)

  let zone: "METRO" | "REGIONAL" | "REMOTE" = "REGIONAL"
  let zoneName = "Regional / State Delivery"
  let transitDays = 4

  if (cleanPin.length >= 2) {
    const prefix2 = cleanPin.slice(0, 2)
    const prefix3 = cleanPin.slice(0, 3)

    // 1. Remote / Special areas (6-8 days)
    if (
      ["18", "19"].includes(prefix2) || // J&K
      ["78", "79"].includes(prefix2) || // Assam & North East (Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Tripura)
      prefix3 === "744" || // Andaman & Nicobar
      prefix3 === "682" || // Lakshadweep
      ["84", "85"].includes(prefix2)    // Remote East Bihar / Border belts
    ) {
      zone = "REMOTE"
      zoneName = "Remote / Special Logistics Zone"
      transitDays = 7
    }
    // 2. Metro hubs (2-3 days)
    else if (
      ["11", "40", "56", "60", "70", "50", "38", "41"].includes(prefix2) || // Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Ahmedabad, Pune
      ["120", "121", "122", "201"].includes(prefix3) // Gurgaon, Faridabad, Noida, Ghaziabad (NCR)
    ) {
      zone = "METRO"
      zoneName = "Metro Express Zone"
      transitDays = 2
    }
    // 3. Regional / State Tier-1/2 (3-5 days)
    else {
      zone = "REGIONAL"
      zoneName = "Standard State & Regional Zone"
      transitDays = 4
    }
  }

  // Calculate arrival date by adding transit days, skipping Sundays
  const targetDate = new Date(baseDate)
  let daysAdded = 0
  while (daysAdded < transitDays) {
    targetDate.setDate(targetDate.getDate() + 1)
    // 0 is Sunday
    if (targetDate.getDay() !== 0) {
      daysAdded++
    }
  }

  const formattedDate = targetDate.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return {
    estimatedDeliveryDate: targetDate,
    zone,
    zoneName,
    days: transitDays,
    formattedDate,
  }
}

/**
 * Resolves the display delivery date & time:
 * Returns manual override if present, else auto-estimate.
 */
export function getEffectiveDeliveryDisplay(order: {
  manualDeliveryDate?: Date | string | null
  manualDeliveryTime?: string | null
  estimatedDeliveryDate?: Date | string | null
  estimatedDelivery?: Date | string | null
  address?: { pincode?: string | null } | string | any
  pincode?: string | null
  createdAt?: Date | string | null
}): {
  displayDate: string
  displayTime?: string | null
  isManualOverride: boolean
  zone?: string
} {
  if (order.manualDeliveryDate) {
    const d = new Date(order.manualDeliveryDate)
    const formatted = d.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return {
      displayDate: formatted,
      displayTime: order.manualDeliveryTime || null,
      isManualOverride: true,
    }
  }

  const rawEstimated = order.estimatedDeliveryDate || order.estimatedDelivery
  if (rawEstimated) {
    const d = new Date(rawEstimated)
    return {
      displayDate: d.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      displayTime: "By 8:00 PM",
      isManualOverride: false,
    }
  }

  // Fallback to on-the-fly pincode calculation
  const pin = order.pincode || (typeof order.address === "object" ? order.address?.pincode : null)
  const estimate = calculateDeliveryEstimate(pin, order.createdAt || new Date())
  return {
    displayDate: estimate.formattedDate,
    displayTime: "By 8:00 PM",
    isManualOverride: false,
    zone: estimate.zoneName,
  }
}
