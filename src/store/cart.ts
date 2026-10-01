import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  brand: string
  price: number
  mrp: number
  image: string
  flavor?: string
  size?: string
  quantity: number
  stock: number
  slug: string
}

interface CartStore {
  items: CartItem[]
  lastClearedItems: CartItem[]
  lastRemovedItem: CartItem | null
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: string, variantId?: string) => void
  updateQuantity: (id: string, variantId: string | undefined, quantity: number) => void
  clearCart: () => void
  recoverCart: () => void
  recoverItem: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      lastClearedItems: [],
      lastRemovedItem: null,
      isOpen: false,

      addItem: (newItem) => {
        const { items } = get()
        const existingIndex = items.findIndex(
          (item) =>
            item.id === newItem.id ||
            (item.productId === newItem.productId &&
              item.variantId === newItem.variantId &&
              item.flavor === newItem.flavor &&
              item.size === newItem.size)
        )

        if (existingIndex > -1) {
          const updated = [...items]
          const existing = updated[existingIndex]
          const newQty = Math.min(existing.quantity + newItem.quantity, existing.stock || 99)
          updated[existingIndex] = { ...existing, quantity: newQty }
          set({ items: updated, isOpen: true })
        } else {
          set({ items: [...items, newItem], isOpen: true })
        }
      },

      removeItem: (id, variantId) => {
        const currentItems = get().items
        const match = currentItems.find(
          (item) => item.id === id || (item.productId === id && (!variantId || item.variantId === variantId))
        )
        set((state) => ({
          lastRemovedItem: match || null,
          items: state.items.filter(
            (item) => !(item.id === id || (item.productId === id && (!variantId || item.variantId === variantId)))
          ),
        }))
      },

      updateQuantity: (id, variantId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id || (item.productId === id && (!variantId || item.variantId === variantId))
                ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock || 99)) }
                : item
            )
            .filter((item) => item.quantity > 0),
        }))
      },

      clearCart: () => {
        const current = get().items
        if (current.length > 0) {
          set({ lastClearedItems: current, items: [] })
        }
      },

      recoverCart: () => {
        const { lastClearedItems, items } = get()
        if (lastClearedItems && lastClearedItems.length > 0) {
          set({ items: [...items, ...lastClearedItems], lastClearedItems: [] })
        }
      },

      recoverItem: () => {
        const { lastRemovedItem, items } = get()
        if (lastRemovedItem) {
          set({ items: [...items, lastRemovedItem], lastRemovedItem: null })
        }
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "proteinx-cart",
      partialize: (state) => ({
        items: state.items,
        lastClearedItems: state.lastClearedItems,
      }),
    }
  )
)
