"use client";

import { InteractiveProductCard } from "@/components/ui/card-7";
import { toast } from "sonner";

export default function InteractiveProductCardDemo() {
  const sampleProducts = [
    {
      title: "Nitrotein Whey Isolate",
      description: "100% Pure Ultra-Filtered Whey with 27g Protein",
      price: "₹3,199",
      brand: "NUTRATEIN",
      badge: "BEST SELLER",
      imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "CreaCore Monohydrate",
      description: "Micronized 100% Pure Creapure Strength Booster",
      price: "₹1,249",
      brand: "NUTRATEIN",
      badge: "POPULAR",
      imageUrl: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Shredtein Lean Matrix",
      description: "Thermogenic Lean Muscle Protein with CLA & L-Carnitine",
      price: "₹2,899",
      brand: "NUTRATEIN",
      badge: "LEAN CUT",
      imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-zinc-950 p-6 text-white">
      <div className="text-center max-w-xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
          Interactive 3D Perspective Card (card-7)
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          NUTRATEIN Showcase
        </h1>
        <p className="text-sm text-zinc-400">
          Hover and move your cursor across the cards to experience smooth 3D tilt, depth perspective, and glassmorphic headers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center max-w-6xl w-full">
        {sampleProducts.map((p, idx) => (
          <InteractiveProductCard
            key={idx}
            title={p.title}
            description={p.description}
            price={p.price}
            brand={p.brand}
            badge={p.badge}
            imageUrl={p.imageUrl}
            onAddToCart={() => toast.success(`Added ${p.title} to cart!`)}
            onWishlist={() => toast(`Saved ${p.title} to wishlist!`)}
          />
        ))}
      </div>
    </div>
  );
}
