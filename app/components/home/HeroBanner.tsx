'use client'

import Image from 'next/image'
import Link from 'next/link'

interface HeroBannerProps {
  imageUrl?: string
}

export default function HeroBanner({
  imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
}: HeroBannerProps) {
  return (
    <section className="relative w-full h-[85vh] overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt="Hero banner"
          fill
          className="object-cover object-center opacity-90"
          priority
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-900/30 via-transparent to-purple-900/20" />
      </div>

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Elegância em
              <span className="block bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                Cada Detalhe
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-8 leading-relaxed">
              Descubra a coleção que realça a sua beleza natural
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/ver-tudo"
                className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-pink-50 transition-all transform hover:scale-105 text-center shadow-lg"
              >
                Explorar Coleção
              </Link>
              <Link
                href="/ver-tudo"
                className="px-8 py-4 bg-pink-500/90 text-white rounded-full font-semibold hover:bg-pink-600 transition-all transform hover:scale-105 text-center shadow-lg backdrop-blur-sm"
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
