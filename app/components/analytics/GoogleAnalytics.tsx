'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function GoogleAnalyticsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Send pageview to GA4
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }, [pathname, searchParams])

  return null
}

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <GoogleAnalyticsInner />
      </Suspense>
    </>
  )
}

// Utility functions for tracking events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// E-commerce specific tracking
export function trackPurchase(transactionId: string, value: number, items: Array<{
  item_id: string
  item_name: string
  price: number
  quantity: number
}>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: 'EUR',
      items: items,
    })
  }
}

export function trackAddToCart(itemId: string, itemName: string, price: number, quantity: number = 1) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'EUR',
      value: price * quantity,
      items: [{
        item_id: itemId,
        item_name: itemName,
        price: price,
        quantity: quantity,
      }],
    })
  }
}

export function trackViewItem(itemId: string, itemName: string, price: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'EUR',
      value: price,
      items: [{
        item_id: itemId,
        item_name: itemName,
        price: price,
      }],
    })
  }
}

export function trackBeginCheckout(value: number, items: Array<{
  item_id: string
  item_name: string
  price: number
  quantity: number
}>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'EUR',
      value: value,
      items: items,
    })
  }
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
