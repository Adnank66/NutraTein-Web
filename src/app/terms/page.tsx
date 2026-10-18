import type { Metadata } from "next"
import LegalPageContent from "@/components/LegalPageContent"

export const metadata: Metadata = {
  title: "Terms & Conditions | NUTRA TEIN",
  description:
    "Review our official terms of service, acceptable product usage policies, and ordering guidelines for the NUTRA TEIN online store.",
}

export default function TermsPage() {
  return <LegalPageContent slug="terms" />
}