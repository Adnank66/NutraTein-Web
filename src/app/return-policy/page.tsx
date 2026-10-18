import type { Metadata } from "next"
import LegalPageContent from "@/components/LegalPageContent"

export const metadata: Metadata = {
  title: "Returns & Refunds Policy | NUTRA TEIN",
  description:
    "Details on our 7-day hassle-free replacement guarantee for damaged or defective supplement shipments.",
}

export default function ReturnPolicyPage() {
  return <LegalPageContent slug="refund-policy" />
}