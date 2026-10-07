"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { CheckCircle2, ShieldCheck, CreditCard, Banknote, QrCode } from "lucide-react"
import { toast } from "sonner"

function PayOrderContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentSettings, setPaymentSettings] = useState<any>(null)

  useEffect(() => {
    if (!orderNumber) {
      router.replace("/")
      return
    }
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/orders/track?q=${orderNumber}`)
        const data = await res.json()
        if (data.success && data.orders && data.orders.length > 0) {
          setOrder(data.orders[0])
        } else {
          toast.error("Order not found")
          router.replace("/")
        }
        
        const setRes = await fetch("/api/payment-settings")
        const setData = await setRes.json()
        if (setData.success) {
          setPaymentSettings(setData.settings)
        }
      } catch (err) {
        toast.error("Failed to load details")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [orderNumber, router])

  if (loading) return <div className="py-20 text-center">Loading payment details...</div>
  if (!order || !paymentSettings) return <div className="py-20 text-center">Failed to load payment info.</div>

  const isUPI = order.paymentMethod === "UPI"

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-dark-900">Complete Your Payment</h1>
        <p className="text-dark-500">Order #{order.orderNumber} is confirmed. Please complete the payment to dispatch your order.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl border border-zinc-100 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
          <span className="text-sm text-zinc-500">Amount to Pay</span>
          <span className="text-xl font-bold text-zinc-900">{formatPrice(order.totalAmount || order.total || 0)}</span>
        </div>

        {isUPI ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-2 border-2 border-emerald-500 rounded-xl bg-white">
              <img src={paymentSettings.qrCodeImage} alt="UPI QR Code" className="w-48 h-48 object-contain" />
            </div>
            <p className="font-bold text-emerald-800">{paymentSettings.upiName}</p>
            <p className="font-mono text-sm bg-zinc-100 px-3 py-1 rounded-lg">{paymentSettings.upiId}</p>
            <p className="text-xs text-zinc-500">{paymentSettings.instructions}</p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h3 className="font-bold text-brand-800">Payment Instructions</h3>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">
              Please follow the instructions provided during checkout for {order.paymentMethod}.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-100 space-y-4">
          <button onClick={() => router.push("/track")} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all">
            I have completed the payment
          </button>
          <p className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Secure Payment Processing
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PayOrderPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading payment details...</div>}>
      <PayOrderContent />
    </Suspense>
  )
}
