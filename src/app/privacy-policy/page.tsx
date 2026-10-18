import type { Metadata } from "next"
import LegalPageContent from "@/components/LegalPageContent"

export const metadata: Metadata = {
  title: "Privacy Policy | NUTRA TEIN",
  description:
    "Understand how NUTRA TEIN (created by Adnan Kazi) collects, protects, and handles your personal data.",
}

export default function PrivacyPolicyPage() {
  return <LegalPageContent slug="privacy" />
}