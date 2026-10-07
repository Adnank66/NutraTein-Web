"use client"
import { useState, useEffect } from "react"
import { ShoppingCart, Plus, Check } from "lucide-react"
import { toast } from "sonner"

interface Props {
  productId: string
  productName: string
  productPrice: number
  onAddToCart?: (products: any[]) => void
}

export default function FrequentlyBoughtTogether({ productId, productName, productPrice, onAddToCart }: Props) {
  const [bundle, setBundle] = useState<any>(null)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bundles?productId=${productId}`)
      .then(r => r.json())
      .then(d => {
        if (d.bundle && d.products.length > 0) {
          setBundle(d.bundle)
          setRelatedProducts(d.products)
          setSelected(d.products.map((p: any) => p.id))
        }
      })
      .finally(() => setLoading(false))
  }, [productId])

  if (loading || !bundle || relatedProducts.length === 0) return null

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedProducts = relatedProducts.filter(p => selected.includes(p.id))
  const totalOriginal = productPrice + selectedProducts.reduce((s, p) => s + p.basePrice, 0)
  const discount = bundle.discountPercent || 0
  const totalFinal = discount > 0 ? totalOriginal * (1 - discount / 100) : totalOriginal

  const handleAddAll = () => {
    if (onAddToCart) {
      onAddToCart(selectedProducts)
    }
    toast.success(`${selectedProducts.length + 1} items added to cart!`)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-5">
      <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <ShoppingCart size={16} className="text-brand-600" />
        Frequently Bought Together
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        {/* Main product (always included) */}
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 border-2 border-brand-500">
          <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
            <span className="text-[10px] font-bold text-zinc-500">Main</span>
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">{productName}</p>
            <p className="text-[10px] text-brand-600 font-semibold">₹{productPrice}</p>
          </div>
        </div>

        {relatedProducts.map((product, i) => (
          <div key={`plus-container-${product.id}`} className="flex items-center gap-3">
            <Plus key={`plus-${product.id}`} size={16} className="text-zinc-400 shrink-0" />
            <div key={product.id}
              onClick={() => toggleSelect(product.id)}
              className={`flex items-center gap-3 rounded-xl p-3 border-2 cursor-pointer transition-all ${
                selected.includes(product.id)
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 opacity-60'
              }`}>
              {product.images?.[0] ? (
                <img src={product.images[0].url} alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              )}
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">{product.name}</p>
                <p className="text-[10px] text-brand-600 font-semibold">₹{product.basePrice}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected.includes(product.id) ? 'bg-brand-600 border-brand-600' : 'border-zinc-300'
              }`}>
                {selected.includes(product.id) && <Check size={10} className="text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="text-xs text-zinc-500">
            Total for {selected.length + 1} item{selected.length !== 0 ? 's' : ''}:
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-zinc-900 dark:text-white">₹{Math.round(totalFinal)}</p>
            {discount > 0 && (
              <>
                <p className="text-sm line-through text-zinc-400">₹{Math.round(totalOriginal)}</p>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Save {discount}%
                </span>
              </>
            )}
          </div>
        </div>
        <button onClick={handleAddAll}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg shadow-brand-600/20">
          <ShoppingCart size={16} /> Add Bundle to Cart
        </button>
      </div>
    </div>
  )
}
