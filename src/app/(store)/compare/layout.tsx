import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compare Supplements",
  description:
    "Compare nutritional values, protein content per scoop, servings, and price per gram across our sports supplement range.",
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
