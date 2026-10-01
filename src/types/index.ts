export interface Product {
  id: string
  name: string
  slug: string
  brand: string
  description: string
  shortDesc?: string
  categoryId: string
  basePrice: number
  mrp: number
  discountPercent: number
  rating: number
  reviewCount: number
  isFeatured: boolean
  isBestSeller: boolean
  isNew: boolean
  isActive: boolean
  howToUse?: string
  ingredients?: string
  benefits?: string
  nutritionInfo?: string
  tags?: string
  createdAt: Date
  updatedAt: Date
  category: Category
  images: ProductImage[]
  variants: ProductVariant[]
  reviews?: Review[]
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  alt?: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductVariant {
  id: string
  productId: string
  flavor?: string
  size?: string
  sku: string
  price: number
  stock: number
  isActive: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  sortOrder: number
  _count?: { products: number }
}

export interface CartItemType {
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

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  paymentMethod: string
  paymentStatus: string
  subtotal: number
  discountAmount: number
  shippingAmount: number
  taxAmount: number
  totalAmount: number
  couponCode?: string
  estimatedDelivery?: Date
  createdAt: Date
  updatedAt: Date
  items: OrderItem[]
  address?: Address
  payment?: Payment
}

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  productName: string
  flavor?: string
  size?: string
  product?: Product
}

export interface Address {
  id: string
  userId: string
  name: string
  phone: string
  houseFlat: string
  street: string
  area?: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

export interface Review {
  id: string
  productId: string
  userId: string
  rating: number
  title?: string
  body?: string
  isVerified: boolean
  createdAt: Date
  user?: { name?: string; image?: string }
}

export interface Coupon {
  id: string
  code: string
  description?: string
  discountType: "PERCENT" | "FIXED"
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  isActive: boolean
  expiresAt?: Date
}

export interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  status: string
  method?: string
  transactionId?: string
}

export interface FilterState {
  category: string[]
  brand: string[]
  minPrice: number
  maxPrice: number
  rating: number
  flavor: string[]
  size: string[]
  inStock: boolean
  onSale: boolean
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
