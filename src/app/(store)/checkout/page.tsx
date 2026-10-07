"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ShieldCheck, Banknote, QrCode, Copy, Check, Info, Tag, X,
  Loader2, CreditCard, Smartphone, Wallet, CheckCircle2, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useTranslation } from "@/hooks/useTranslation"
import Script from "next/script"
import TrustBadges from "@/components/TrustBadges"

// ── UPI app redirect deep-links ─────────────────────────────────────────────
function buildUPILink(upiId: string, name: string, amount: number, orderRef: string) {
  const base = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("PROTEINX Order " + orderRef)}`
  return base
}
function buildGPayLink(upiId: string, name: string, amount: number, orderRef: string) {
  return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("PROTEINX " + orderRef)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=https%3A%2F%2Fpay.google.com;end`
}
function buildPhonePeLink(upiId: string, name: string, amount: number, orderRef: string) {
  return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("PROTEINX " + orderRef)}#Intent;scheme=upi;package=com.phonepe.app;S.browser_fallback_url=https%3A%2F%2Fphonepe.com;end`
}
function buildPaytmLink(upiId: string, name: string, amount: number, orderRef: string) {
  return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("PROTEINX " + orderRef)}#Intent;scheme=upi;package=net.one97.paytm;S.browser_fallback_url=https%3A%2F%2Fpaytm.com;end`
}

type PaymentMethodType = "COD" | "UPI" | "CASH"

interface PaymentSettings {
  upiId: string
  upiName: string
  qrCodeImage: string
  instructions: string
  enableCOD: boolean
  enableUPI: boolean
  enableCash: boolean
  customMethods?: Array<{ id: string; name: string; description: string; details: string; enabled: boolean }>
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
]

const DEFAULT_SETTINGS: PaymentSettings = {
  upiId: "proteinx@upi",
  upiName: "PROTEINX Supplements Official",
  qrCodeImage: "/assets/payment/upi-qr.svg",
  instructions: "Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM) and enter the 12-digit UTR/Txn ID below.",
  enableCOD: true,
  enableUPI: true,
  enableCash: false,
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, getSubtotal, clearCart } = useCartStore()
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(/android|iphone|ipad/i.test(navigator.userAgent))
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please login to complete your order")
      router.push(`/login?callbackUrl=/checkout`)
    }
  }, [status, router])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    houseFlat: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("UPI")
  const [upiTxnId, setUpiTxnId] = useState("")
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promoCodeInput, setPromoCodeInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    description?: string | null
  } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS)
  const [upiLaunchPending, setUpiLaunchPending] = useState(false)
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null)
  const [postOffices, setPostOffices] = useState<string[]>([])
  const [isLoadingPincode, setIsLoadingPincode] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (placedOrderNumber && redirectCountdown === null) {
      setRedirectCountdown(4)
    }
  }, [placedOrderNumber, redirectCountdown])

  useEffect(() => {
    if (redirectCountdown === null) return
    if (redirectCountdown === 0) {
      router.push('/')
      return
    }
    const timer = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [redirectCountdown, router])

  // Auto-fetch city and state based on pincode
  useEffect(() => {
    const fetchPincodeData = async () => {
      const pin = formData.pincode.replace(/\D/g, "")
      if (pin.length === 6) {
        setIsLoadingPincode(true)
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
          const data = await res.json()
          if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
            const offices = data[0].PostOffice
            const first = offices[0]
            const areas = offices.map((o: any) => o.Name)
            
            setFormData(prev => ({
              ...prev,
              city: first.District || first.Region || prev.city,
              state: first.State || prev.state,
              street: areas.length === 1 ? areas[0] : prev.street
            }))
            setPostOffices(areas)
            toast.success("Location auto-filled from PIN Code!")
          } else {
            setPostOffices([])
          }
        } catch (e) {
          console.error("Failed to fetch pincode:", e)
        } finally {
          setIsLoadingPincode(false)
        }
      } else {
        setPostOffices([])
      }
    }
    fetchPincodeData()
  }, [formData.pincode])

  // Load saved email from cookie and payment settings
  useEffect(() => {
    fetch("/api/payment-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          setPaymentSettings({ ...DEFAULT_SETTINGS, ...data.settings })
        }
      })
      .catch(() => {})

    try {
      const match = document.cookie.match(/(?:^|; )proteinx_user_email=([^;]*)/)
      const savedEmail = match ? decodeURIComponent(match[1]) : localStorage.getItem("proteinx_saved_email")
      if (savedEmail) setFormData((p) => ({ ...p, email: savedEmail }))
    } catch {}
  }, [])

  const subtotal = getSubtotal()
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const shipping = subtotal - discountAmount >= 999 ? 0 : 99
  const total = Math.max(0, subtotal - discountAmount + shipping)

  // ── Coupon handling ────────────────────────────────────────────────────────
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanCode = promoCodeInput.trim().toUpperCase()
    if (!cleanCode) { toast.error("Please enter a promo code"); return }
    setIsValidatingCoupon(true)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, orderAmount: subtotal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid promo code")
      setAppliedCoupon({ code: data.code, discountAmount: data.discountAmount, description: data.description })
      toast.success(`Promo code ${data.code} applied! Saved ₹${data.discountAmount}`)
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired promo code")
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setPromoCodeInput(""); toast("Promo code removed") }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center container-custom">
        <h2 className="text-2xl font-bold text-dark-900 mb-2">Your Cart is Empty</h2>
        <button onClick={() => router.push("/shop")} className="btn-primary text-xs">Browse Shop</button>
      </div>
    )
  }

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(paymentSettings.upiId)
      setCopiedUpi(true)
      toast.success("UPI ID copied to clipboard!")
      setTimeout(() => setCopiedUpi(false), 2500)
    }
  }

  // ── Save cookies after order ───────────────────────────────────────────────
  const persistOrderCookies = (orderNum: string) => {
    const cleanEmail = formData.email.trim().toLowerCase()
    document.cookie = `proteinx_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=31536000; SameSite=Lax`
    try { localStorage.setItem("proteinx_saved_email", cleanEmail) } catch {}
    let existingRecent: string[] = []
    try {
      const match = document.cookie.match(/(?:^|; )proteinx_recent_orders=([^;]*)/)
      if (match) existingRecent = JSON.parse(decodeURIComponent(match[1]))
    } catch {}
    if (!existingRecent.includes(orderNum)) existingRecent.unshift(orderNum)
    document.cookie = `proteinx_recent_orders=${encodeURIComponent(JSON.stringify(existingRecent.slice(0, 20)))}; path=/; max-age=31536000; SameSite=Lax`
  }

  // ── Create order in DB (used by all payment flows) ────────────────────────
  const createOrder = async (pmOverride?: PaymentMethodType) => {
    const pm = pmOverride || paymentMethod
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: formData,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
          productName: i.name,
          flavor: i.flavor,
          size: i.size,
        })),
        paymentMethod: pm,
        upiTransactionId: upiTxnId.trim() || undefined,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code || undefined,
        shippingAmount: shipping,
        totalAmount: total,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to process order")
    return data.order
  }

  // ── Validate form ──────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.street || !formData.city || !formData.pincode) {
      toast.error("Please fill in all required shipping details")
      return false
    }
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit mobile number")
      return false
    }
    const pinRegex = /^[0-9]{6}$/
    if (!pinRegex.test(formData.pincode.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 6-digit postal pincode")
      return false
    }
    return true
  }

  // ── COD / CASH order ───────────────────────────────────────────────────────
  const handlePlaceOrderCOD = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const order = await createOrder()
      persistOrderCookies(order.orderNumber || order.id)
      clearCart()
      toast.success("Order placed successfully!")
      router.push(`/order-confirmation/${order.id}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to place order")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Manual UPI: create order then show "I've Paid" button ─────────────────
  const handleUPIManualOrder = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const order = await createOrder("UPI")
      persistOrderCookies(order.orderNumber || order.id)
      setPlacedOrderNumber(order.orderNumber || order.id)
      clearCart()
      toast.success("Order created! Complete your UPI payment below.")
      // Don't redirect yet — show UPI payment screen
    } catch (err: any) {
      toast.error(err.message || "Failed to create order")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Main place order handler ───────────────────────────────────────────────
  const handlePlaceOrder = () => {
    if (paymentMethod === "COD" || paymentMethod === "CASH") return handlePlaceOrderCOD()
    if (paymentMethod === "UPI") return handleUPIManualOrder()
  }

  const upiLink = buildUPILink(paymentSettings.upiId, paymentSettings.upiName, total, placedOrderNumber || "ORDER")

  // ── Method card component ─────────────────────────────────────────────────
  const MethodCard = ({
    id, icon: Icon, title, subtitle, available = true
  }: { id: PaymentMethodType; icon: any; title: string; subtitle: string; available?: boolean }) => {
    if (!available) return null
    return (
      <button
        type="button"
        onClick={() => setPaymentMethod(id)}
        className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
          paymentMethod === id
            ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 shadow-sm ring-1 ring-brand-500"
            : "border-dark-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-dark-50 dark:hover:bg-zinc-800"
        }`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          paymentMethod === id ? "bg-brand-600 text-white" : "bg-dark-100 dark:bg-zinc-800 text-dark-600 dark:text-zinc-400"
        }`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="font-bold text-xs text-dark-900 dark:text-zinc-100">{title}</p>
          <p className="text-[11px] text-dark-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
      </button>
    )
  }

  const [mobileOrderOpen, setMobileOrderOpen] = useState(false)

  return (
    <>
      <div className="py-10 bg-dark-50/50 dark:bg-zinc-950 min-h-[85vh]">
        <div className="container-custom">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white mb-6">
            {t("checkout.title", undefined) || "Express Checkout"}
          </h1>

          {/* ── Mobile Sticky Order Summary Accordion ─────────────── */}
          <div className="lg:hidden mb-5 card dark:bg-zinc-900 dark:border-zinc-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileOrderOpen(!mobileOrderOpen)}
              className="w-full flex items-center justify-between p-4 text-sm font-bold text-dark-900 dark:text-zinc-100 hover:bg-dark-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                🛒 Order Summary
                <span className="bg-brand-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </span>
              <span className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <span className="font-extrabold text-base">{formatPrice(total)}</span>
                {mobileOrderOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {mobileOrderOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-dark-100 dark:border-zinc-800 pt-3">
                {items.map((i) => (
                  <div key={`mob-${i.id || i.productId}-${i.flavor || ""}-${i.size || ""}`} className="flex gap-3 text-xs">
                    <div className="relative w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-dark-100 dark:border-zinc-700 overflow-hidden shrink-0">
                      <Image src={i.image} alt={i.name} fill className="object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark-900 dark:text-zinc-100 truncate">{i.name}</p>
                      {(i.flavor || i.size) && (
                        <p className="text-[10px] text-brand-600 dark:text-brand-400">{[i.flavor, i.size].filter(Boolean).join(" • ")}</p>
                      )}
                      <p className="text-dark-400 dark:text-zinc-500 text-[11px]">{i.quantity} × {formatPrice(i.price)}</p>
                    </div>
                    <span className="font-bold text-dark-900 dark:text-zinc-100 shrink-0">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-dark-100 dark:border-zinc-800 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-dark-600 dark:text-zinc-400">
                    <span>Subtotal</span><span className="font-semibold text-dark-900 dark:text-zinc-100">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-dark-600 dark:text-zinc-400">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-emerald-600 font-bold" : "font-semibold text-dark-900 dark:text-zinc-100"}>
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-dark-900 dark:text-zinc-100 pt-2 border-t border-dark-100 dark:border-zinc-800">
                    <span>Total Payable</span><span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* ── STEP 1: Shipping Details ─────────────────────────────── */}
              <div className="card p-6 space-y-4 dark:bg-zinc-900 dark:border-zinc-700">
                <h2 className="text-base font-bold text-dark-900 dark:text-zinc-100 pb-3 border-b border-dark-100 dark:border-zinc-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Customer & Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "name", label: "Full Name", type: "text", placeholder: "e.g. Adnan Kazi" },
                    { key: "email", label: "Email Address", type: "email", placeholder: "e.g. adnan@example.com" },
                    { key: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 9876543210" },
                    { key: "houseFlat", label: "House / Flat No.", type: "text", placeholder: "e.g. Flat 402, Building B" },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="label dark:text-zinc-400">{label}</label>
                      <input
                        type={type}
                        maxLength={key === "phone" ? 10 : undefined}
                        value={(formData as any)[key]}
                        onChange={(e) => {
                          let val = e.target.value
                          if (key === "phone") val = val.replace(/\D/g, "")
                          setFormData({ ...formData, [key]: val })
                        }}
                        placeholder={placeholder}
                        className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        required
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="label dark:text-zinc-400">Street / Locality (Area)</label>
                    {postOffices.length > 0 ? (
                      <select
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        required
                      >
                        <option value="">-- Select Area / Post Office --</option>
                        {postOffices.map((office) => (
                          <option key={office} value={office}>{office}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="e.g. MG Road, Near Central Gym, Bandra West"
                        className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="label dark:text-zinc-400">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="label dark:text-zinc-400">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                      required
                    >
                      <option value="">-- Select State / UT --</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label dark:text-zinc-400 flex items-center justify-between">
                      <span>PIN Code</span>
                      {isLoadingPincode && <Loader2 size={12} className="animate-spin text-brand-500" />}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                      placeholder="e.g. 400050"
                      className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="label dark:text-zinc-400">Country</label>
                    <input type="text" value={formData.country} disabled className="input text-xs bg-dark-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* ── STEP 2: Payment Method Selection ─────────────────────── */}
              <div className="card p-6 space-y-4 dark:bg-zinc-900 dark:border-zinc-700">
                <div className="flex items-center justify-between pb-3 border-b border-dark-100 dark:border-zinc-800">
                  <h2 className="text-base font-bold text-dark-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    Select Payment Option
                  </h2>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck size={14} /> 100% Secure
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MethodCard id="COD" icon={Banknote} title="Save Order & Pay Later / COD" subtitle="Save directly to My Orders; pay anytime via UPI or on delivery" available={paymentSettings.enableCOD} />
                  <MethodCard id="UPI" icon={QrCode} title="Pay Now via UPI QR Code" subtitle="Instant GPay, PhonePe, Paytm — scan & pay" available={paymentSettings.enableUPI} />
                  {paymentSettings.customMethods?.filter((c: any) => c.enabled).map((cm: any) => (
                    <MethodCard key={cm.id} id={cm.id} icon={CreditCard} title={cm.name} subtitle={cm.description} available={true} />
                  ))}
                </div>

                {/* ── UPI Manual Panel ──────────────────────────────────── */}
                {paymentMethod === "UPI" && !placedOrderNumber && (
                  <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-dark-50 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative w-44 h-44 rounded-xl bg-white dark:bg-zinc-800 p-2 border-2 border-emerald-500/80 shadow-md shrink-0 flex items-center justify-center">
                        <img
                          src={(paymentSettings.qrCodeImage || "/assets/payment/upi-qr.svg").trim().replace(/\\/g, "/")}
                          alt="UPI QR Code"
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/assets/payment/upi-qr.svg"
                          }}
                        />
                      </div>
                      <div className="space-y-2.5 text-center sm:text-left flex-1">
                        <span className="badge bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                          SCAN TO PAY • {formatPrice(total)}
                        </span>
                        <h3 className="font-extrabold text-sm text-dark-900 dark:text-zinc-100">{paymentSettings.upiName}</h3>
                        <p className="text-xs text-dark-500 dark:text-zinc-400 leading-relaxed">{paymentSettings.instructions}</p>
                        <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                          <div className="px-3 py-1.5 rounded-lg bg-dark-100 dark:bg-zinc-800 font-mono text-xs font-bold text-dark-800 dark:text-zinc-200 border border-dark-200 dark:border-zinc-700">
                            {paymentSettings.upiId}
                          </div>
                          <button type="button" onClick={handleCopyUpi} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1">
                            {copiedUpi ? <Check size={13} /> : <Copy size={13} />}
                            {copiedUpi ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Direct UPI App Buttons */}
                    <div className="pt-3 border-t border-emerald-100 dark:border-emerald-900">
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">Open your UPI app directly:</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={buildGPayLink(paymentSettings.upiId, paymentSettings.upiName, total, "ORDER")}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-green-400 hover:text-green-700 dark:hover:text-green-400 transition-all"
                        >
                          <span className="text-base">🟢</span> Google Pay
                        </a>
                        <a
                          href={buildPhonePeLink(paymentSettings.upiId, paymentSettings.upiName, total, "ORDER")}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-400 transition-all"
                        >
                          <span className="text-base">🟣</span> PhonePe
                        </a>
                        <a
                          href={buildPaytmLink(paymentSettings.upiId, paymentSettings.upiName, total, "ORDER")}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition-all"
                        >
                          <span className="text-base">🔵</span> Paytm
                        </a>
                        <a
                          href={upiLink}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-400 transition-all"
                        >
                          <Smartphone size={13} /> Any UPI App
                        </a>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
                        📱 On mobile, tapping a button above opens the app directly with amount pre-filled.
                        On desktop, scan the QR code instead.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900">
                      <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                        UPI Transaction ID / UTR Number <span className="font-normal text-zinc-400">(Optional — for faster verification)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 425678901234 (12 digits)"
                        value={upiTxnId}
                        onChange={(e) => setUpiTxnId(e.target.value)}
                        className="input text-xs font-mono dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}

                {/* ── Custom Methods Panel ──────────────────────────────────── */}
                {paymentSettings.customMethods?.some((c: any) => c.id === paymentMethod && c.enabled) && (
                  <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-brand-50/60 via-white to-dark-50 dark:from-brand-950/20 dark:via-zinc-900 dark:to-zinc-900 border border-brand-200 dark:border-brand-800 space-y-4 animate-fade-in">
                    <h3 className="font-extrabold text-sm text-dark-900 dark:text-zinc-100">
                      {paymentSettings.customMethods.find((c: any) => c.id === paymentMethod)?.name} Instructions
                    </h3>
                    <div className="whitespace-pre-wrap text-xs text-dark-600 dark:text-zinc-400 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono">
                      {paymentSettings.customMethods.find((c: any) => c.id === paymentMethod)?.details}
                    </div>
                  </div>
                )}

                {/* ── UPI: After order placed — show "I've Paid" ────────── */}
                {paymentMethod === "UPI" && placedOrderNumber && (
                  <div className="mt-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-700 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Order Created! Complete your payment</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">Order #{placedOrderNumber} is saved. Scan QR or tap a button below to pay.</p>
                        {redirectCountdown !== null && (
                          <p className="text-xs font-bold text-red-600 mt-1">
                            Redirecting to home in {redirectCountdown}...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* QR shown again after order placed */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-36 h-36 rounded-xl bg-white dark:bg-zinc-800 p-2 border-2 border-emerald-500 shadow flex items-center justify-center shrink-0">
                        <img
                          src={(paymentSettings.qrCodeImage || "/assets/payment/upi-qr.svg").trim().replace(/\\/g, "/")}
                          alt="UPI QR"
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/assets/payment/upi-qr.svg"
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Pay {formatPrice(total)} to:</p>
                        <div className="font-mono text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2">{paymentSettings.upiId}</div>
                        <div className="flex flex-wrap gap-2">
                          <a href={buildGPayLink(paymentSettings.upiId, paymentSettings.upiName, total, placedOrderNumber)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700">🟢 GPay</a>
                          <a href={buildPhonePeLink(paymentSettings.upiId, paymentSettings.upiName, total, placedOrderNumber)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700">🟣 PhonePe</a>
                          <a href={buildPaytmLink(paymentSettings.upiId, paymentSettings.upiName, total, placedOrderNumber)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">🔵 Paytm</a>
                          <a href={upiLink} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-700 text-white text-xs font-bold hover:bg-zinc-800"><Smartphone size={12} /> UPI</a>
                        </div>
                        <button
                          onClick={() => router.push(`/order-confirmation/${placedOrderNumber}?status=upi_pending`)}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 rounded-xl transition-colors"
                        >
                          <CheckCircle2 size={16} /> I've Completed Payment
                        </button>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">
                          Your order is saved. An admin will verify your payment within 1–2 hours and confirm your order.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── COD Info ───────────────────────────────────────────── */}
                {(paymentMethod === "COD" || paymentMethod === "CASH") && (
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <Info size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-bold">{paymentMethod === "COD" ? "Cash on Delivery Selected" : "Cash on Pickup Selected"}</p>
                      <p className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5">
                        Please keep {formatPrice(total)} ready in cash when our courier partner arrives at your address.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT SIDEBAR: Order Summary ──────────────────────────── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-6 space-y-4 dark:bg-zinc-900 dark:border-zinc-700">
                <h2 className="text-base font-bold text-dark-900 dark:text-zinc-100 pb-3 border-b border-dark-100 dark:border-zinc-800">
                  {t("checkout.orderSummary", undefined) || "Order Summary"} ({items.length} {items.length === 1 ? t("common.item", undefined) || "item" : t("common.items", undefined) || "items"})
                </h2>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((i) => (
                    <div key={`${i.id || i.productId}-${i.flavor || ""}-${i.size || ""}`} className="flex gap-3 text-xs">
                      <div className="relative w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 border border-dark-100 dark:border-zinc-700 overflow-hidden shrink-0">
                        <Image src={i.image} alt={i.name} fill className="object-contain p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-dark-900 dark:text-zinc-100 truncate">{i.name}</p>
                        {(i.flavor || i.size) && (
                          <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                            {[i.flavor, i.size].filter(Boolean).join(" • ")}
                          </p>
                        )}
                        <p className="text-dark-400 dark:text-zinc-500 text-[11px]">{i.quantity} × {formatPrice(i.price)}</p>
                      </div>
                      <span className="font-bold text-dark-900 dark:text-zinc-100">{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="pt-3 border-t border-dark-100 dark:border-zinc-800 space-y-2">
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
                        <input type="text" placeholder="Promo Code" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} className="input pl-8 text-xs font-mono font-bold uppercase tracking-wider dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100" />
                      </div>
                      <button type="submit" disabled={isValidatingCoupon || !promoCodeInput.trim()} className="btn-dark text-xs py-2 px-3.5 shrink-0 font-bold">
                        {isValidatingCoupon ? <Loader2 size={13} className="animate-spin" /> : (t("checkout.apply", undefined) || "Apply")}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <div className="flex items-center gap-2">
                        <Tag size={13} className="text-emerald-600" />
                        <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">{appliedCoupon.code}</span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="p-1 text-emerald-700 hover:text-emerald-900 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                <TrustBadges variant="compact" className="mt-3" />

                {/* Totals */}
                <div className="space-y-2 text-xs text-dark-600 dark:text-zinc-400 pt-3 border-t border-dark-100 dark:border-zinc-800">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-dark-900 dark:text-zinc-100">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-emerald-600 font-bold" : "font-semibold text-dark-900 dark:text-zinc-100"}>
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-dark-900 dark:text-zinc-100 pt-2 border-t border-dark-100 dark:border-zinc-800">
                    <span>{t("checkout.totalPayable", undefined) || "Total Payable"}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Place Order CTA */}
                {!placedOrderNumber && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center py-3.5 text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Processing...</>
                    ) : paymentMethod === "UPI" ? (
                      <><QrCode size={15} /> Create Order & Pay via UPI</>
                    ) : (
                      <><Banknote size={15} /> Confirm {paymentMethod === "CASH" ? "Pickup" : "COD"} Order • {formatPrice(total)}</>
                    )}
                  </button>
                )}

                {placedOrderNumber && (
                  <div className="text-center py-2">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✅ Order #{placedOrderNumber} created</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Complete UPI payment using the options above</p>
                    {redirectCountdown !== null && (
                      <p className="text-[11px] font-bold text-red-600 mt-2">
                        Redirecting to home in {redirectCountdown}...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}