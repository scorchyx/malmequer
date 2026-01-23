import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Imperial_Script } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'

// Design System Typography
const cormorantGaramond = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
})

const imperialScript = Imperial_Script({
  weight: '400',
  variable: '--font-imperial-script',
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#E8A83E',
}

export const metadata: Metadata = {
  title: 'Malmequer - Moda e Estilo',
  description: 'Descubra a coleção exclusiva Malmequer. Qualidade premium, peças únicas e entrega rápida.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Malmequer',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${cormorantGaramond.variable} ${inter.variable} ${imperialScript.variable} antialiased`}
      >
        <GoogleAnalytics />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
