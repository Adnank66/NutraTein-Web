"use client"; // Required for state and event handlers

import * as React from "react";
import { cn } from "@/lib/utils";
import { Flame, Star, ShoppingBag, Heart, ShieldCheck } from "lucide-react";

// --- PROPS INTERFACE ---
export interface InteractiveProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  logoUrl?: string;
  title: string;
  description: string;
  price: string;
  brand?: string;
  badge?: string;
  rating?: number;
  slug?: string;
  onAddToCart?: (e: React.MouseEvent) => void;
  onWishlist?: (e: React.MouseEvent) => void;
  isWishlisted?: boolean;
}

// --- COMPONENT DEFINITION ---
export function InteractiveProductCard({
  className,
  imageUrl,
  logoUrl,
  title,
  description,
  price,
  brand = "NUTRATEIN",
  badge,
  rating,
  slug,
  onAddToCart,
  onWishlist,
  isWishlisted,
  ...props
}: InteractiveProductCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Check prefers-reduced-motion
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // --- MOUSE MOVE HANDLER ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion) return;

    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Max rotation ±8deg based on cursor position relative to center
    const rotateX = ((y - height / 2) / (height / 2)) * -8;
    const rotateY = ((x - width / 2) / (width / 2)) * 8;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.05, 1.05, 1.05)`,
      transition: "transform 0.1s ease-out",
    });
  };

  // --- MOUSE LEAVE HANDLER ---
  const handleMouseLeave = () => {
    if (prefersReducedMotion) return;
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={cn(
        "relative w-full max-w-[340px] aspect-[9/12] rounded-3xl bg-card shadow-xl overflow-hidden cursor-pointer group",
        "transform-style-3d will-change-transform", // Enables 3D transformations for children
        className
      )}
      {...props}
    >
      {/* Background Image - scales slightly to avoid showing edges on tilt */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover rounded-3xl transition-transform duration-500 group-hover:scale-110"
        style={{ transform: "translateZ(-20px) scale(1.1)" }}
        loading="lazy"
      />

      {/* Dynamic Gradient Overlay for high readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 rounded-3xl" />

      {/* Main Content with 3D Pop Effect */}
      <div
        className="absolute inset-0 p-5 flex flex-col justify-between"
        style={{ transform: "translateZ(40px)" }}
      >
        {/* Top Header with Glassmorphic styling */}
        <div className="flex items-start justify-between rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md shadow-sm">
          <div className="flex flex-col pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              {brand}
            </span>
            <h3 className="text-lg font-bold text-white leading-tight line-clamp-1">
              {title}
            </h3>
            <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{description}</p>
          </div>

          {/* Logo or Brand Symbol */}
          {logoUrl ? (
            <img src={logoUrl} alt={`${brand} Logo`} className="h-5 w-auto max-w-[48px] object-contain" />
          ) : (
            <div className="h-7 w-7 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame size={14} className="fill-orange-400" />
            </div>
          )}
        </div>

        {/* Floating Badges & Controls in middle */}
        <div className="flex items-center justify-between pointer-events-auto">
          {/* Price Tag */}
          <div className="rounded-full bg-black/50 px-3.5 py-1.5 text-sm font-black text-white border border-white/15 backdrop-blur-md shadow-md">
            {price}
          </div>

          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="rounded-full bg-orange-600/90 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow">
                {badge}
              </span>
            )}
            {onWishlist && (
              <button
                type="button"
                onClick={onWishlist}
                className={cn(
                  "h-8 w-8 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center transition-transform active:scale-90",
                  isWishlisted ? "text-rose-500 fill-rose-500" : "text-white hover:text-rose-400"
                )}
                aria-label="Save to wishlist"
              >
                <Heart size={14} className={isWishlisted ? "fill-rose-500" : ""} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section: Rating, Action Button & Pagination Dots */}
        <div className="space-y-3 pt-2">
          {onAddToCart && (
            <button
              type="button"
              onClick={onAddToCart}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ShoppingBag size={14} /> Add to Cart
            </button>
          )}

          {/* Pagination / Quality Indicator Dots */}
          <div className="flex w-full justify-center items-center gap-1.5 pt-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === 0 ? "w-4 bg-orange-400" : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveProductCard;
