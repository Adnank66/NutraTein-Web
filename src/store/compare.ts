import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CompareProductItem {
  id: string
  name: string
  brand: string
  price: number
  mrp?: number
  image: string
  slug: string
  rating?: number
  category?: string
  proteinPerServing?: string
  servings?: string
  stock?: number
  nutritionInfo?: string
  shortDescription?: string
}

interface CompareStore {
  items: CompareProductItem[]
  addItem: (item: CompareProductItem) => boolean
  removeItem: (id: string) => void
  toggleCompare: (item: CompareProductItem) => boolean
  isInCompare: (id: string) => boolean
  clearCompare: () => void
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get()
        if (items.some((i) => i.id === item.id)) {
          return false
        }
        if (items.length >= 4) {
          // Replace oldest or cap at 4
          set({ items: [...items.slice(1), item] })
          return true
        }
        set({ items: [...items, item] })
        return true
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }))
      },

      toggleCompare: (item) => {
        const { items, addItem, removeItem } = get()
        const exists = items.some((i) => i.id === item.id)
        if (exists) {
          removeItem(item.id)
          return false
        } else {
          return addItem(item)
        }
      },

      isInCompare: (id) => {
        return get().items.some((i) => i.id === id)
      },

      clearCompare: () => set({ items: [] }),
    }),
    {
      name: "nutratein-compare",
    }
  )
)
