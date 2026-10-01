import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  houseFlat: z.string().min(1, "House/Flat number is required"),
  street: z.string().min(2, "Street is required"),
  area: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid PIN code"),
  country: z.string().default("India"),
})

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(10, "Review must be at least 10 characters"),
})

export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code is required"),
})

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  brand: z.string().min(2, "Brand is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  shortDesc: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.number().positive("Price must be positive"),
  mrp: z.number().positive("MRP must be positive"),
  discountPercent: z.number().min(0).max(100),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
})

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
export type AddressSchema = z.infer<typeof addressSchema>
export type ReviewSchema = z.infer<typeof reviewSchema>
export type CouponSchema = z.infer<typeof couponSchema>
export type ProductSchema = z.infer<typeof productSchema>
