import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WishlistItem {
  productId: string
  id?: string
  name: string
  brand: string
  price: number
  mrp: number
  image: string
  slug: string
  rating: number
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  toggleItem: (item: WishlistItem) => void
  toggleWishlist: (item: WishlistItem) => void
  isWishlisted: (productId: string) => boolean
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get()
        const id = item.productId || (item as any).id
        if (!items.find((i) => i.productId === id || (i as any).id === id)) {
          set({ items: [...items, { ...item, productId: id, id }] })
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId && (i as any).id !== productId),
        }))
      },

      toggleItem: (item) => {
        const { items, addItem, removeItem } = get()
        const id = item.productId || (item as any).id
        if (items.some((i) => i.productId === id || (i as any).id === id)) {
          removeItem(id)
        } else {
          addItem(item)
        }
      },

      toggleWishlist: (item) => {
        get().toggleItem(item)
      },

      isWishlisted: (productId) => {
        return get().items.some((i) => i.productId === productId || (i as any).id === productId)
      },

      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId || (i as any).id === productId)
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "proteinx-wishlist",
    }
  )
)