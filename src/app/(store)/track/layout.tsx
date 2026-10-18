import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Enter your order ID or phone number to check real-time courier dispatch status, live tracking, and delivery timelines across India.",
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
