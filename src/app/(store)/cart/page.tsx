"use client"
import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Check, ShieldCheck, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTotalItems,
    clearCart,
    recoverCart,
    recoverItem,
    lastClearedItems,
    lastRemovedItem,
  } = useCartStore()
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

  const subtotal = getSubtotal()
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0
  const shipping = subtotal >= 999 ? 0 : 99
  const total = Math.max(0, subtotal - discountAmount + shipping)

  const toggleSelectItem = (key: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleClearOneItem = () => {
    if (items.length === 0) return
    const match = items[items.length - 1]
    removeItem(match.id || match.productId, match.variantId)
    const key = match.id || `${match.productId}-${match.variantId}`
    setSelectedItemIds((prev) => prev.filter((k) => k !== key))
    toast.success(`Removed "${match.name}" from cart`)
  }

  const handleClearSelectedItems = () => {
    if (selectedItemIds.length === 0) {
      handleClearOneItem()
      return
    }
    selectedItemIds.forEach((key) => {
      const match = items.find((i) => (i.id || `${i.productId}-${i.variantId}`) === key)
      if (match) {
        removeItem(match.id || match.productId, match.variantId)
      }
    })
    setSelectedItemIds([])
    toast.success("Selected items cleared from cart")
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setCouponLoading(true)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: subtotal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid coupon code")
      setAppliedCoupon({ code: data.code, discount: data.discountAmount })
      toast.success(`Coupon ${data.code} applied! Saved ${formatPrice(data.discountAmount)}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to apply coupon")
    } finally {
      setCouponLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-20 bg-dark-50/50 min-h-[60vh] flex items-center justify-center">
        <div className="card p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center mx-auto text-dark-400">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Your Cart is Empty</h1>
          <p className="text-xs text-dark-500">Add supplements to get started.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link href="/shop" className="btn-primary inline-flex text-xs">
              Start Shopping <ArrowRight size={14} />
            </Link>
            {(lastClearedItems?.length > 0 || lastRemovedItem) && (
              <button
                type="button"
                onClick={() => {
                  if (lastClearedItems?.length > 0) {
                    recoverCart()
                    toast.success(`Recovered ${lastClearedItems.length} item(s) to cart!`)
                  } else if (lastRemovedItem) {
                    recoverItem()
                    toast.success(`Recovered "${lastRemovedItem.name}" to cart!`)
                  }
                }}
                className="btn-secondary inline-flex text-xs items-center gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
              >
                <RotateCcw size={13} />
                <span>Recover Cleared Cart ({lastClearedItems?.length || 1})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 bg-dark-50/50">
      <div className="container-custom">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 mb-8">
          Shopping Cart ({getTotalItems()} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-4 bg-brand-50/60 border border-brand-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-900">
                {subtotal >= 999
                  ? "🎉 You have qualified for FREE Express Shipping!"
                  : `Add ${formatPrice(999 - subtotal)} more for FREE Shipping!`}
              </span>
              <span className="text-xs font-bold text-brand-600">Free at ₹999</span>
            </div>

            {items.map((item) => {
              const itemKey = item.id || `${item.productId}-${item.variantId}`
              const isSelected = selectedItemIds.includes(itemKey)
              return (
                <div
                  key={itemKey}
                  className={`card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all ${
                    isSelected ? "border-brand-500 ring-2 ring-brand-500/20" : ""
                  }`}
                >
                  <div className="flex gap-3 sm:gap-4 items-center min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(itemKey)}
                      className="rounded border-dark-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      title="Select this item to clear individually"
                    />
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-dark-100 shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-brand-600 uppercase">{item.brand}</span>
                      <Link
                        href={`/shop/${item.slug}`}
                        className="block text-sm font-bold text-dark-900 hover:text-brand-600 truncate"
                      >
                        {item.name}
                      </Link>
                      {(item.flavor || item.size) && (
                        <p className="text-xs text-dark-400 mt-0.5">
                          {[item.flavor, item.size].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      <p className="text-xs font-extrabold text-dark-900 mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-dark-100">
                    <div className="flex items-center border border-dark-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="px-2.5 py-1.5 text-dark-600 hover:bg-dark-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="px-2.5 py-1.5 text-dark-600 hover:bg-dark-50 disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="text-sm font-extrabold text-dark-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    <button
                      onClick={() => removeItem(item.id || item.productId, item.variantId)}
                      className="p-1.5 text-dark-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Clear this individual item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <Link href="/shop" className="btn-secondary text-xs">
                Continue Shopping
              </Link>
              <div className="flex items-center gap-2">
                {selectedItemIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearSelectedItems}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    title="Clear selected individual items"
                  >
                    <Trash2 size={13} />
                    <span>Clear Selected ({selectedItemIds.length})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearOneItem}
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    title="Clear one individual item from cart"
                  >
                    <Trash2 size={13} className="text-zinc-500" />
                    <span>Clear One</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear all items from your cart?")) {
                      clearCart()
                      setSelectedItemIds([])
                      toast.info("Cart cleared. Click 'Recover' anytime to restore.")
                    }
                  }}
                  className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Clear all items in cart"
                >
                  <Trash2 size={13} />
                  <span>Clear All</span>
                </button>

                {(lastClearedItems?.length > 0 || lastRemovedItem) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (lastClearedItems?.length > 0) {
                        recoverCart()
                        toast.success(`Recovered ${lastClearedItems.length} items to cart!`)
                      } else if (lastRemovedItem) {
                        recoverItem()
                        toast.success(`Recovered "${lastRemovedItem.name}" to cart!`)
                      }
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Recover cleared items back to your cart"
                  >
                    <RotateCcw size={13} />
                    <span>Recover</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-bold text-dark-900 pb-3 border-b border-dark-100">
                Order Summary
              </h2>

              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="label">Have a Coupon Code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FIRST10, SAVE20"
                    className="input text-xs uppercase"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode}
                    className="btn-secondary text-xs px-3 py-2 shrink-0"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <Check size={12} /> Coupon {appliedCoupon.code} applied (-{formatPrice(appliedCoupon.discount)})
                  </p>
                )}
              </form>

              <div className="space-y-2.5 text-xs text-dark-600 pt-3 border-t border-dark-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-dark-900">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className={shipping === 0 ? "text-green-600 font-bold" : "font-semibold text-dark-900"}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-dark-900 pt-3 border-t border-dark-100">
                  <span>Total Amount</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-primary w-full justify-center py-3 text-sm">
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
            </div>

            <div className="card p-4 bg-dark-50/50 border border-dark-100 text-[11px] text-dark-500 flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-600 shrink-0" />
              <span>Safe 256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}