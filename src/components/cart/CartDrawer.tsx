"use client"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, RotateCcw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import CartRecommendations from "./CartRecommendations"
import { useLanguageStore } from "@/store/language"
import { toast } from "sonner"

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
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
  const t = useLanguageStore((s) => s.t)

  if (!isOpen) return null

  const subtotal = getSubtotal()
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-dark-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-500" />
            <h2 className="text-base sm:text-lg font-bold text-dark-900">
              {t("cart.title") || "Cart"} ({getTotalItems()} {getTotalItems() === 1 ? "item" : "items"})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear all items from your cart?")) {
                    clearCart()
                    toast.info("Cart cleared. Click 'Recover' anytime to restore.")
                  }
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                title="Clear all items in cart"
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            )}
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
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                title="Recover cleared items back to cart"
              >
                <RotateCcw size={12} />
                <span>Recover</span>
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors text-dark-500"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="text-dark-300" />
              </div>
              <div>
                <p className="font-semibold text-dark-700 mb-1">{t("cart.empty") || "Your cart is empty"}</p>
                <p className="text-sm text-dark-400">{t("cart.emptySub") || "Add items to get started"}</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                <Link href="/shop" onClick={closeCart} className="btn-primary text-center">
                  {t("cart.shopNow") || "Shop Now"}
                </Link>
                {(lastClearedItems?.length > 0 || lastRemovedItem) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (lastClearedItems && lastClearedItems.length > 0) {
                        recoverCart()
                        toast.success(`Recovered ${lastClearedItems.length} items to cart!`)
                      } else if (lastRemovedItem) {
                        recoverItem()
                        toast.success(`Recovered "${lastRemovedItem.name}" to cart!`)
                      }
                    }}
                    className="btn-secondary text-xs flex items-center justify-center gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                  >
                    <RotateCcw size={13} />
                    <span>Recover ({lastClearedItems?.length || 1})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-3 p-3 bg-dark-50 rounded-xl"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/${item.slug}`}
                    onClick={closeCart}
                    className="text-sm font-semibold text-dark-900 hover:text-brand-600 line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-dark-400 mt-0.5">{item.brand}</p>
                  {(item.flavor || item.size) && (
                    <p className="text-xs text-dark-400">
                      {[item.flavor, item.size].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white border border-dark-200 flex items-center justify-center hover:bg-dark-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 rounded-md bg-white border border-dark-200 flex items-center justify-center hover:bg-dark-50 transition-colors disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-dark-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-1 hover:text-red-500 text-dark-400 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Recommendations */}
        <CartRecommendations />

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-dark-100 p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-dark-600">
                <span>{t("cart.subtotal") || "Subtotal"}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-dark-600">
                <span>{t("cart.shipping") || "Shipping"}</span>
                <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                  {shipping === 0 ? (t("cart.freeShipping") || "FREE") : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-orange-500">
                  {t("cart.freeShippingThreshold", { amount: formatPrice(999 - subtotal) }) || `Add ${formatPrice(999 - subtotal)} more for free shipping!`}
                </p>
              )}
              <div className="flex justify-between font-bold text-dark-900 text-base pt-1 border-t border-dark-100">
                <span>{t("cart.total") || "Total"}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-primary w-full justify-center"
              >
                {t("cart.checkout") || "Checkout"} <ArrowRight size={16} />
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="btn-secondary w-full justify-center"
              >
                {t("cart.viewCart") || "View Cart"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
