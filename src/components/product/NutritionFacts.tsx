"use client"
import { useState } from "react"
import { Info, X, ZoomIn } from "lucide-react"

interface NutritionRow {
  label: string
  value: string
  unit?: string
  indent?: boolean
}

interface Props {
  nutritionInfo?: string | null // JSON string or plain text
  ingredients?: string | null
  nutritionImage?: string | null
  servingSize?: string
}

function parseNutrition(raw: string | null | undefined): NutritionRow[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    // Object format: { "Calories": "150", "Protein": "25g" }
    return Object.entries(parsed).map(([label, value]) => ({ label, value: String(value) }))
  } catch {
    // Plain text - try to parse "Label: Value" lines
    return raw.split('\n').filter(Boolean).map(line => {
      const [label, ...rest] = line.split(':')
      return { label: label.trim(), value: rest.join(':').trim() }
    }).filter(r => r.label && r.value)
  }
}

export default function NutritionFacts({ nutritionInfo, ingredients, nutritionImage, servingSize }: Props) {
  const [imageZoom, setImageZoom] = useState(false)
  const rows = parseNutrition(nutritionInfo)

  const hasData = rows.length > 0 || ingredients || nutritionImage

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <Info size={18} className="text-brand-600" /> Nutrition & Ingredients
      </h3>

      {!hasData ? (
        <p className="text-sm text-zinc-400 italic">Nutrition information currently unavailable.</p>
      ) : (
        <>
          {/* Structured Nutrition Table */}
          {rows.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Nutrition Facts</h4>
              {servingSize && (
                <p className="text-xs text-zinc-500 mb-3">Serving Size: {servingSize}</p>
              )}
              <div className="border border-zinc-800 dark:border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2">
                  <p className="text-xs font-black uppercase tracking-wider">Nutrition Facts</p>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {rows.map((row, i) => (
                    <div key={i} className={`flex justify-between items-center px-4 py-2 text-xs ${
                      row.indent ? 'pl-8' : ''
                    } ${i % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/50'}`}>
                      <span className={`text-zinc-700 dark:text-zinc-300 ${!row.indent ? 'font-semibold' : ''}`}>
                        {row.label}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {row.value}{row.unit ? ` ${row.unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ingredients */}
          {ingredients && (
            <div>
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Ingredients</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                {ingredients}
              </p>
            </div>
          )}

          {/* Nutrition Label Image */}
          {nutritionImage && (
            <div>
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Nutrition Label</h4>
              <div className="relative group cursor-pointer w-fit" onClick={() => setImageZoom(true)}>
                <img src={nutritionImage} alt="Nutrition Label"
                  className="max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-700 object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <ZoomIn size={24} className="text-white" />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fullscreen Image Zoom */}
      {imageZoom && nutritionImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setImageZoom(false)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setImageZoom(false)}>
            <X size={28} />
          </button>
          <img src={nutritionImage} alt="Nutrition Label"
            className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
