import type { Metadata } from "next"
import LegalPageContent from "@/components/LegalPageContent"

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | NUTRA TEIN",
  description:
    "Express dispatch timelines, shipping partners, free delivery thresholds, and transit times across metro and non-metro Indian regions.",
}

export default function ShippingPolicyPage() {
  return <LegalPageContent slug="shipping-policy" />
}