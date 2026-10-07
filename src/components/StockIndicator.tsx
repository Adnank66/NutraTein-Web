interface Props {
  stock: number
  threshold?: number
  className?: string
}

export default function StockIndicator({ stock, threshold = 10, className = "" }: Props) {
  if (stock === undefined || stock === null) return null

  if (stock <= 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        Out of Stock
      </div>
    )
  }

  if (stock <= 5) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Only {stock} left!
      </div>
    )
  }

  if (stock <= threshold) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-orange-400" />
        Low Stock — {stock} left
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      In Stock
    </div>
  )
}
