import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | string | null | undefined): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0
  if (isNaN(num)) return "₹0"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num)
}

export function calculateDiscount(mrp: number, price: number): number {
  return Math.round(((mrp - price) / mrp) * 100)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PX-${timestamp}-${random}`
}

export function getStockStatus(stock: number): {
  label: string
  color: string
  available: boolean
} {
  if (stock === 0) {
    return { label: "Out of Stock", color: "text-red-500", available: false }
  }
  if (stock <= 10) {
    return { label: `Only ${stock} left!`, color: "text-orange-500", available: true }
  }
  return { label: "In Stock", color: "text-green-500", available: true }
}

export function getDeliveryDate(days: number = 5): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
