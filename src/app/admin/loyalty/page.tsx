import { redirect } from "next/navigation"

export default function LegacyLoyaltyPage() {
  redirect("/admin/subscriptions-loyalty?tab=loyalty")
}
