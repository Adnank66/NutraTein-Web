import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Customer Support",
  description:
    "Reach our direct support desk for assistance with product queries, batch certifications, order tracking, and wholesale inquiries.",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
