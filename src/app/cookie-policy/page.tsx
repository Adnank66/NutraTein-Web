import type { Metadata } from "next"
import LegalPageContent from "@/components/LegalPageContent"

export const metadata: Metadata = {
  title: "Cookie Policy | NUTRA TEIN",
  description:
    "Transparent breakdown of necessary session cookies and optional analytics cookies used to power your browsing experience.",
}

export default function CookiePolicyPage() {
  return <LegalPageContent slug="cookie-policy" />
}
