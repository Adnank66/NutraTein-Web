"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Package, Search, Clock, CheckCircle2, Truck, MapPin,
  ArrowRight, AlertCircle, Phone, Sparkles
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation"
import PackagingVideoPlayer from "@/components/order/PackagingVideoPlayer"

const STEPS = [
  { key: "orderPlaced", labelEn: "Order Placed", labelTa: "ஆர்டர் செய்யப்பட்டது", step: 1 },
  { key: "processing", labelEn: "Verified & Packed", labelTa: "சரிபார்க்கப்பட்டு பேக் செய்யப்பட்டது", step: 2 },
  { key: "shipped", labelEn: "Shipped & In Transit", labelTa: "அனுப்பப்பட்டு பயணத்தில் உள்ளது", step: 3 },
  { key: "outForDelivery", labelEn: "Out for Delivery", labelTa: "டெலிவரிக்கு புறப்பட்டது", step: 4 },
  { key: "delivered", labelEn: "Delivered", labelTa: "டெலிவரி செய்யப்பட்டது", step: 5 },
]

function getStepIndex(status: string) {
  const s = (status || "").toUpperCase()
  if (s === "DELIVERED") return 5
  if (s === "OUT_FOR_DELIVERY") return 4
  if (s === "SHIPPED") return 3
  if (s === "PROCESSING" || s === "CONFIRMED") return 2
  return 1 // PENDING / PLACED
}

export default function OrderTrackingPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { language, t } = useTranslation()
  const isTa = language === "ta"

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (data.success && data.orders?.length > 0) {
        setOrders(data.orders)
      } else {
        setOrders([])
        setError(data.error || (isTa ? "ஆர்டர் எதுவும் கிடைக்கவில்லை. சரியான ஆர்டர் எண் அல்லது மின்னஞ்சலை உள்ளிடவும்." : "No matching order found. Please check your Order ID or email."))
      }
    } catch {
      setError(isTa ? "சேவையக பிழை. பின்னர் முயற்சிக்கவும்." : "Failed to connect. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12 bg-zinc-50 dark:bg-zinc-950 min-h-[85vh]">
      <div className="container-custom max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
            <Truck size={28} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
            {t("tracking.title") || "Track Your Order"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            {isTa
              ? "உங்கள் ஆர்டர் நிலை மற்றும் நேரலை டெலிவரி கண்காணிப்பை உடனடியாக பார்க்க உங்கள் ஆர்டர் எண் அல்லது மின்னஞ்சலை உள்ளிடவும்."
              : "Enter your Nutratein Order Number (e.g. NX-...) or registered email to check shipment progress in real time."}
          </p>
        </div>

        {/* Search Bar */}
        <div className="card p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-xl mx-auto">
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={isTa ? "ஆர்டர் எண் (NX-...) அல்லது மின்னஞ்சல்" : "Order ID (e.g. NX-...) or email..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field pl-10 text-xs sm:text-sm py-3"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold shrink-0 disabled:opacity-50"
            >
              {loading ? (isTa ? "தேடுகிறது..." : "Searching...") : (t("tracking.title")?.split(" ")[0] || "Track")}
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 max-w-xl mx-auto animate-fade-in">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {orders && orders.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            {orders.map((order) => {
              const currentStep = getStepIndex(order.status)
              return (
                <div
                  key={order.id || order.orderNumber}
                  className="card p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-6"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          {t("tracking.orderId") || "Order Number"}:
                        </span>
                        <span className="font-mono font-black text-sm text-zinc-900 dark:text-white">
                          {order.orderNumber || order.id}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {isTa ? "ஆர்டர் செய்யப்பட்ட தேதி: " : "Placed on: "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="badge-brand text-xs font-bold py-1 px-3">
                        {order.status || "CONFIRMED"}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                        {formatPrice(order.totalAmount || order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Stepper */}
                  <div className="py-2">
                    <div className="relative flex items-center justify-between">
                      {/* Connector Line */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 -z-0" />
                      <div
                        className="absolute top-1/2 left-0 h-1 bg-brand-600 -translate-y-1/2 transition-all duration-500 -z-0"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                      />

                      {STEPS.map((st) => {
                        const isCompleted = currentStep >= st.step
                        const isCurrent = currentStep === st.step
                        return (
                          <div
                            key={st.key}
                            className="flex flex-col items-center text-center relative z-10"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isCompleted
                                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/30 ring-4 ring-white dark:ring-zinc-900"
                                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 ring-4 ring-white dark:ring-zinc-900"
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 size={15} /> : st.step}
                            </div>
                            <span
                              className={`text-[10px] sm:text-xs font-bold mt-2 max-w-[80px] sm:max-w-[100px] leading-tight ${
                                isCurrent
                                  ? "text-brand-600 dark:text-brand-400"
                                  : isCompleted
                                  ? "text-zinc-900 dark:text-zinc-200"
                                  : "text-zinc-400"
                              }`}
                            >
                              {isTa ? st.labelTa : st.labelEn}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Estimated Delivery Note */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <Clock size={16} className="text-brand-600" />
                      <span>
                        <strong>{t("tracking.estimatedDelivery") || "Estimated Delivery"}: </strong>
                        {order.estimatedDelivery || (isTa ? "2 முதல் 4 வணிக நாட்கள்" : "2–4 Business Days (Express Courier)")}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/919321598094?text=Hi,%20I%20would%20like%20an%20update%20on%20my%20order%20${order.orderNumber || order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0"
                    >
                      <Phone size={13} /> {isTa ? "WhatsApp ஆதரவு" : "Live Help"}
                    </a>
                  </div>

                  {order.paymentMethod !== "COD" && order.paymentStatus === "PENDING" && (
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-orange-800">Awaiting Payment</p>
                        <p className="text-orange-700 text-[11px]">Your order is confirmed but payment is pending.</p>
                      </div>
                      <Link 
                        href={`/checkout/pay?order=${order.orderNumber || order.id}`}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all whitespace-nowrap"
                      >
                        Pay Now
                      </Link>
                    </div>
                  )}

                  {/* Packaging Video if available */}
                  {order.packagingVideoUrl && (
                    <PackagingVideoPlayer
                      videoUrl={order.packagingVideoUrl}
                      orderNumber={order.orderNumber || order.id}
                    />
                  )}

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        {t("tracking.orderDetails") || "Items in this shipment"}
                      </h4>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        {order.items.map((it: any, idx: number) => (
                          <div
                            key={it.id || idx}
                            className="p-3 sm:p-4 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              {it.image && (
                                <div className="relative w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-1 shrink-0 overflow-hidden">
                                  <Image src={it.image} alt={it.name} fill className="object-contain" />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-white line-clamp-1">
                                  {it.name}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  {[it.flavor, it.size].filter(Boolean).join(" • ") || "Standard"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-zinc-900 dark:text-white">
                                {formatPrice(it.price * (it.quantity || 1))}
                              </p>
                              <p className="text-[11px] text-zinc-400">Qty: {it.quantity || 1}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
