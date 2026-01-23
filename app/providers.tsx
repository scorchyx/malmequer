'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import CookieBanner from './components/ui/CookieBanner'
import { ToastProvider } from './components/ui/Toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <CookieBanner />
      </ToastProvider>
    </SessionProvider>
  )
}
