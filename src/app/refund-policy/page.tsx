import type { Metadata } from "next"
import LegalPageContent from "@/components/LegalPageContent"

export const metadata: Metadata = {
  title: "Refund & Return Policy | NUTRA TEIN",
  description:
    "Details on our 7-day hassle-free replacement and refund policy for supplement shipments.",
}

export default function RefundPolicyPage() {
  return <LegalPageContent slug="refund-policy" />
}
