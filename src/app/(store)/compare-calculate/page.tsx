import type { Metadata } from "next"
import CompareCalculatePage from "@/components/compare/CompareCalculatePage"

export const metadata: Metadata = {
  title: "Compare & Calculate | NUTRA TEIN",
  description:
    "Compare NUTRA TEIN Whey against generic budget proteins side-by-side, and calculate your exact daily protein intake based on your goals.",
}

export default function ComparePage() {
  return <CompareCalculatePage />
}
