import type { Metadata } from "next"
import "./globals.css"
import SessionProvider from "@/components/providers/SessionProvider"
import { Toaster } from "sonner"
import NutraTeinLoader from "@/components/ui/NutraTeinLoader"
import CookieConsentBanner from "@/components/CookieConsentBanner"
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nutratein.in"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NUTRA TEIN – Premium Fitness Supplements",
    template: "%s | NUTRA TEIN",
  },
  description:
    "India's premium fitness supplement brand. Shop Whey Protein, Creatine, Pre-Workout, Mass Gainers, BCAAs and more. Quality guaranteed.",
  keywords: ["protein", "whey protein", "supplements", "fitness", "creatine", "pre-workout", "BCAA"],
  openGraph: {
    title: "NUTRA TEIN – Premium Fitness Supplements",
    description: "Fuel Your Strength. Build Your Future.",
    url: siteUrl,
    type: "website",
    locale: "en_IN",
    siteName: "NUTRA TEIN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NUTRA TEIN – Premium Fitness Supplements",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NUTRA TEIN – Premium Fitness Supplements",
    description: "Fuel Your Strength. Build Your Future.",
    creator: "@nutratein",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Proper mobile viewport — critical for phone responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />

        {/* Priority hints: Preconnect & DNS-Prefetch for connection reuse */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.remove('dark');localStorage.setItem('theme', 'light')}catch(e){}})()`,
          }}
        />
        {/* Security: Disable right-click and DevTools shortcuts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){document.addEventListener('contextmenu',function(e){e.preventDefault();});document.addEventListener('keydown',function(e){if(e.key==='F12'){e.preventDefault();return false;}if(e.ctrlKey&&e.shiftKey&&['I','J','C'].includes(e.key.toUpperCase())){e.preventDefault();return false;}if(e.ctrlKey&&e.key.toUpperCase()==='U'){e.preventDefault();return false;}if(e.metaKey&&e.altKey&&e.key.toUpperCase()==='I'){e.preventDefault();return false;}});})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased text-dark-900 bg-white selection:bg-brand-500 selection:text-white transition-colors duration-150">
        <GoogleAnalytics />
        <NutraTeinLoader />
        <CookieConsentBanner />
        <SessionProvider>
          {children}
          <Toaster 

            richColors 
            position="top-right" 
            toastOptions={{
              style: { 
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)'
              },
              className: 'font-sans font-medium text-sm',
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}