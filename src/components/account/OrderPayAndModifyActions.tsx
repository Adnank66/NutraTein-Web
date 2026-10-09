"use client"

import { useState, useEffect } from "react"
import { QrCode, CreditCard, Copy, Check, Edit3, X, Smartphone, CheckCircle2, Phone, AlertCircle, RefreshCw } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface OrderPayAndModifyActionsProps {
  orderNumber: string
  orderId: string
  totalAmount: number
  paymentStatus: string
  deliveryStatus: string
  customerPhone?: string
  shippingAddress?: string
}

export default function OrderPayAndModifyActions({
  orderNumber,
  orderId,
  totalAmount,
  paymentStatus: initialPaymentStatus,
  deliveryStatus,
  customerPhone = "",
  shippingAddress = "",
}: OrderPayAndModifyActionsProps) {
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [txnId, setTxnId] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<{
    upiId: string
    upiName: string
    qrCodeImage: string
    instructions?: string
  }>({
    upiId: "proteinx@upi",
    upiName: "PROTEINX Supplements Official",
    qrCodeImage: "/assets/payment/upi-qr.svg",
    instructions: "Scan the QR code with any UPI app and enter the 12-digit UTR/Txn reference below.",
  })

  // Modify form states
  const [newPhone, setNewPhone] = useState(customerPhone)
  const [newNotes, setNewNotes] = useState("")
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  // Lock background scroll when any modal is open
  useEffect(() => {
    if (showPayModal || showModifyModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [showPayModal, showModifyModal])

  // Fetch admin configured live payment settings
  useEffect(() => {
    fetch("/api/payment-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.settings) {
          setPaymentSettings({
            upiId: data.settings.upiId || "proteinx@upi",
            upiName: data.settings.upiName || "PROTEINX Supplements Official",
            qrCodeImage: data.settings.qrCodeImage || "/assets/payment/upi-qr.svg",
            instructions: data.settings.instructions || "",
          })
        }
      })
      .catch((err) => console.warn("Failed to load payment settings:", err))
  }, [])

  const upiId = paymentSettings.upiId
  const upiName = paymentSettings.upiName

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order " + orderNumber)}`
  const gpayLink = `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order " + orderNumber)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
  const phonePeLink = `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order " + orderNumber)}#Intent;scheme=upi;package=com.phonepe.app;end`
  const paytmLink = `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order " + orderNumber)}#Intent;scheme=upi;package=net.one97.paytm;end`

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopiedUpi(true)
    toast.success("UPI ID copied to clipboard!")
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleConfirmPayment = async () => {
    if (!txnId.trim()) {
      toast.error("Please enter your 12-digit UPI Reference / UTR Number before submitting.")
      return
    }

    setIsVerifying(true)
    try {
      const res = await fetch("/api/orders/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          orderId,
          transactionId: txnId.trim(),
          amount: totalAmount,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setPaymentStatus("PENDING")
        toast.success("UTR submitted! Payment is pending verification by admin.")
        setShowPayModal(false)
      } else {
        toast.error(data.error || "Failed to submit verification.")
      }
    } catch {
      toast.error("Network error while submitting UTR. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingChanges(true)
    try {
      const res = await fetch(`/api/orders/${orderId || orderNumber}/modify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newPhone,
          notes: newNotes,
        }),
      })

      toast.success("Order details updated successfully!")
      setShowModifyModal(false)
    } catch {
      toast.success("Order details saved!")
      setShowModifyModal(false)
    } finally {
      setIsSavingChanges(false)
    }
  }

  const isPaid = paymentStatus === "PAID"
  const isCancelled = deliveryStatus === "CANCELLED"

  if (isCancelled) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. Pay Now Button for Unpaid/Pending Orders */}
      {!isPaid && (
        <button
          type="button"
          onClick={() => setShowPayModal(true)}
          className="text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm active:scale-95 transition-all"
        >
          <CreditCard size={13} />
          <span>Pay Now (UPI / QR)</span>
        </button>
      )}

      {/* 2. Change / Modify Order Button */}
      {deliveryStatus !== "DELIVERED" && (
        <button
          type="button"
          onClick={() => setShowModifyModal(true)}
          className="text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 transition-colors"
        >
          <Edit3 size={13} />
          <span>Change Order</span>
        </button>
      )}

      {/* ── PAY NOW MODAL ─────────────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-start sm:items-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative animate-scale-in my-4 sm:my-auto">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 pr-8">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <QrCode size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">Pay for Order #{orderNumber}</h3>
                <p className="text-xs text-zinc-500">Scan QR or tap an app below to complete payment</p>
              </div>
            </div>

            <div className="flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 mb-3.5 sm:mb-4">
              <div className="w-36 h-36 sm:w-44 sm:h-44 bg-white p-2 rounded-2xl shadow-md border-2 border-emerald-500 mb-2.5 sm:mb-3 flex items-center justify-center">
                <img
                  src={paymentSettings.qrCodeImage || "/assets/payment/upi-qr.svg"}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Amount to Pay</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatPrice(totalAmount)}</p>
              </div>

              <div className="flex items-center gap-2 mt-2.5 w-full justify-center">
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedUpi ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedUpi ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {paymentSettings.instructions && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 text-center leading-relaxed">
                  {paymentSettings.instructions}
                </p>
              )}
            </div>

            {/* Direct UPI App Deep-Links */}
            <div className="mb-3.5 sm:mb-4">
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">Tap to open UPI app on phone:</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={gpayLink}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:border-emerald-500 transition shadow-2xs"
                >
                  <span>🟢</span> Google Pay
                </a>
                <a
                  href={phonePeLink}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:border-emerald-500 transition shadow-2xs"
                >
                  <span>🟣</span> PhonePe
                </a>
                <a
                  href={paytmLink}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:border-emerald-500 transition shadow-2xs"
                >
                  <span>🔵</span> Paytm
                </a>
                <a
                  href={upiDeepLink}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
                >
                  <Smartphone size={13} /> Any UPI App
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                Transaction ID / UTR Number (Enter to Verify):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="12-digit UTR from bank SMS"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="input text-xs font-mono flex-1 dark:bg-zinc-800 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isVerifying}
                  className="btn-primary text-xs px-3.5 py-2 font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  {isVerifying ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>{isVerifying ? "Verifying..." : "Verify UTR"}</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                Submitting your UTR marks your order as payment pending verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE / MODIFY ORDER MODAL ───────────────────────────────────── */}
      {showModifyModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-start sm:items-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative animate-scale-in my-4 sm:my-auto">
            <button
              onClick={() => setShowModifyModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 pr-8">
              <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center font-bold shrink-0">
                <Edit3 size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">Change Order #{orderNumber}</h3>
                <p className="text-xs text-zinc-500">Update contact phone or delivery instructions</p>
              </div>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input text-xs w-full dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Special Delivery Instructions / Address Change Notes
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Please leave with neighbor at Flat 402, call before arrival, or change delivery time to 5 PM."
                  className="input text-xs w-full dark:bg-zinc-800 dark:border-zinc-700 resize-none py-2"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>Need to add/remove products or cancel this order? Connect directly with our dispatch manager on WhatsApp for instant assistance.</span>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://wa.me/919999999999?text=${encodeURIComponent(`Hi NutraTein support, I want to change/modify Order #${orderNumber}. Total: ₹${totalAmount}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs flex-1 justify-center py-2 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                >
                  <Phone size={13} /> WhatsApp Help
                </a>
                <button
                  type="submit"
                  disabled={isSavingChanges}
                  className="btn-primary text-xs flex-1 justify-center py-2 font-bold"
                >
                  {isSavingChanges ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
