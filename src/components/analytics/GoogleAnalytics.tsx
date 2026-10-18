"use client"

import { useEffect, useState } from "react"
import Script from "next/script"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXXXXX"

// Check if visitor's timezone corresponds to EU, UK, or Switzerland
function isEuOrUkOrChTimezone(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    if (
      tz.startsWith("Europe/") ||
      tz.startsWith("Atlantic/Reykjavik") ||
      tz.startsWith("Atlantic/Canary") ||
      tz.startsWith("Atlantic/Madeira") ||
      tz.startsWith("Atlantic/Azores")
    ) {
      return true
    }
  } catch {}
  return false
}

export default function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState<boolean>(false)

  useEffect(() => {
    const checkConsent = () => {
      try {
        const raw = localStorage.getItem("nutratein_cookie_consent")
        const consent = raw ? JSON.parse(raw) : null
        const isStrictRegion = isEuOrUkOrChTimezone()

        if (isStrictRegion) {
          // In EU/UK/CH, explicitly require opt-in analytics consent
          if (consent && consent.analytics === true) {
            setShouldLoad(true)
          } else {
            setShouldLoad(false)
          }
        } else {
          // Outside EU/UK/CH, load unless explicitly opted out
          if (!consent || consent.analytics !== false) {
            setShouldLoad(true)
          } else {
            setShouldLoad(false)
          }
        }
      } catch {
        setShouldLoad(false)
      }
    }

    checkConsent()

    const handleConsentChange = () => {
      checkConsent()
    }

    window.addEventListener("nutratein_consent_changed", handleConsentChange)
    window.addEventListener("storage", handleConsentChange)

    return () => {
      window.removeEventListener("nutratein_consent_changed", handleConsentChange)
      window.removeEventListener("storage", handleConsentChange)
    }
  }, [])

  if (!shouldLoad || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") {
    // If placeholder or not consented, render inert debug script or null
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true
            });
          `,
        }}
      />
    </>
  )
}
