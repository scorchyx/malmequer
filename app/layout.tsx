import type { Metadata } from 'next'
import { Geist, Geist_Mono, Imperial_Script, Encode_Sans_Expanded } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const imperialScript = Imperial_Script({
  weight: '400',
  variable: '--font-imperial-script',
  subsets: ['latin'],
})

// Encode Sans Expanded is visually very similar to Zalando Sans Expanded
const encodeSansExpanded = Encode_Sans_Expanded({
  weight: ['400', '500', '600', '700'],
  variable: '--font-encode-sans-expanded',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Malmequer - Ecommerce Backend',
  description: 'Modern ecommerce backend API built with Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${imperialScript.variable} antialiased`}
        style={{ fontFamily: '"Zalando Sans Expanded", system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
