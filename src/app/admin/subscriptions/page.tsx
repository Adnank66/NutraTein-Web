import { redirect } from "next/navigation"

export default function LegacySubscriptionsPage() {
  redirect("/admin/subscriptions-loyalty?tab=subscriptions")
}
