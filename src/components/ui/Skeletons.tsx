import { cn } from "@/lib/utils"

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-6 w-24 skeleton rounded" />
        <div className="h-9 w-full skeleton rounded-lg" />
      </div>
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-5 w-3/4 skeleton rounded" />
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 skeleton rounded" />
        </td>
      ))}
    </tr>
  )
}
