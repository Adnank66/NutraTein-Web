"use client"

import { useEffect } from "react"

export default function SyncCustomerOrderCookie({
  email,
  orderNumber,
}: {
  email?: string | null
  orderNumber: string
}) {
  useEffect(() => {
    try {
      if (email && email.trim()) {
        const clean = email.trim().toLowerCase()
        document.cookie = `proteinx_user_email=${encodeURIComponent(clean)}; path=/; max-age=31536000; SameSite=Lax`
        try {
          localStorage.setItem("proteinx_saved_email", clean)
        } catch {}
      }

      if (orderNumber) {
        let existingRecent: string[] = []
        try {
          const match = document.cookie.match(/(?:^|; )proteinx_recent_orders=([^;]*)/)
          if (match) existingRecent = JSON.parse(decodeURIComponent(match[1]))
        } catch {}
        if (!existingRecent.includes(orderNumber)) {
          existingRecent.unshift(orderNumber)
          document.cookie = `proteinx_recent_orders=${encodeURIComponent(
            JSON.stringify(existingRecent.slice(0, 20))
          )}; path=/; max-age=31536000; SameSite=Lax`
        }
      }
    } catch {}
  }, [email, orderNumber])

  return null
}
