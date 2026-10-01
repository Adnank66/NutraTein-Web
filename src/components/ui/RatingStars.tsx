import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  size?: number
  className?: string
  showValue?: boolean
  reviewCount?: number
}

export default function RatingStars({ rating, size = 14, className, showValue, reviewCount }: RatingStarsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating)
          const half = !filled && i < rating
          return (
            <Star
              key={i}
              size={size}
              className={cn(
                filled || half ? "text-yellow-400" : "text-dark-200",
                filled || half ? "fill-yellow-400" : "fill-dark-200"
              )}
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-dark-700">{rating.toFixed(1)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-dark-400">({reviewCount})</span>
      )}
    </div>
  )
}
