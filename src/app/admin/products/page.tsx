import { prisma } from "@/lib/prisma"
import BulkProductUploadModal from "@/components/admin/BulkProductUploadModal"
import ProductsManagerTable from "@/components/admin/ProductsManagerTable"
import { withFastTimeout } from "@/lib/fast-data"
import { Package, Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  let products: any[] = []
  try {
    products = await withFastTimeout(
      prisma.product.findMany({
        include: {
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
          variants: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      [],
      2500
    )
  } catch (err) {
    console.warn("Products fetch notice:", err)
    products = []
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Package size={24} className="text-brand-600" />
            Product Catalog & Live Inventory ({products.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage formulations, live stock, pricing, and variant availability across your webstore.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={14} /> Add New Product
          </Link>
          <BulkProductUploadModal />
        </div>
      </div>

      <ProductsManagerTable initialProducts={products} />
    </div>
  )
}