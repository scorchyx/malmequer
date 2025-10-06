'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface HeroBannerProps {
  imageUrl?: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
}

export default function HeroBanner({
  imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg', // Placeholder - substituir com a tua imagem
  title = 'Descobre a Nossa Nova Coleção',
  subtitle = 'Produtos de qualidade com entregas rápidas em todo o país',
  ctaText = 'Explorar Produtos',
  ctaLink = '/products',
}: HeroBannerProps) {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-100">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt="Hero banner"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4">
        <div className="flex h-full items-center">
          <div className="max-w-2xl">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-lg">
              {subtitle}
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={ctaLink}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors group"
              >
                {ctaText}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-gray-900 transition-colors"
              >
                Ver Categorias
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="flex flex-col items-center gap-2 text-white animate-bounce">
          <span className="text-sm font-medium">Scroll</span>
          <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white rounded-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
