# NUTRATEIN — Design System & UI Standards

> **Brand**: NUTRATEIN ("Clean Nutrition, Pure Strength")  
> **Styling Framework**: Tailwind CSS 3.4.17 with CSS Variables & Class-Based Dark Mode  
> **Typography**: Inter / System-UI Font Stack  
> **Document Version**: 2.0.0

---

## 1. Brand Identity & Color Palette

The NUTRATEIN design system is built around high-energy, athletic aesthetics balanced with clean, laboratory-grade credibility.

### Color Tokens

```css
/* Core Palette in HSL & Hex */
--brand-primary:   #ea580c;  /* hsl(24 95% 53%) - High energy orange */
--brand-gradient:  linear-gradient(to right, #ea580c, #f97316);
--dark-body:       #09090b;  /* Zinc 950 - Ultra-dark background */
--light-body:      #ffffff;  /* Pure white background */
--text-primary:    #18181b;  /* Zinc 900 in light mode */
--text-muted:      #71717a;  /* Zinc 500 */
--border-subtle:   #e4e4e7;  /* Zinc 200 light mode */
--border-dark:     #27272a;  /* Zinc 800 dark mode */
```

### Palette Scale Breakdown

| Token Name | Hex Code | Purpose / Application |
| :--- | :--- | :--- |
| `brand-50` | `#fff7ed` | Subtle highlight pills, badge backgrounds. |
| `brand-100` | `#ffedd5` | Light hover states, accent cards. |
| `brand-500` | `#f97316` | Secondary brand glow, interactive icons. |
| `brand-600` | `#ea580c` | Primary buttons, active navigation, call-to-action elements. |
| `brand-700` | `#c2410c` | Button hover and active press states. |
| `zinc-950` | `#09090b` | Dark mode body background, high-contrast dark buttons. |
| `zinc-900` | `#18181b` | Light mode headings, dark mode cards and surfaces. |
| `zinc-800` | `#27272a` | Dark mode borders, elevated input backgrounds. |
| `zinc-100` | `#f4f4f5` | Light mode secondary button surfaces, neutral pills. |
| `emerald-600` | `#059669` | Success badges, stock "IN STOCK", positive savings. |
| `amber-500` | `#f59e0b` | Star reviews, loyalty points, "LOW STOCK" alerts. |
| `rose-600` | `#e11d48` | Wishlist heart, error badges, "OUT OF STOCK" indicator. |
| `purple-600` | `#9333ea` | Recurring subscriptions badge, VIP perks, admin controls. |

---

## 2. Typography & Hierarchy

- **Font Family**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Feature Settings**: `font-feature-settings: "rlig" 1, "calt" 1;` (improved character ligatures)
- **Rendering**: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`

| Element / Class | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `36px - 48px` | `900` (Black) | `1.1` | `-0.025em` | Hero section main banners |
| **Section Title** (`.section-title`) | `24px - 32px` | `800` (ExtraBold) | `1.2` | `-0.02em` | Homepage & Catalog category headers |
| **Section Subtitle** (`.section-subtitle`) | `12px - 14px` | `400` (Regular) | `1.5` | `normal` | Descriptive subtitle text below headers |
| **Card Title** | `14px - 16px` | `700` (Bold) | `1.3` | `-0.01em` | Product card titles, modal titles |
| **Body Text** | `13px - 14px` | `400` / `500` | `1.6` | `normal` | Product descriptions, articles |
| **Micro Copy / Meta** | `10px - 11px` | `600` / `700` | `1.4` | `0.05em` | Badges, timestamps, variant pills |

---

## 3. UI Component Specifications

### A. Buttons

```html
<!-- Primary CTA Button -->
<button class="btn-primary">Shop Now</button>

<!-- Secondary Neutral Button -->
<button class="btn-secondary">View Details</button>

<!-- Brand Outline Button -->
<button class="btn-outline-brand">Add to Wishlist</button>

<!-- Ghost Icon Button -->
<button class="btn-ghost" aria-label="Search"><Search size={18} /></button>

<!-- Dark Solid Button -->
<button class="btn-dark">Admin Console</button>
```

- **`.btn-primary`**:
  - Gradient: `from-brand-600 to-orange-500`
  - Border Radius: `rounded-xl` (12px)
  - Shadow: `shadow-sm hover:shadow-lg hover:shadow-brand-500/25`
  - Interaction: `hover:scale-[1.02] active:scale-[0.97]` with smooth 200ms transition.

### B. Product Cards & Packaging Display Rules

```html
<div class="card p-4 flex flex-col justify-between">
  <div class="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/50 p-3">
    <!-- CRITICAL: Packaging images MUST use object-contain -->
    <Image 
      src={product.image} 
      alt={product.name} 
      fill 
      className="object-contain transition-transform duration-300 group-hover:scale-105" 
    />
  </div>
  ...
</div>
```

> [!IMPORTANT]
> **Packaging Image Integrity Rule**:  
> Supplement packaging (protein jars, creatine tubs, shakers) contains essential brand labels, weights, and nutritional badges.  
> **NEVER use `object-cover` on product packaging images**, as it crops the top of the bottle or bottom label. Always use `object-contain` with clean padding inside an `aspect-square` container.

### C. Promotional Banners & Hero Containers

- **Desktop Banners**: Landscape aspect ratio (`16:9` or `21:9`), responsive height (`min-h-[420px]`). Text overlays must use readable gradient backdrops or high-contrast shadows.
- **Mobile Banners**: Square or portrait aspect ratio (`4:3` or `1:1`) to prevent miniature unreadable text on mobile screens.
- **Rotation Carousel**: Smooth 5.5s autoplay timer with pause on hover.

### D. Badges & Micro Status Pills

- `.badge-brand`: Highlighting "BESTSELLER", "100% PURE", "NEW LAUNCH".
- `.badge-green`: "IN STOCK", "CERTIFIED CLEAN", "7-DAY REPLACEMENTS".
- `.badge-orange`: "LOW STOCK (N left)", "LIMITED TIME".
- `.badge-red`: "OUT OF STOCK", "FLAT 20% OFF".

---

## 4. Responsive Breakpoints & Device Targets

| Breakpoint | Min-Width | Target Devices | UX Adaptations |
| :--- | :--- | :--- | :--- |
| **Base (Mobile)** | `0px - 639px` | iPhone SE, 13/14/15, Galaxy S | Single column grid, slide-down hamburger drawer, full-width checkout buttons. |
| **`sm` (Large Mobile)** | `640px` | Large phones in landscape, phablets | 2-column product grid, compact cart preview. |
| **`md` (Tablet)** | `768px` | iPad, Galaxy Tab | 2 to 3-column product grid, top navigation visible. |
| **`lg` (Desktop)** | `1024px` | Laptops, MacBooks | 4-column product grid, persistent mega menu dropdowns, side filters. |
| **`xl` (Wide)** | `1280px` | Desktop displays, iMacs | Max-width container (`max-w-7xl`), expanded hero coverflow. |

---

## 5. Horizontal Overflow Protection (Zero-Overflow Policy)

To eliminate horizontal scrolling and unwanted page wobble on mobile devices:
1. `html` and `body` in `src/app/globals.css` enforce:
   ```css
   html, body {
     overflow-x: hidden;
     box-sizing: border-box;
     -webkit-text-size-adjust: 100%;
   }
   ```
2. Carousels and multi-card sliders must wrap flex tracks inside `overflow-x-auto` or `overflow-hidden` containers with `scrollbar-none`.
3. Never specify hardcoded pixel widths exceeding `320px` without `max-w-full`.
