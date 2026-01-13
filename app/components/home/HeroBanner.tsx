'use client'

import Image from 'next/image'
import Link from 'next/link'

interface HeroBannerProps {
  imageUrl?: string
}

export default function HeroBanner({
  imageUrl = 'https://res.cloudinary.com/dt1d75zg0/image/upload/v1754059915/malmequer-hero-banner-01_pyb8un.jpg',
}: HeroBannerProps) {
  return (
    <section className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[85vh] overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt="Hero banner"
          fill
          className="object-cover object-center opacity-90"
          priority
          sizes="100vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40 sm:bg-gradient-to-r sm:from-pink-900/30 sm:via-transparent sm:to-purple-900/20" />
      </div>

      <div className="relative h-full flex items-end sm:items-center pb-12 sm:pb-0">
        <div className="container mx-auto px-6 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              Elegância em
              <span className="block bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
                Cada Detalhe
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 leading-relaxed drop-shadow-lg">
              Descubra a coleção que realça a sua beleza natural
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-sm mx-auto sm:mx-0">
              <Link
                href="/ver-tudo"
                className="flex items-center justify-center text-center px-8 py-4 bg-white text-gray-900 rounded-full font-semibold leading-none active:scale-95 sm:hover:scale-105 transition-all shadow-xl touch-manipulation"
              >
                Explorar Coleção
              </Link>
              <Link
                href="/ver-tudo"
                className="flex items-center justify-center text-center px-8 py-4 bg-pink-500 text-white rounded-full font-semibold leading-none active:scale-95 sm:hover:scale-105 transition-all shadow-xl backdrop-blur-sm touch-manipulation"
              >
                Novidades
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
