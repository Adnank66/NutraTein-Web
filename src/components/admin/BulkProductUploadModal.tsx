"use client"
import { useState, useRef } from "react"
import { UploadCloud, FileSpreadsheet, Download, X, Check, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ParsedProduct {
  name: string
  category: string
  basePrice: string
  mrp: string
  stock: string
  flavor: string
  size: string
  sku: string
  description?: string
}

export default function BulkProductUploadModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedProduct[]>([])
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadSampleTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Category,BasePrice,MRP,Stock,Flavor,Size,SKU,Description\n" +
      "Nitro-Tein Whey Protein,Whey Protein,4499,8499,100,Belgian Chocolate,1 kg,NT-WHEY-1KG,Ultra pure whey isolate\n" +
      "Titan Pump Pre-Workout,Pre-Workout,2999,3999,75,Fruit Punch,450g,TP-PUMP-450G,High energy explosive pump\n" +
      "CreaCore Creatine Monohydrate,Creatine,699,1499,150,Unflavored,100g,CC-CREA-100G,Micronized creatine monohydrate\n"

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "proteinx_products_sample_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
        if (lines.length < 2) {
          toast.error("CSV file is empty or missing headers")
          return
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
        const nameIdx = headers.findIndex((h) => h.includes("name"))
        const catIdx = headers.findIndex((h) => h.includes("cat"))
        const priceIdx = headers.findIndex((h) => h.includes("price") || h.includes("base"))
        const mrpIdx = headers.findIndex((h) => h.includes("mrp"))
        const stockIdx = headers.findIndex((h) => h.includes("stock") || h.includes("qty"))
        const flavorIdx = headers.findIndex((h) => h.includes("flavor") || h.includes("flavour"))
        const sizeIdx = headers.findIndex((h) => h.includes("size") || h.includes("weight"))
        const skuIdx = headers.findIndex((h) => h.includes("sku"))
        const descIdx = headers.findIndex((h) => h.includes("desc"))

        const rows: ParsedProduct[] = []
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
          if (!cols[nameIdx]) continue

          rows.push({
            name: cols[nameIdx] || "Unnamed Product",
            category: cols[catIdx] || "Proteins",
            basePrice: cols[priceIdx] || "999",
            mrp: cols[mrpIdx] || "1499",
            stock: cols[stockIdx] || "50",
            flavor: cols[flavorIdx] || "Chocolate",
            size: cols[sizeIdx] || "1 kg",
            sku: cols[skuIdx] || `SKU-${Date.now().toString(36)}-${i}`,
            description: cols[descIdx] || "Premium fitness supplement",
          })
        }

        setParsedRows(rows)
        toast.success(`Successfully parsed ${rows.length} product(s) from CSV!`)
      } catch (err: any) {
        toast.error("Failed to parse CSV file: " + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmitBulk = async () => {
    if (parsedRows.length === 0) return
    setLoading(true)

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: parsedRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Bulk upload failed")

      toast.success(data.message || `Imported ${parsedRows.length} products!`)
      setIsOpen(false)
      setParsedRows([])
      setFileName("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to import products")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
      >
        <FileSpreadsheet size={15} className="text-emerald-600" />
        Bulk CSV Import
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-950 dark:text-white">Bulk Product CSV Import</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Upload multiple supplement products, prices, and variants at once.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-ghost p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Download banner */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-600 dark:text-zinc-300">
                Need the correct CSV format? Download our pre-filled template:
              </span>
              <button
                onClick={downloadSampleTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition shrink-0"
              >
                <Download size={13} /> Sample CSV
              </button>
            </div>

            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50 dark:bg-zinc-950/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <UploadCloud size={32} className="mx-auto text-zinc-400 mb-2" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {fileName ? `Selected: ${fileName}` : "Click to select or drag and drop a .csv file"}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">Columns: Name, Category, BasePrice, MRP, Stock, Flavor, Size, SKU</p>
            </div>

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <span>Preview ({parsedRows.length} products to import):</span>
                  <button
                    onClick={() => { setParsedRows([]); setFileName("") }}
                    className="text-rose-600 dark:text-rose-400 hover:underline text-[11px]"
                  >
                    Clear
                  </button>
                </div>
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">MRP</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-[11px]">
                          <td className="p-2 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">{r.name}</td>
                          <td className="p-2 text-zinc-600 dark:text-zinc-300">{r.category}</td>
                          <td className="p-2 font-bold text-zinc-900 dark:text-zinc-100">₹{r.basePrice}</td>
                          <td className="p-2 text-zinc-400 line-through">₹{r.mrp}</td>
                          <td className="p-2 text-emerald-600 font-bold">{r.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setIsOpen(false)}
                className="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBulk}
                disabled={loading || parsedRows.length === 0}
                className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Import {parsedRows.length > 0 ? `${parsedRows.length} Products` : "Products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
