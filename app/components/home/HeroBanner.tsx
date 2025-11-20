'use client'

import Image from 'next/image'

interface HeroBannerProps {
  imageUrl?: string
}

export default function HeroBanner({
  imageUrl = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
}: HeroBannerProps) {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-100">
      <Image
        src={imageUrl}
        alt="Hero banner"
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
        quality={90}
      />
    </section>
  )
}
